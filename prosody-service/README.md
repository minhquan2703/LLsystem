# Prosody Service

Python microservice (FastAPI, CPU-only) phân tích ngữ điệu và nhịp điệu cho Speaking Coach.
NestJS gọi async (fire-and-forget) sau khi Gemini chấm xong, lưu kết quả vào `speaking_attempts.prosody`.

## Chức năng

| Module | Kỹ thuật | Output |
|---|---|---|
| Intonation | Praat/parselmouth F0 | pitch range (semitone), F0 std, declination slope, terminal tone |
| Forced alignment | wav2vec2 espeak IPA + `torchaudio.forced_align` | word/phoneme time boundaries |
| Rhythm | vocalic/consonantal intervals từ alignment | nPVI, rPVI, %V, VarcoV (Grabe & Low 2002) |

Không train AI — chỉ inference model pretrained + signal processing thuần.

## Setup (một lần)

### 1. Cài Python 3.11 + ffmpeg + espeak-ng

```powershell
winget install Python.Python.3.11
winget install Gyan.FFmpeg
winget install eSpeak-NG.eSpeak-NG
```

> Đóng và mở lại terminal sau khi cài để PATH cập nhật.

`espeak-ng` cần cho forced alignment (text → IPA phoneme). `alignment.py` tự dò
`libespeak-ng.dll` ở `C:\Program Files\eSpeak NG\`. Nếu cài chỗ khác, set thủ công:

```powershell
$env:PHONEMIZER_ESPEAK_LIBRARY = "D:\path\to\libespeak-ng.dll"
```

### 2. Tạo venv + cài thư viện Python

Từ thư mục `backend-official/`:

```
npm run prosody:setup
```

> Tải `torch + torchaudio + transformers` (~1.5GB) — chạy lần đầu mất vài phút.
> Model wav2vec2 (~1GB) tải tự động lần đầu gọi `/analyze` rồi cache lại.

### 3. Thêm URL vào `.env` backend

```env
PROSODY_SERVICE_URL=http://localhost:8001
```

## Chạy hàng ngày

```
npm run prosody:dev
```

Song song với `npm run dev` (NestJS). Service ở `http://localhost:8001`,
model load 1 lần lúc startup (giữ ấm).

## Graceful degradation

Nếu thiếu espeak / alignment lỗi → vẫn trả `intonation`, chỉ `alignment`+`rhythm` = null.
Nếu prosody-service không chạy → NestJS mark `prosodyStatus = 'failed'`, UI ẩn card.
