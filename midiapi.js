//midiapi.js
const API_LIST = "https://imuse.ncnu.edu.tw/Midi-library/api/midis";
const API_DOWNLOAD = (id) => `https://imuse.ncnu.edu.tw/Midi-library/api/midis/${id}/download`;

export async function fetchMidiList() {
    try {
        const response = await fetch(API_LIST);
        if (!response.ok) throw new Error("API 回傳錯誤：" + response.status);
        const data = await response.json();
        return data.items || [];
    } catch (err) {
        console.error("無法抓取 MIDI 清單：", err);
        return [];
    }
}

export async function downloadMidiFile(id) {
    const url = API_DOWNLOAD(id);
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("下載失敗：" + response.status);
        // 直接轉為 ArrayBuffer 供 MidiPlayer 使用
        return await response.arrayBuffer();
    } catch (err) {
        console.error("下載 MIDI 錯誤：", err);
        throw err;
    }
}

export async function fetchMidiByName(targetName = "望春風") {
    try {
        const items = await fetchMidiList();
        const targetSong = items.find(item => 
            (item.title && item.title.includes(targetName)) || 
            (item.filename && item.filename.includes(targetName))
        );
        if (!targetSong) return null;
        const buffer = await downloadMidiFile(targetSong.id);
        return { buffer, songInfo: targetSong };
    } catch (err) {
        return null;
    }
}