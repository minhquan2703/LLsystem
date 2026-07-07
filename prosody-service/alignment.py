import os
import re
from pathlib import Path

import torch
import torchaudio
from torchaudio.functional import forced_align, merge_tokens
from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor


def _ensure_espeak_library():
    #phonemizer trên Windows cần trỏ tới libespeak-ng.dll — tự dò các đường dẫn cài mặc định
    if os.environ.get("PHONEMIZER_ESPEAK_LIBRARY"):
        return
    candidates = [
        r"C:\Program Files\eSpeak NG\libespeak-ng.dll",
        r"C:\Program Files (x86)\eSpeak NG\libespeak-ng.dll",
    ]
    for candidate in candidates:
        if Path(candidate).exists():
            os.environ["PHONEMIZER_ESPEAK_LIBRARY"] = candidate
            return

#model wav2vec2 fine-tune trên espeak IPA phoneme — inference CPU, không train
MODEL_NAME = "facebook/wav2vec2-lv-60-espeak-cv-ft"
#wav2vec2 downsample 320x: mỗi frame emission = 320/16000 = 20ms
FRAME_SECONDS = 0.02
SAMPLE_RATE = 16000

_processor = None
_model = None


def load_model():
    global _processor, _model
    if _model is None:
        _processor = Wav2Vec2Processor.from_pretrained(MODEL_NAME)
        _model = Wav2Vec2ForCTC.from_pretrained(MODEL_NAME)
        _model.eval()
    return _processor, _model


def _phonemize_words(words):
    #import trong hàm để nếu thiếu espeak thì chỉ nhánh alignment fail, không sập service
    _ensure_espeak_library()
    from phonemizer import phonemize
    from phonemizer.separator import Separator

    #tách phoneme bằng dấu cách, không tách âm tiết — mỗi phần tử là 1 từ đã phoneme hóa
    ipa_list = phonemize(
        words,
        language="en-us",
        backend="espeak",
        separator=Separator(phone=" ", word="", syllable=""),
        strip=True,
        preserve_punctuation=False,
        njobs=1,
    )
    return ipa_list


def _build_targets(transcript, tokenizer):
    #chỉ giữ từ chứa chữ cái latin — bỏ dấu câu, số
    words = re.findall(r"[a-zA-Z']+", transcript.lower())
    if not words:
        return [], [], []

    ipa_list = _phonemize_words(words)

    token_ids = []
    phone_symbols = []
    word_boundaries = []
    unk_id = tokenizer.unk_token_id
    for word, ipa in zip(words, ipa_list):
        word_start = len(token_ids)
        for phone in ipa.split():
            token_id = tokenizer.convert_tokens_to_ids(phone)
            #thử bỏ dấu trọng âm/độ dài nếu phone gốc không có trong vocab
            if token_id == unk_id:
                stripped = phone.strip("ˈˌːˑ")
                token_id = tokenizer.convert_tokens_to_ids(stripped)
                phone = stripped
            if token_id == unk_id or token_id is None:
                continue
            token_ids.append(token_id)
            phone_symbols.append(phone)
        if len(token_ids) > word_start:
            word_boundaries.append({"word": word, "phoneme_start": word_start, "phoneme_end": len(token_ids)})

    return token_ids, phone_symbols, word_boundaries


def align(wav_path, transcript):
    #trả về None nếu không đủ dữ liệu — caller xử lý graceful
    processor, model = load_model()
    tokenizer = processor.tokenizer

    token_ids, phone_symbols, word_boundaries = _build_targets(transcript, tokenizer)
    if len(token_ids) < 2:
        return None

    waveform, sr = torchaudio.load(wav_path)
    if sr != SAMPLE_RATE:
        waveform = torchaudio.functional.resample(waveform, sr, SAMPLE_RATE)
    #gộp về mono nếu nhiều kênh
    if waveform.shape[0] > 1:
        waveform = waveform.mean(dim=0, keepdim=True)

    inputs = processor(waveform.squeeze(0).numpy(), sampling_rate=SAMPLE_RATE, return_tensors="pt")
    with torch.no_grad():
        logits = model(inputs.input_values).logits
    log_probs = torch.log_softmax(logits, dim=-1)

    blank_id = model.config.pad_token_id if model.config.pad_token_id is not None else 0
    targets = torch.tensor([token_ids], dtype=torch.int32)

    #forced_align: căn chuỗi phoneme mục tiêu vào từng frame audio theo CTC
    aligned_tokens, scores = forced_align(log_probs, targets, blank=blank_id)
    #merge_tokens gộp các frame lặp/blank thành từng span phoneme có start/end (đơn vị frame)
    spans = merge_tokens(aligned_tokens[0], scores[0], blank=blank_id)

    #spans khớp thứ tự token_ids — dựng lại phoneme kèm mốc thời gian giây
    phonemes = []
    for index, span in enumerate(spans):
        phone = phone_symbols[index] if index < len(phone_symbols) else tokenizer.convert_ids_to_tokens(span.token)
        phonemes.append({
            "phone": phone,
            "start": round(span.start * FRAME_SECONDS, 3),
            "end": round(span.end * FRAME_SECONDS, 3),
        })

    #dựng mốc thời gian cấp từ bằng cách gộp span phoneme theo ranh giới từ
    words = []
    for boundary in word_boundaries:
        start_index = boundary["phoneme_start"]
        end_index = min(boundary["phoneme_end"], len(phonemes))
        if start_index >= end_index:
            continue
        words.append({
            "word": boundary["word"],
            "start": phonemes[start_index]["start"],
            "end": phonemes[end_index - 1]["end"],
        })

    return {"words": words, "phonemes": phonemes}
