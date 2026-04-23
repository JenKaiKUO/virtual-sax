import * as api from './midiapi.js';
import { SaxEngine } from './audio_engine.js';

const sax = new SaxEngine();
let cameraInstance = null; 
let lastTriggerTime = 0;
const DEBOUNCE_MS = 50; // 防抖時間（毫秒），避免極短時間內連續觸發

// 🌟 核心修改：分別紀錄左手與右手的狀態
// 索引 0 代表第一隻偵測到的手，索引 1 代表第二隻
let handsState = [
    [false, false, false, false], // 手 A 的四根手指 (食、中、無名、小)
    [false, false, false, false]  // 手 B 的四根手指
];

async function init() {
    const list = await api.fetchMidiList();
    const select = document.getElementById("midi-select");
    if (select) {
        select.innerHTML = '<option value="">-- 請選擇樂曲 --</option>';
        list.forEach(i => select.add(new Option(i.title || i.filename, i.id)));
    }
    document.getElementById("status_msg").innerText = "✅ 系統就緒";
}

window.handleStart = async () => {
    const id = document.getElementById("midi-select").value;
    if (!id) return alert("請選取歌曲");

    try {
        // 1. 開始下載時顯示
        document.getElementById("status_msg").innerText = "⏳ 正在下載樂譜...";
        await sax.init();
        const buffer = await api.downloadMidiFile(id); 
        
        if (sax.loadMidiData(buffer)) {
            // 2. 下載完成，解析成功
            document.getElementById("settings-overlay").style.display = "none";
            document.getElementById("progress-fill").style.width = "0%";
            
            // 改為提示使用者準備好手勢
            document.getElementById("status_msg").innerText = "📷 正在啟動相機...";
            initHands();
        } else {
            alert("樂譜解析失敗，請換一首");
            document.getElementById("status_msg").innerText = "❌ 解析失敗";
        }
    } catch (e) {
        console.error(e);
        document.getElementById("status_msg").innerText = "❌ 載入失敗，請檢查網路";
    }
};

function initHands() {
    if (cameraInstance) {
        // 3. 如果相機已啟動，直接提示開始
        document.getElementById("status_msg").innerText = "🎷 準備就緒！請按下手指開始演奏";
        return;
    }

    const video = document.getElementById('webcam');
    const hands = new Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
    
    hands.setOptions({ 
        maxNumHands: 2, 
        modelComplexity: 1, 
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7 
    });
    
    hands.onResults(onResults);

    cameraInstance = new Camera(video, {
        onFrame: async () => { await hands.send({ image: video }); },
        width: 1280,
        height: 720
    });

    cameraInstance.start().then(() => {
        // 4. 當相機真正開始運作後，更新文字
        document.getElementById("status_msg").innerText = "🎷 畫面已就緒，請按下手指演奏";
    });
}

window.backToMenu = () => {
    document.getElementById("settings-overlay").style.display = "flex";
    document.getElementById("status_msg").innerText = "請選擇樂曲";
    handsState = [[false, false, false, false], [false, false, false, false]];
};


function onResults(results) {
    const canvas = document.getElementById("output_canvas");
    const ctx = canvas.getContext("2d");

    // 1. 動態修正畫布解析度
    if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    ctx.save();
    
    // 2. 清除畫布並繪製原始相機畫面
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    
    ctx.setTransform(1, 0, 0, 1, 0, 0); 

    let triggerNextNote = false;
    const now = Date.now();

    // 3. 檢查是否有偵測到手部
    if (results.multiHandLandmarks) {
        results.multiHandLandmarks.forEach((lm, handIndex) => {
            
            // 
            if (window.drawConnectors && window.drawLandmarks) {
                // 繪製骨架連線
                drawConnectors(ctx, lm, HAND_CONNECTIONS, { 
                    color: '#d4af37', 
                    lineWidth: 4 
                });
                // 繪製關節點
                drawLandmarks(ctx, lm, { 
                    color: '#ffffff', 
                    fillColor: '#d4af37',
                    lineWidth: 1,
                    radius: 3
                });
            }

            const tips = [8, 12, 16, 20];
            const pips = [6, 10, 14, 18];

            for (let i = 0; i < tips.length; i++) {
                // 降低靈敏度判定 (緩衝值 0.05)
                const isCurrentlyDown = lm[tips[i]].y > lm[pips[i]].y + 0.05;

                // 偵測狀態改變（按下或放開）
                if (isCurrentlyDown !== handsState[handIndex][i]) {
                    if (now - lastTriggerTime > DEBOUNCE_MS) {
                        triggerNextNote = true;
                        lastTriggerTime = now;
                    }
                    handsState[handIndex][i] = isCurrentlyDown;
                }
            }
        });
    }

    // 4. 觸發發聲與 UI 更新
    if (triggerNextNote) {
        const progress = sax.playNext();
        
        if (progress >= 1) {
            document.getElementById("status_msg").innerText = "✨ 演奏結束";
            document.getElementById("progress-fill").style.width = "100%";
        } else {
            document.getElementById("progress-fill").style.width = (progress * 100) + "%";
            document.getElementById("status_msg").innerText = "🎷 演奏中...";
        }
    }

    ctx.restore();
}

window.onload = init;