'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Typography } from 'antd';
import { PauseCircleFilled, PlayCircleFilled } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import styles from './speaking.pitch-contour.module.css';

interface Props {
    audioUrl: string;
    durationSeconds: number;
    intonation: ISpeakingProsodyIntonation;
    words: ISpeakingProsodyWord[] | undefined;
}

const VIEW_WIDTH = 640;
const VIEW_HEIGHT = 160;
const AXIS_PADDING_TOP = 16;
const AXIS_PADDING_BOTTOM = 20;

function formatClock(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export default function PitchContourCard({ audioUrl, durationSeconds, intonation, words }: Props) {
    const translate = useTranslations('speaking');
    const audioRef = useRef<HTMLAudioElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);

    const contour = intonation.pitchContour;
    const totalDuration = useMemo(() => {
        const lastPoint = contour?.[contour.length - 1]?.t ?? 0;
        return Math.max(durationSeconds, lastPoint, 0.1);
    }, [contour, durationSeconds]);

    //rAF thay vì chỉ dựa vào timeupdate — timeupdate chỉ bắn vài lần/giây nên playhead sẽ giật
    useEffect(() => {
        if (!isPlaying) {
            return;
        }
        let animationFrameId: number;
        const tick = () => {
            if (audioRef.current) {
                setCurrentTime(audioRef.current.currentTime);
            }
            animationFrameId = requestAnimationFrame(tick);
        };
        animationFrameId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(animationFrameId);
    }, [isPlaying]);

    if (!contour || contour.length === 0) {
        return (
            <div className={styles.card}>
                <Typography.Text type="secondary">{translate('pitch_contour_no_data')}</Typography.Text>
            </div>
        );
    }

    const f0Values = contour.map((point) => point.f0).filter((f0): f0 is number => f0 !== null);
    const f0Min = f0Values.length > 0 ? Math.min(...f0Values) * 0.92 : 70;
    const f0Max = f0Values.length > 0 ? Math.max(...f0Values) * 1.08 : 400;

    const xForTime = (t: number) => (t / totalDuration) * VIEW_WIDTH;
    const yForF0 = (f0: number) => {
        const usableHeight = VIEW_HEIGHT - AXIS_PADDING_TOP - AXIS_PADDING_BOTTOM;
        const ratio = (f0 - f0Min) / Math.max(1, f0Max - f0Min);
        return AXIS_PADDING_TOP + usableHeight * (1 - Math.min(1, Math.max(0, ratio)));
    };

    //nối các điểm có giọng thành từng đoạn liên tục — khoảng lặng (f0=null) tự động cắt path, tạo ra khoảng hở đúng nghĩa
    let pathData = '';
    let isDrawing = false;
    for (const point of contour) {
        if (point.f0 === null) {
            isDrawing = false;
            continue;
        }
        const x = xForTime(point.t);
        const y = yForF0(point.f0);
        pathData += `${isDrawing ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)} `;
        isDrawing = true;
    }

    const areaPath = pathData
        ? `${pathData}L${xForTime(contour[contour.length - 1].t).toFixed(1)},${VIEW_HEIGHT} L${xForTime(contour[0].t).toFixed(1)},${VIEW_HEIGHT} Z`
        : '';

    const playheadX = xForTime(Math.min(currentTime, totalDuration));
    const activeWordIndex = words?.findIndex((word) => currentTime >= word.start && currentTime < word.end) ?? -1;

    const togglePlay = () => {
        if (!audioRef.current) {
            return;
        }
        if (audioRef.current.paused) {
            audioRef.current.play();
        } else {
            audioRef.current.pause();
        }
    };

    const seekToClientX = (clientX: number) => {
        if (!svgRef.current || !audioRef.current) {
            return;
        }
        const rect = svgRef.current.getBoundingClientRect();
        const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
        const time = ratio * totalDuration;
        audioRef.current.currentTime = time;
        setCurrentTime(time);
    };

    return (
        <div className={styles.card}>
            <audio
                ref={audioRef}
                src={audioUrl}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
            />

            <div className={styles.controlsRow}>
                <Button
                    type="text"
                    shape="circle"
                    size="large"
                    icon={isPlaying ? <PauseCircleFilled /> : <PlayCircleFilled />}
                    onClick={togglePlay}
                    className={styles.playButton}
                />
                <span className={styles.clock}>
                    {formatClock(currentTime)} / {formatClock(totalDuration)}
                </span>
            </div>

            <svg
                ref={svgRef}
                viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
                className={styles.chart}
                preserveAspectRatio="none"
                onClick={(event) => seekToClientX(event.clientX)}
            >
                <defs>
                    <linearGradient id="pitchLineGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                    <linearGradient id="pitchAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.28" />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {words?.map((word) => (
                    <line
                        key={`${word.word}-${word.start}`}
                        x1={xForTime(word.start)}
                        x2={xForTime(word.start)}
                        y1={VIEW_HEIGHT - AXIS_PADDING_BOTTOM}
                        y2={VIEW_HEIGHT - AXIS_PADDING_BOTTOM + 6}
                        className={styles.wordTick}
                    />
                ))}

                {areaPath && <path d={areaPath} fill="url(#pitchAreaGradient)" stroke="none" />}
                {pathData && <path d={pathData} fill="none" stroke="url(#pitchLineGradient)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />}

                <line
                    x1={playheadX}
                    x2={playheadX}
                    y1={0}
                    y2={VIEW_HEIGHT}
                    className={styles.playhead}
                />
            </svg>

            {words && words.length > 0 && (
                <p className={styles.karaokeText}>
                    {words.map((word, index) => (
                        <span
                            key={`${word.word}-${word.start}`}
                            className={
                                index === activeWordIndex
                                    ? styles.wordActive
                                    : index < activeWordIndex
                                    ? styles.wordSpoken
                                    : styles.wordUpcoming
                            }
                        >
                            {word.word}{' '}
                        </span>
                    ))}
                </p>
            )}

            <Typography.Text type="secondary" className={styles.hint}>
                {translate('pitch_contour_hint')}
            </Typography.Text>
        </div>
    );
}
