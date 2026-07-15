'use client';
import { useEffect, useRef } from 'react';
import styles from './speaking.voice-orb.module.css';

interface Props {
    stream: MediaStream | null;
}

const FFT_SIZE = 1024;
const BAR_COUNT = 64;
const RMS_SMOOTHING = 0.25;
const HUE_SMOOTHING = 0.08;

function lerp(from: number, to: number, amount: number): number {
    return from + (to - from) * amount;
}

export default function VoiceOrb({ stream }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!stream) {
            return;
        }
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }

        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = FFT_SIZE;
        //không nối analyser vào destination — tránh phát lại giọng chính mình (echo)
        source.connect(analyser);

        const frequencyData = new Uint8Array(analyser.frequencyBinCount);
        const timeDomainData = new Uint8Array(analyser.fftSize);

        const context2d = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const size = canvas.clientWidth || 280;
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        context2d?.scale(dpr, dpr);

        let smoothedRms = 0;
        //hue khởi điểm ở dải xanh dương — dịch dần sang tím/hồng khi giọng cao hơn
        let smoothedHue = 210;
        let animationFrameId: number;

        const draw = () => {
            animationFrameId = requestAnimationFrame(draw);
            if (!context2d) {
                return;
            }

            analyser.getByteTimeDomainData(timeDomainData);
            analyser.getByteFrequencyData(frequencyData);

            //rms từ waveform miền thời gian ước lượng âm lượng hiện tại
            let sumSquares = 0;
            for (let i = 0; i < timeDomainData.length; i++) {
                const centered = (timeDomainData[i] - 128) / 128;
                sumSquares += centered * centered;
            }
            const rms = Math.sqrt(sumSquares / timeDomainData.length);
            smoothedRms = lerp(smoothedRms, rms, RMS_SMOOTHING);

            //spectral centroid (trọng tâm phổ tần số) làm proxy cho cao độ giọng — giọng cao thì centroid lệch về tần số cao hơn
            let weightedSum = 0;
            let magnitudeSum = 0;
            for (let i = 0; i < frequencyData.length; i++) {
                weightedSum += i * frequencyData[i];
                magnitudeSum += frequencyData[i];
            }
            const centroid = magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
            const centroidNorm = Math.min(1, Math.max(0, centroid / (frequencyData.length * 0.35)));
            const targetHue = 205 + centroidNorm * 140;
            smoothedHue = lerp(smoothedHue, targetHue, HUE_SMOOTHING);

            const width = canvas.clientWidth || size;
            const height = canvas.clientHeight || size;
            const centerX = width / 2;
            const centerY = height / 2;
            const baseRadius = Math.min(width, height) * 0.22;
            const boost = Math.min(1, smoothedRms * 4);
            const orbRadius = baseRadius * (1 + boost * 0.55);

            //trail mờ dần thay vì clearRect cứng — tạo cảm giác chuyển động mượt
            context2d.fillStyle = 'rgba(8, 11, 22, 0.32)';
            context2d.fillRect(0, 0, width, height);

            //vòng equalizer tròn quanh lõi — mỗi thanh phản ứng theo 1 dải tần số
            const barRadius = orbRadius * 1.35;
            for (let i = 0; i < BAR_COUNT; i++) {
                const bin = Math.floor((i / BAR_COUNT) * frequencyData.length * 0.6);
                const magnitude = frequencyData[bin] / 255;
                const barLength = magnitude * baseRadius * 0.9;
                const angle = (i / BAR_COUNT) * Math.PI * 2;
                const x1 = centerX + Math.cos(angle) * barRadius;
                const y1 = centerY + Math.sin(angle) * barRadius;
                const x2 = centerX + Math.cos(angle) * (barRadius + barLength);
                const y2 = centerY + Math.sin(angle) * (barRadius + barLength);

                context2d.strokeStyle = `hsla(${smoothedHue}, 85%, 65%, ${0.35 + magnitude * 0.5})`;
                context2d.lineWidth = 2.5;
                context2d.lineCap = 'round';
                context2d.beginPath();
                context2d.moveTo(x1, y1);
                context2d.lineTo(x2, y2);
                context2d.stroke();
            }

            //lõi phát sáng — gradient toả tròn, phồng lên theo âm lượng
            const gradient = context2d.createRadialGradient(centerX, centerY, 0, centerX, centerY, orbRadius);
            gradient.addColorStop(0, `hsla(${smoothedHue}, 95%, 78%, 0.95)`);
            gradient.addColorStop(0.6, `hsla(${smoothedHue}, 90%, 58%, 0.7)`);
            gradient.addColorStop(1, `hsla(${smoothedHue}, 90%, 45%, 0)`);
            context2d.fillStyle = gradient;
            context2d.beginPath();
            context2d.arc(centerX, centerY, orbRadius, 0, Math.PI * 2);
            context2d.fill();

            //viền mảnh sát lõi để tạo độ nét khi âm lượng thấp
            context2d.strokeStyle = `hsla(${smoothedHue}, 100%, 85%, 0.6)`;
            context2d.lineWidth = 1.5;
            context2d.beginPath();
            context2d.arc(centerX, centerY, orbRadius * 0.55, 0, Math.PI * 2);
            context2d.stroke();
        };

        draw();

        return () => {
            cancelAnimationFrame(animationFrameId);
            source.disconnect();
            analyser.disconnect();
            audioContext.close().catch(() => {});
        };
    }, [stream]);

    return (
        <div className={styles.stage}>
            <canvas ref={canvasRef} className={styles.canvas} />
        </div>
    );
}
