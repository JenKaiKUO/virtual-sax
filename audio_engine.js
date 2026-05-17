// audio_engine.js

import { Midi } from 'https://esm.sh/@tonejs/midi';

export class SaxEngine {
    constructor() {
        this.audioCtx = null;
        this.saxPlayer = null;
        this.currentMidi = null;
        this.manualTimeList = [];
        this.manualTimeIndex = 0;
        this.noteMap = new Map(); // 預處理音符，提升演奏效能
    }

    async init(instrument = "alto_sax", soundfont = "MusicianStrings") {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        // 每次調用 init 時都重新載入指定的音色
        console.log(`🎷 正在載入音色: ${instrument} (${soundfont})...`);
        this.saxPlayer = await Soundfont.instrument(this.audioCtx, instrument, { soundfont: soundfont });
        
        if (this.audioCtx.state === 'suspended') await this.audioCtx.resume();
    }

    // Midi 解析邏輯
    loadMidiData(arrayBuffer) {
        try {
            // 直接使用上面 import 進來的 Midi 類別，乾淨俐落！
            const data = new Uint8Array(arrayBuffer);
            this.currentMidi = new Midi(data); 
            
            this.prepareManualTimeList();
            return this.manualTimeList.length > 0;
        } catch (e) {
            console.error("MIDI 解析失敗:", e);
            return false;
        }
    }

    // 時間點列表邏輯
    prepareManualTimeList() {
        if (!this.currentMidi) return;
        this.manualTimeIndex = 0;
        this.noteMap.clear(); 
        
        const times = new Set();
        
        this.currentMidi.tracks.forEach(track => {
            track.notes.forEach(note => {
                times.add(note.time);
                
                if (!this.noteMap.has(note.time)) {
                    this.noteMap.set(note.time, []);
                }
                this.noteMap.get(note.time).push(note);
            });
        });

        // 排序所有音符出現的時間點
        this.manualTimeList = Array.from(times).sort((a, b) => a - b);
        console.log(`🎷 樂譜解析完成，共有 ${this.manualTimeList.length} 個節拍點`);
    }

    // 手動播放下一音邏輯
    playNext(velocity = 100) {
        if (!this.currentMidi || this.manualTimeList.length === 0) return 0;
        
        if (this.manualTimeIndex >= this.manualTimeList.length) {
            return 1.1; // 結束標記
        }

        const targetTime = this.manualTimeList[this.manualTimeIndex++];
        
        const notesToPlay = this.noteMap.get(targetTime);
        if (notesToPlay) {
            notesToPlay.forEach(note => {
                this.saxPlayer.play(note.midi, this.audioCtx.currentTime, { 
                    gain: (velocity / 127) * (note.velocity || 1),
                    duration: note.duration 
                });
            });
        }

        return this.manualTimeIndex / this.manualTimeList.length;
    }
}
