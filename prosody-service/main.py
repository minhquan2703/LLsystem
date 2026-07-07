import asyncio
import logging
import math
import subprocess
import tempfile
import urllib.request
from pathlib import Path

import numpy as np
import parselmouth
from fastapi import FastAPI
from pydantic import BaseModel

import alignment
import rhythm

logger = logging.getLogger("prosody")
app = FastAPI(title="LLsystem Prosody Service", version="0.2.0")


class AnalyzeRequest(BaseModel):
    attempt_id: int
    audio_url: str
    transcript: str


@app.on_event("startup")
def warm_model():
    #load model wav2vec2 1 lần lúc khởi động để request đầu không phải chờ tải model
    try:
        alignment.load_model()
        logger.info("wav2vec2 alignment model loaded")
    except Exception as exc:
        logger.warning(f"could not preload alignment model: {exc}")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze")
async def analyze(request: AnalyzeRequest):
    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, _analyze_sync, request.audio_url, request.transcript)
        return result
    except Exception as exc:
        return _error_report(str(exc))


def _analyze_sync(audio_url: str, transcript: str) -> dict:
    with tempfile.TemporaryDirectory() as tmpdir:
        webm_path = Path(tmpdir) / "audio.webm"
        urllib.request.urlretrieve(audio_url, webm_path)

        #ffmpeg: decode webm/opus → 16kHz mono wav (parselmouth + wav2vec2 cùng dùng)
        wav_path = Path(tmpdir) / "audio.wav"
        subprocess.run(
            [
                "ffmpeg", "-y", "-i", str(webm_path),
                "-ar", "16000", "-ac", "1",
                "-c:a", "pcm_s16le",
                str(wav_path),
            ],
            check=True,
            capture_output=True,
            timeout=30,
        )

        intonation_report = _analyze_intonation(str(wav_path))

        #alignment + rhythm chạy độc lập: lỗi ở đây không được làm hỏng intonation
        alignment_report = None
        rhythm_report = None
        try:
            alignment_report = alignment.align(str(wav_path), transcript)
            if alignment_report:
                rhythm_report = rhythm.compute_rhythm(alignment_report["phonemes"])
        except Exception as exc:
            logger.warning(f"alignment/rhythm failed: {exc}")

        return {
            "intonation": intonation_report,
            "alignment": alignment_report,
            "rhythm": rhythm_report,
            "pronunciation": None,
            "vowelSpace": None,
            "error": None if intonation_report else "not enough voiced frames for analysis",
        }


def _analyze_intonation(wav_path: str):
    sound = parselmouth.Sound(wav_path)
    #pitch_floor=70 Hz ≈ bass male, pitch_ceiling=400 Hz ≈ high female
    pitch = sound.to_pitch(time_step=0.01, pitch_floor=70.0, pitch_ceiling=400.0)

    times = pitch.xs()
    f0_all = pitch.selected_array["frequency"]

    voiced_mask = f0_all > 0
    voiced_times = times[voiced_mask]
    voiced_f0 = f0_all[voiced_mask]

    if len(voiced_f0) < 5:
        return None

    f0_mean = float(np.mean(voiced_f0))
    f0_std = float(np.std(voiced_f0))
    f0_min = float(np.min(voiced_f0))
    f0_max = float(np.max(voiced_f0))
    voiced_ratio = float(voiced_mask.sum() / max(len(f0_all), 1))

    #semitones = khoảng cách cảm nhận cao độ giữa F0 max và min
    pitch_range_semitones = float(12 * math.log2(f0_max / f0_min)) if f0_min > 0 else 0.0

    #declination slope: hồi quy tuyến tính F0 theo thời gian (Hz/giây), âm = đi xuống tự nhiên
    declination_slope = float(np.polyfit(voiced_times, voiced_f0, 1)[0]) if len(voiced_times) > 1 else 0.0

    #terminal tone: độ dốc F0 trong 200ms cuối để phân biệt câu khẳng định vs câu hỏi
    terminal_tone = "level"
    if len(voiced_times) > 0:
        last_voiced_time = voiced_times[-1]
        terminal_mask = voiced_times >= (last_voiced_time - 0.2)
        terminal_f0 = voiced_f0[terminal_mask]
        terminal_times = voiced_times[terminal_mask]
        if len(terminal_f0) >= 3:
            term_slope = float(np.polyfit(terminal_times, terminal_f0, 1)[0])
            terminal_tone = "rising" if term_slope > 5 else "falling" if term_slope < -5 else "level"

    return {
        "pitchRangeSemitones": round(pitch_range_semitones, 2),
        "f0Mean": round(f0_mean, 1),
        "f0Std": round(f0_std, 1),
        "declinationSlope": round(declination_slope, 2),
        "voicedRatio": round(voiced_ratio, 3),
        "terminalTone": terminal_tone,
    }


def _error_report(message: str) -> dict:
    return {
        "intonation": None,
        "alignment": None,
        "rhythm": None,
        "pronunciation": None,
        "vowelSpace": None,
        "error": message,
    }
