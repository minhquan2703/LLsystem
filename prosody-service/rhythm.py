import numpy as np

#tập nguyên âm IPA (base chars) — espeak en-us dùng tập con của các ký tự này
IPA_VOWELS = set("aeiouɑæʌɔəɛɜɪʊyøœɒɐɘɵɞʉɨɯ")
#tiếng Anh stress-timed nPVI ~65, tiếng Việt syllable-timed ~45 (Grabe & Low 2002)
NATIVE_REF_NPVI = 65.0


def _is_vowel(phone):
    #bỏ dấu trọng âm/độ dài/nasal/aspiration để lấy ký tự nguyên âm gốc
    base = phone.strip("ˈˌːˑ̃ʰʷ")
    if not base:
        return False
    return base[0] in IPA_VOWELS


def _npvi(durations):
    #normalized Pairwise Variability Index — chuẩn hóa theo trung bình cặp liền kề
    if len(durations) < 2:
        return None
    total = 0.0
    for k in range(len(durations) - 1):
        first = durations[k]
        second = durations[k + 1]
        denom = (first + second) / 2
        if denom > 0:
            total += abs(first - second) / denom
    return round(100 * total / (len(durations) - 1), 1)


def _rpvi(durations):
    #raw PVI — chênh lệch tuyệt đối trung bình, đơn vị ms (không chuẩn hóa)
    if len(durations) < 2:
        return None
    total = sum(abs(durations[k] - durations[k + 1]) for k in range(len(durations) - 1))
    return round(1000 * total / (len(durations) - 1), 1)


def compute_rhythm(phonemes):
    if not phonemes or len(phonemes) < 3:
        return None

    #gộp phoneme liên tiếp cùng loại thành 1 interval (vocalic hoặc consonantal)
    intervals = []
    for phoneme in phonemes:
        phone_class = "V" if _is_vowel(phoneme["phone"]) else "C"
        duration = phoneme["end"] - phoneme["start"]
        if duration <= 0:
            continue
        if intervals and intervals[-1][0] == phone_class:
            intervals[-1][1] += duration
        else:
            intervals.append([phone_class, duration])

    vocalic = [duration for phone_class, duration in intervals if phone_class == "V"]
    consonantal = [duration for phone_class, duration in intervals if phone_class == "C"]

    if len(vocalic) < 2:
        return None

    total_speech = sum(vocalic) + sum(consonantal)
    percent_v = round(100 * sum(vocalic) / total_speech, 1) if total_speech > 0 else None

    vocalic_array = np.array(vocalic)
    vocalic_mean = float(vocalic_array.mean())
    #VarcoV = độ lệch chuẩn vocalic chuẩn hóa theo trung bình (%) — bù khác biệt tốc độ nói
    varco_v = round(100 * float(vocalic_array.std()) / vocalic_mean, 1) if vocalic_mean > 0 else None

    return {
        "nPVI": _npvi(vocalic),
        "rPVI": _rpvi(consonantal),
        "percentV": percent_v,
        "varcoV": varco_v,
        "vocalicCount": len(vocalic),
        "consonantalCount": len(consonantal),
        "nativeRefNPVI": NATIVE_REF_NPVI,
    }
