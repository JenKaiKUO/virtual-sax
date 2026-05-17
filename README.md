# 🎷 Virtual Saxophone — 虛擬薩克斯風

A browser-based virtual saxophone powered by **MediaPipe** hand/face tracking and **Soundfont** audio synthesis. No installation required — just open the HTML file, allow camera access, and start playing.

基於瀏覽器的虛擬薩克斯風，使用 **MediaPipe** 手部／臉部追蹤與 **Soundfont** 音頻合成。無需安裝——開啟 HTML 檔案、允許鏡頭權限，即可開始演奏。

---

## ✨ Features — 功能特色

- **Two play modes** — Normal (realistic fingering + breath detection) and Easy (any finger triggers the next note in a score)
  **雙模式** — Normal（真實指法＋氣息偵測）與 Easy（任意手指觸發樂譜下一個音）
- **Real-time hand tracking** via MediaPipe Hands (up to 2 hands)
  **即時手部追蹤**，透過 MediaPipe Hands 支援雙手
- **Breath detection** via MediaPipe Face Mesh — open/close your mouth to blow
  **氣息偵測**，透過 MediaPipe Face Mesh 偵測嘴部開合
- **Vibrato** — shake your left hand to add expression
  **抖音效果** — 搖動左手即可加入抖音
- **Multiple instruments & soundfonts** — Soprano / Alto / Tenor / Baritone Sax × MusicianStrings / FluidR3_GM / FatBoy
  **多種樂器與音色庫** — 高音／中音／次中音／上低音薩克斯風，搭配三種音色庫
- **MIDI recording** — record your performance and download as a `.mid` file (Normal mode)
  **MIDI 錄製** — 錄製演奏並下載為 `.mid` 檔（Normal 模式）
- **Score follow** — load a MIDI file and advance note-by-note with finger gestures (Easy mode)
  **跟隨樂譜** — 載入 MIDI 檔，以手指動作逐音推進（Easy 模式）

---

## 🖥️ Demo

https://jenkaikuo.github.io/virtual-sax/


---

## 📁 Project Structure — 專案結構

```
virtual-saxophone/
├── index.html          # Main entry point / 主頁面
├── audio_engine.js     # SaxEngine — Soundfont playback & MIDI sequencing / 音頻引擎
├── midiapi.js          # API helpers — fetch & download MIDI files / MIDI 資料存取
└── style.css
```

---

## 🎮 How to Play — 遊玩方式

### Normal Mode — 真實指法模式

Hand and face are tracked simultaneously. / 同時追蹤雙手與臉部。

| Action / 動作 | Effect / 效果 |
|---|---|
| Press finger combinations (both hands) / 按下手指組合（雙手） | Select a note / 選擇音符 |
| Open mouth / 張嘴 | Note plays / 開始發音 |
| Close mouth / 閉嘴 | Note stops / 停止發音 |
| Shake left hand / 搖動左手 | Vibrato / 抖音 |
| Left thumb press / 左手拇指按下 | Octave up / 升高一個八度 |

**Fingering Chart / 指法對照表：**

| Left hand / 左手 | Right hand / 右手 | Note / 音符 |
|---|---|---|
| Index + Middle + Ring | — | G4 |
| Index + Middle + Ring | Index | F4 |
| Index + Middle + Ring | Middle | F#4 |
| Index + Middle + Ring | Index + Middle | E4 |
| Index + Middle + Ring | Index + Middle + Ring | D4 |
| Index + Middle + Ring | All four / 四指 | C4 |
| Index + Middle + Ring + Pinky | — | G#4 |
| Index only / 僅食指 | — | B4 |
| Index + Middle | — | A4 |
| Middle only / 僅中指 | — | C5 |
| + Left Thumb / ＋左拇指 | — | +1 octave / ＋一個八度 |

### Easy Mode — 跟隨樂譜模式

1. Select a song from the dropdown / 從下拉選單選擇樂曲
2. Choose instrument and soundfont / 選擇樂器與音色庫
3. Click **確定載入樂譜** to load / 點擊按鈕載入
4. Any finger bend or release advances to the next note / 任意手指彎曲或放開即觸發下一個音
5. The progress bar shows how far through the piece you are / 進度條顯示演奏進度

---

## 🎛️ Controls — 控制面板

| Control / 控制項 | Description / 說明 |
|---|---|
| Volume slider / 音量滑桿 | Master output volume / 主輸出音量 |
| Vibrato sensitivity / 抖音靈敏度 | How much hand movement affects vibrato / 手部晃動對抖音的影響程度 |
| Hand guide lines / 手部提示線 | Toggle skeleton overlay / 顯示或隱藏手部骨架 |
| Breath detection dot / 氣息偵測點 | Toggle mouth landmark display / 顯示或隱藏嘴部偵測標記 |
| Instrument / 樂器 | Alto / Soprano / Tenor / Baritone Sax |
| Soundfont / 音色庫 | MusicianStrings / FluidR3_GM / FatBoy |
| Record button / 錄製按鈕 | Start/stop MIDI recording (Normal mode) / 開始或停止 MIDI 錄製（Normal 模式） |

---

## 🛠️ Tech Stack — 技術棧

| Library / 函式庫 | Purpose / 用途 |
|---|---|
| [MediaPipe Hands](https://google.github.io/mediapipe/solutions/hands) | Real-time 21-landmark hand tracking / 即時 21 點手部追蹤 |
| [MediaPipe Face Mesh](https://google.github.io/mediapipe/solutions/face_mesh) | 468-landmark face tracking for breath detection / 468 點臉部追蹤，用於氣息偵測 |
| [MediaPipe Camera Utils](https://www.npmjs.com/package/@mediapipe/camera_utils) | Webcam frame pipeline / 鏡頭畫面串流處理 |
| [Soundfont Player](https://github.com/danigb/soundfont-player) | Web Audio API instrument synthesis / Web Audio 樂器音色合成 |
| [MidiWriter.js](https://github.com/grimmdude/MidiWriterJS) | MIDI file export / MIDI 檔案匯出 |

All libraries loaded via CDN — no `npm install` required. / 所有函式庫透過 CDN 載入，無需 `npm install`。

---

## 👨‍💻 Author

https://github.com/jenkaikuo
