export interface IPauseAnalysis {
    durationSeconds: number;
    pauseCount: number;
    totalPauseSeconds: number;
    longPauseCount: number;
    speechRatio: number;
}

const WINDOW_SECONDS = 0.05;
const MIN_PAUSE_SECONDS = 0.5;
const LONG_PAUSE_SECONDS = 2;

export async function blobToBase64(blob: Blob): Promise<string> {
    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
    });
    return dataUrl.slice(dataUrl.indexOf(',') + 1);
}

export async function analyzePauses(blob: Blob): Promise<IPauseAnalysis> {
    const audioContext = new AudioContext();
    try {
        const buffer = await audioContext.decodeAudioData(await blob.arrayBuffer());
        const samples = buffer.getChannelData(0);
        const windowSize = Math.max(1, Math.floor(buffer.sampleRate * WINDOW_SECONDS));

        //tính rms (độ lớn âm) cho từng cửa sổ 50ms
        const rmsValues: number[] = [];
        for (let start = 0; start < samples.length; start += windowSize) {
            const end = Math.min(start + windowSize, samples.length);
            let sum = 0;
            for (let i = start; i < end; i++) {
                sum += samples[i] * samples[i];
            }
            rmsValues.push(Math.sqrt(sum / (end - start)));
        }

        //ngưỡng im lặng thích nghi theo mức giọng người nói: 15% của percentile 85
        const sorted = [...rmsValues].sort((a, b) => a - b);
        const speechLevel = sorted[Math.floor(sorted.length * 0.85)] ?? 0;
        const silenceThreshold = Math.max(0.006, speechLevel * 0.15);

        //chỉ xét từ tiếng nói đầu tiên đến tiếng nói cuối cùng, bỏ im lặng đầu và cuối file
        const isSpeech = rmsValues.map((rms) => rms >= silenceThreshold);
        const firstSpeech = isSpeech.indexOf(true);
        const lastSpeech = isSpeech.lastIndexOf(true);

        let pauseCount = 0;
        let longPauseCount = 0;
        let totalPauseSeconds = 0;

        if (firstSpeech !== -1) {
            //đếm các chuỗi im lặng liên tiếp >= 0.5s, chuỗi >= 2s tính là pause dài
            let silentRun = 0;
            for (let i = firstSpeech; i <= lastSpeech; i++) {
                if (!isSpeech[i]) {
                    silentRun++;
                    continue;
                }
                const runSeconds = silentRun * WINDOW_SECONDS;
                if (runSeconds >= MIN_PAUSE_SECONDS) {
                    pauseCount++;
                    totalPauseSeconds += runSeconds;
                    if (runSeconds >= LONG_PAUSE_SECONDS) {
                        longPauseCount++;
                    }
                }
                silentRun = 0;
            }
        }

        const speechWindowCount = isSpeech.filter(Boolean).length;
        const speechRatio = rmsValues.length > 0 ? speechWindowCount / rmsValues.length : 0;

        return {
            durationSeconds: buffer.duration,
            pauseCount,
            totalPauseSeconds: Math.round(totalPauseSeconds * 10) / 10,
            longPauseCount,
            speechRatio: Math.round(speechRatio * 1000) / 1000,
        };
    } finally {
        await audioContext.close();
    }
}
