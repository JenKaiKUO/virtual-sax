import cv2
import mediapipe as mp
import time
import math
import pygame.midi
import numpy as np

# ===== 1. MIDI 初始化與設定 (保持不變) =====
pygame.midi.init()
# 請確保此處的 device_id 是您正確的 MIDI 輸出埠
device_id = 2 
midi_out = pygame.midi.Output(device_id)
midi_out.set_instrument(65)
print("已連接 MIDI 裝置 (請確認 device_id)")

# ===== 2. MediaPipe 模型初始化 (新增 Face Mesh) =====
mp_drawing = mp.solutions.drawing_utils
mp_hands = mp.solutions.hands
mp_face_mesh = mp.solutions.face_mesh # 引入 Face Mesh

# 手部模型 (用於指法)
hands = mp_hands.Hands(max_num_hands=2,
                       min_detection_confidence=0.6,
                       min_tracking_confidence=0.6)

# 臉部模型 (用於嘴部斷奏)
face_mesh = mp_face_mesh.FaceMesh(max_num_faces=1,
                                  refine_landmarks=True,
                                  min_detection_confidence=0.5,
                                  min_tracking_confidence=0.5)

# 臉部關鍵點：嘴唇上下中點
LIP_TOP = 13
LIP_BOTTOM = 14
# 嘴部開合閾值 (需要根據您的攝影機和臉型調整)
MOUTH_OPEN_THRESH = 0.025 
is_mouth_open = True # 追蹤嘴巴狀態

# ===== 3. 攝影機與基礎參數 (保持不變) =====
cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("無法開啟攝影機")
    exit()

DIST_PRESS_THRESH = 0.08
THUMB_TIP = 4
INDEX_TIP, INDEX_MCP = 8, 5
MIDDLE_TIP, MIDDLE_MCP = 12, 9
RING_TIP, RING_MCP = 16, 13
PINKY_TIP, PINKY_MCP = 20, 17

def normalized_distance(a, b):
    # a, b 是 MediaPipe Landmark 物件
    return math.hypot(a.x - b.x, a.y - b.y)

def is_pressed(tip, mcp):
    return normalized_distance(tip, mcp) < DIST_PRESS_THRESH

def get_hand_type(handedness):
    return "L" if handedness.classification[0].label == "Left" else "R"

def midi_to_note_name(midi):
    if midi is None: return "-"
    note_names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    octave = midi // 12 - 1
    note_index = midi % 12
    return f"{note_names[note_index]}{octave}"

current_note = None

print("🎷 Virtual Sax READY (Mouth Control Enabled)")

