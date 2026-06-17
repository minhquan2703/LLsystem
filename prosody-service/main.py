import asyncio
import math
import subprocess
import tempfile
import urllib.request
from pathlib import Path

import numpy as np
import parselmouth
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="LLsystem Prosody Service", version="0.1.0")


class AnalyzeRequest(BaseModel):
    attempt_id: int
    audio_url: str
    transcript: str


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

        #ffmpeg: decode webm/opus → 16kHz mono wav (parselmouth input)
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

        sound = parselmouth.Sound(str(wav_path))
        #pitch_floor=70 Hz ≈ bass male, pitch_ceiling=400 Hz ≈ high female
        pitch = sound.to_pitch(time_step=0.01, pitch_floor=70.0, pitch_ceiling=400.0)

        times = pitch.xs()                          # shape (N,) — time of each frame
        f0_all = pitch.selected_array["frequency"]  # shape (N,) — 0 for unvoiced frames

        voiced_mask = f0_all > 0
        voiced_times = times[voiced_mask]
        voiced_f0 = f0_all[voiced_mask]

        if len(voiced_f0) < 5:
            return _error_report("not enough voiced frames for analysis")

        f0_mean = float(np.mean(voiced_f0))
        f0_std = float(np.std(voiced_f0))
        f0_min = float(np.min(voiced_f0))
        f0_max = float(np.max(voiced_f0))
        voiced_ratio = float(voiced_mask.sum() / max(len(f0_all), 1))

        #semitones = perceptual pitch interval between min and max F0
        pitch_range_semitones = float(12 * math.log2(f0_max / f0_min)) if f0_min > 0 else 0.0

        #declination slope: linear regression of F0 over time (Hz/second)
        #negative = overall falling (natural for declarative English)
        if len(voiced_times) > 1:
            declination_slope = float(np.polyfit(voiced_times, voiced_f0, 1)[0])
        else:
            declination_slope = 0.0

        #terminal tone: slope of F0 in last 200ms of voiced speech
        terminal_tone = "level"
        if len(voiced_times) > 0:
            last_voiced_time = voiced_times[-1]
            terminal_mask = voiced_times >= (last_voiced_time - 0.2)
            terminal_f0 = voiced_f0[terminal_mask]
            terminal_times = voiced_times[terminal_mask]
            if len(terminal_f0) >= 3:
                term_slope = float(np.polyfit(terminal_times, terminal_f0, 1)[0])
                #thresholds: ±5 Hz/s to distinguish level from directional
                terminal_tone = "rising" if term_slope > 5 else "falling" if term_slope < -5 else "level"

        return {
            "intonation": {
                "pitchRangeSemitones": round(pitch_range_semitones, 2),
                "f0Mean": round(f0_mean, 1),
                "f0Std": round(f0_std, 1),
                "declinationSlope": round(declination_slope, 2),
                "voicedRatio": round(voiced_ratio, 3),
                "terminalTone": terminal_tone,
            },
            "alignment": None,
            "rhythm": None,
            "pronunciation": None,
            "vowelSpace": None,
            "error": None,
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
