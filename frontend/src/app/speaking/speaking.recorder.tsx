'use client';
import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Card, message, Space, Spin, Tag } from 'antd';
import { ArrowLeftOutlined, AudioOutlined, BorderOutlined, RedoOutlined, SendOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { handleSubmitSpeakingAttemptAction } from '@/utils/actions';
import { analyzePauses, blobToBase64 } from './speaking.audio';
import SpeakingResult from './speaking.result';
import styles from './page.module.css';

type RecorderPhase = 'ready' | 'prep' | 'recording' | 'recorded' | 'submitting' | 'result';

const PREP_SECONDS = 60;
const MIN_RECORD_SECONDS = 3;
const KNOWN_ERROR_CODES = [
    'SPEAKING_QUESTION_NOT_FOUND', 
    'SPEAKING_AUDIO_TOO_LARGE',
    'SPEAKING_GRADING_FAILED',
    'SPEAKING_STORAGE_FAILED', 
    'SPEAKING_AUDIO_SILENT',
    'SPEAKING_NOT_ENGLISH'
    ];


const MIN_SPEECH_RATIO = 0.05;

function formatSeconds(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

interface Props {
    question: ISpeakingQuestion;
    onBack: () => void;
}

export default function SpeakingRecorder({ question, onBack }: Props) {
    const [phase, setPhase] = useState<RecorderPhase>('ready');
    const [prepSecondsLeft, setPrepSecondsLeft] = useState(PREP_SECONDS);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [attempt, setAttempt] = useState<ISpeakingAttempt | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const recordStartRef = useRef(0);
    const finalElapsedRef = useRef(0);
    const audioUrlRef = useRef<string | null>(null);

    const translate = useTranslations('speaking');
    const translateErrors = useTranslations('errors');

    const maxRecordSeconds = question.part === 2 ? 130 : 65;

    useEffect(() => {
        return () => {
            stopTimer();
            mediaRecorderRef.current?.stream?.getTracks().forEach((track) => track.stop());
            if (audioUrlRef.current) {
                URL.revokeObjectURL(audioUrlRef.current);
            }
        };
    }, []);

    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const startPrep = () => {
        setPrepSecondsLeft(PREP_SECONDS);
        setPhase('prep');
        timerRef.current = setInterval(() => {
            setPrepSecondsLeft((previous) => previous - 1);
        }, 1000);
    };

    //hết giờ chuẩn bị thì tự động bắt đầu ghi âm
    useEffect(() => {
        if (phase === 'prep' && prepSecondsLeft <= 0) {
            startRecording();
        }
    }, [phase, prepSecondsLeft]);

    const startRecording = async () => {
        stopTimer();
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                },
            });
            const preferredTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
            const mimeType = preferredTypes.find((type) => MediaRecorder.isTypeSupported(type));
            const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

            chunksRef.current = [];
            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };
            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
                if (audioUrlRef.current) {
                    URL.revokeObjectURL(audioUrlRef.current);
                }
                const url = URL.createObjectURL(blob);
                audioUrlRef.current = url;
                setAudioBlob(blob);
                setAudioUrl(url);
                stream.getTracks().forEach((track) => track.stop());
                setPhase('recorded');
            };

            mediaRecorderRef.current = recorder;
            recorder.start();
            recordStartRef.current = Date.now();
            setElapsedSeconds(0);
            setPhase('recording');

            timerRef.current = setInterval(() => {
                const seconds = (Date.now() - recordStartRef.current) / 1000;
                setElapsedSeconds(seconds);
                if (seconds >= maxRecordSeconds) {
                    stopRecording();
                }
            }, 250);
        } catch {
            message.error(translate('mic_error'));
            setPhase('ready');
        }
    };

    const stopRecording = () => {
        stopTimer();
        finalElapsedRef.current = (Date.now() - recordStartRef.current) / 1000;
        if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
    };

    const resetToReady = () => {
        if (audioUrlRef.current) {
            URL.revokeObjectURL(audioUrlRef.current);
            audioUrlRef.current = null;
        }
        setAudioBlob(null);
        setAudioUrl(null);
        setAttempt(null);
        setElapsedSeconds(0);
        setPhase('ready');
    };

    const submitRecording = async () => {
        if (!audioBlob) {
            return;
        }
        if (finalElapsedRef.current < MIN_RECORD_SECONDS) {
            message.warning(translate('too_short'));
            return;
        }
        setPhase('submitting');
        try {
            const audioBase64 = await blobToBase64(audioBlob);

            //phân tích pause ở client vì server không decode được audio
            let pauseAnalysis = {
                durationSeconds: finalElapsedRef.current,
                pauseCount: 0,
                totalPauseSeconds: 0,
                longPauseCount: 0,
                speechRatio: 1,
            };
            try {
                pauseAnalysis = await analyzePauses(audioBlob);
            } catch {
                //decode thất bại thì vẫn chấm bài được, chỉ mất số liệu pause
            }

            if (pauseAnalysis.speechRatio < MIN_SPEECH_RATIO) {
                message.warning(translate('no_speech_detected'));
                setPhase('recorded');
                return;
            }

            const durationSeconds = Math.round((pauseAnalysis.durationSeconds || finalElapsedRef.current) * 10) / 10;
            const res = await handleSubmitSpeakingAttemptAction({
                questionId: question.id,
                audioBase64,
                mimeType: (audioBlob.type || 'audio/webm').split(';')[0],
                durationSeconds,
                pauseCount: pauseAnalysis.pauseCount,
                totalPauseSeconds: pauseAnalysis.totalPauseSeconds,
                longPauseCount: pauseAnalysis.longPauseCount,
                speechRatio: pauseAnalysis.speechRatio,
            });

            if (res?.data) {
                setAttempt(res.data);
                setPhase('result');
            } else {
                const code = String(res?.message ?? '');
                if (KNOWN_ERROR_CODES.includes(code)) {
                    message.error(translateErrors(code as Parameters<typeof translateErrors>[0]));
                } else {
                    message.error(translate('submit_failed'));
                }
                setPhase('recorded');
            }
        } catch {
            message.error(translate('submit_failed'));
            setPhase('recorded');
        }
    };

    return (
        <div className={styles.container}>
            <Button type="link" icon={<ArrowLeftOutlined />} onClick={onBack} style={{ paddingLeft: 0 }}>
                {translate('back')}
            </Button>

            <Card style={{ marginBottom: 16 }}>
                <Space style={{ marginBottom: 8 }} wrap>
                    <Tag color="blue">Part {question.part}</Tag>
                    <Tag>{question.topic}</Tag>
                </Space>
                <h2 className={styles.questionText}>{question.questionText}</h2>
                {question.cueCardPoints && question.cueCardPoints.length > 0 && (
                    <div className={styles.cueCard}>
                        <strong>{translate('cue_card_say')}</strong>
                        <ul>
                            {question.cueCardPoints.map((point) => (
                                <li key={point}>{point}</li>
                            ))}
                        </ul>
                    </div>
                )}
                <p className={styles.hint}>{translate(`hint_part${question.part}`)}</p>
            </Card>

            {phase === 'ready' && (
                <Space wrap>
                    {question.part === 2 ? (
                        <>
                            <Button type="primary" size="large" onClick={startPrep}>
                                {translate('start_prep')}
                            </Button>
                            <Button size="large" icon={<AudioOutlined />} onClick={startRecording}>
                                {translate('start_recording')}
                            </Button>
                        </>
                    ) : (
                        <Button type="primary" size="large" icon={<AudioOutlined />} onClick={startRecording}>
                            {translate('start_recording')}
                        </Button>
                    )}
                </Space>
            )}

            {phase === 'prep' && (
                <Card className={styles.centerCard}>
                    <div className={styles.prepLabel}>{translate('prep_title')}</div>
                    <div className={styles.prepCountdown}>{formatSeconds(Math.max(0, prepSecondsLeft))}</div>
                    <Button type="primary" icon={<AudioOutlined />} onClick={startRecording}>
                        {translate('prep_skip')}
                    </Button>
                </Card>
            )}

            {phase === 'recording' && (
                <Card className={styles.centerCard}>
                    <div className={styles.recordingRow}>
                        <span className={styles.recordDot} />
                        <span>{translate('recording_label')}</span>
                    </div>
                    <div className={styles.timerText}>
                        {formatSeconds(elapsedSeconds)} / {formatSeconds(maxRecordSeconds)}
                    </div>
                    <Button danger type="primary" size="large" icon={<BorderOutlined />} onClick={stopRecording}>
                        {translate('stop_recording')}
                    </Button>
                </Card>
            )}

            {phase === 'recorded' && audioUrl && (
                <Card className={styles.centerCard}>
                    <audio controls src={audioUrl} className={styles.audioPlayer} />
                    <Space wrap style={{ marginTop: 16 }}>
                        <Button icon={<RedoOutlined />} onClick={resetToReady}>
                            {translate('re_record')}
                        </Button>
                        <Button type="primary" icon={<SendOutlined />} onClick={submitRecording}>
                            {translate('submit')}
                        </Button>
                    </Space>
                </Card>
            )}

            {phase === 'submitting' && (
                <Card className={styles.centerCard}>
                    <Spin size="large" />
                    <Alert
                        type="info"
                        showIcon={false}
                        message={translate('grading_note')}
                        style={{ marginTop: 16 }}
                    />
                </Card>
            )}

            {phase === 'result' && attempt && (
                <SpeakingResult
                    attempt={attempt}
                    onRetry={resetToReady}
                    onBack={onBack}
                />
            )}
        </div>
    );
}