try:
    while True:
        ret, frame = cap.read()
        if not ret:
            continue

        frame = cv2.flip(frame, 1)
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # --- 運行兩個模型 ---
        hand_results = hands.process(rgb)
        face_results = face_mesh.process(rgb)

        L = {"idx": False, "mid": False, "rng": False, "pnk": False, "thumb": False}
        R = {"idx": False, "mid": False, "rng": False, "pnk": False}

        # ===== 4. 手部偵測與指法判斷 (保持不變) =====
        if hand_results.multi_hand_landmarks:
            for hand_landmarks, handedness in zip(hand_results.multi_hand_landmarks,
                                                  hand_results.multi_handedness):

                hand_type = get_hand_type(handedness)
                lm = hand_landmarks.landmark
                # 繪製手部標記
                mp_drawing.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)

                if hand_type == "L":
                    L["idx"] = is_pressed(lm[INDEX_TIP], lm[INDEX_MCP])
                    L["mid"] = is_pressed(lm[MIDDLE_TIP], lm[MIDDLE_MCP])
                    L["rng"] = is_pressed(lm[RING_TIP], lm[RING_MCP])
                    L["pnk"] = is_pressed(lm[PINKY_TIP], lm[PINKY_MCP])
                    L["thumb"] = is_pressed(lm[THUMB_TIP], lm[2])
                else:
                    R["idx"] = is_pressed(lm[INDEX_TIP], lm[INDEX_MCP])
                    R["mid"] = is_pressed(lm[MIDDLE_TIP], lm[MIDDLE_MCP])
                    R["rng"] = is_pressed(lm[RING_TIP], lm[RING_MCP])
                    R["pnk"] = is_pressed(lm[PINKY_TIP], lm[PINKY_MCP])

        # --- 原始指法邏輯，計算 next_note ---
        next_note = None
        if L["idx"] and L["mid"] and L["rng"]:
            if L["pnk"]:
                next_note = 68
            else:
                if R["idx"] and not R["mid"] and not R["rng"] and not R["pnk"]:
                    next_note = 65
                elif R["mid"] and not R["idx"] and not R["rng"] and not R["pnk"]:
                    next_note = 66
                elif R["idx"] and R["mid"] and not R["rng"] and not R["pnk"]:
                    next_note = 64
                elif R["idx"] and R["mid"] and R["rng"] and not R["pnk"]:
                    next_note = 62
                elif R["idx"] and R["mid"] and R["rng"] and R["pnk"]:
                    next_note = 60
                else:
                    next_note = 67
        elif L["idx"] and not L["mid"] and not L["rng"] and not L["pnk"]:
            next_note = 71
        elif L["idx"] and L["mid"] and not L["rng"] and not L["pnk"]:
            next_note = 69
        elif L["mid"] and not L["idx"] and not L["rng"] and not L["pnk"]:
            next_note = 72
        elif L["idx"] and L["mid"] and L["rng"] and L["pnk"]:
            next_note = 68 

        if next_note is not None and L["thumb"]:
            next_note += 12
        
        # ===== 5. 嘴部偵測與吹奏狀態判斷 (新增) =====
        mouth_status = "CLOSED" # 預設嘴巴閉合 (吹奏)
        new_is_mouth_open = True
        
        if face_results.multi_face_landmarks:
            face_landmarks = face_results.multi_face_landmarks[0]
            
            # 獲取嘴唇上下中點座標
            lm_top = face_landmarks.landmark[LIP_TOP]
            lm_bottom = face_landmarks.landmark[LIP_BOTTOM]
            
            # 計算嘴唇垂直距離 (只關心 Y 軸的差異)
            mouth_dist_y = abs(lm_top.y - lm_bottom.y)
            
            # 繪製嘴唇標記點 (可選)
            h, w, c = frame.shape
            cv2.circle(frame, (int(lm_top.x * w), int(lm_top.y * h)), 3, (0, 165, 255), -1) # 上唇 (橘色)
            cv2.circle(frame, (int(lm_bottom.x * w), int(lm_bottom.y * h)), 3, (0, 165, 255), -1) # 下唇
            
            # 判斷嘴巴是否張開
            if mouth_dist_y < MOUTH_OPEN_THRESH:
                new_is_mouth_open = False # 嘴巴閉合 (吹奏)
                mouth_status = "CLOSED (BLOW)"
            else:
                new_is_mouth_open = True # 嘴巴張開 (停止)
                mouth_status = "OPEN (STOP)"
                
        
        # ===== 6. MIDI 輸出與嘴巴控制邏輯 (修改) =====
        
        note_changed = (next_note != current_note)
        mouth_state_changed = (new_is_mouth_open != is_mouth_open)
        
        # 只有在指法或嘴巴狀態改變時才執行邏輯
        if note_changed or mouth_state_changed:
            
            if next_note is not None:
                # 判斷是否應該發聲：有指法 AND 嘴巴閉合
                if not new_is_mouth_open:
                    # 只有當指法改變 (換音) OR 嘴巴從張開變成閉合 (開始吹奏/斷奏) 時，才啟動新音
                    if note_changed or (mouth_state_changed and is_mouth_open):
                        if current_note is not None:
                            midi_out.note_off(current_note, 0)
                        midi_out.note_on(next_note, 100)
                        current_note = next_note
                
                # 判斷是否應該停止發聲：嘴巴從閉合變成張開 (舌奏中斷)
                elif new_is_mouth_open and mouth_state_changed and not is_mouth_open:
                    if current_note is not None:
                        midi_out.note_off(current_note, 0)
                        current_note = None # 雖然指法沒變，但聲音停止
                
            else:
                # 無指法時，停止所有聲音
                if current_note is not None:
                    midi_out.note_off(current_note, 0)
                current_note = None
                
            is_mouth_open = new_is_mouth_open # 更新狀態

        # ===== 7. 顯示資訊 (修改) =====
        current_display_note = midi_to_note_name(current_note)
        
        cv2.putText(frame, f"Note: {current_display_note}", (10, 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0,255,0), 2)
        cv2.putText(frame, f"Mouth: {mouth_status}", (10, 75),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 165, 255), 2)

        cv2.imshow("Virtual Sax with Mouth Control", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

finally:
    # 資源釋放 (新增 face_mesh.close())
    cap.release()
    cv2.destroyAllWindows()
    hands.close()
    face_mesh.close()
    if current_note:
        midi_out.note_off(current_note, 0)
    midi_out.close()
    pygame.midi.quit()