# 🎷 Virtual Saxophone

一個基於 **電腦視覺 + 手勢辨識 + 即時音訊合成** 的互動式音樂系統。
使用者只需要透過攝影機與手部動作，即可模擬薩克斯風演奏，並支援 MIDI 錄製與匯出。

---

## 🌐 Demo

https://jenkaikuo.github.io/virtual-sax/

---

## 🕹 使用方式

1. 點擊 Start 並允許攝影機
2. 用手指模擬薩克斯風按鍵控制音符
3. 閉上嘴巴時開始吹奏，張開嘴巴停止吹奏
4. 晃動左手可產生抖音（Vibrato）效果 
5. 點擊「🔴 MIDI 錄製」開始/停止錄音，系統會自動下載 .mid 檔案

---

## 🧠 使用技術

* MediaPipe Hands / Face Mesh
* Web Audio API + SoundFont
* midi-writer-js
* HTML5 Canvas

---

## ⚠️ 注意事項

* 建議使用 Chrome
* 需攝影機設備
* 手機效能可能較低

---

## 👨‍💻 Author

https://github.com/jenkaikuo
