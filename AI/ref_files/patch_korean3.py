"""
MeloTTS korean.py 패치 v3
- ᇂ 등 symbols에 없는 자모 필터링 추가
"""
import os, shutil

KOREAN_FILE = r"C:\Users\user\AppData\Local\Programs\Python\Python310\lib\site-packages\melo\text\korean.py"
BACKUP_FILE = KOREAN_FILE + ".bak"

NEW_CONTENT = r'''# MeloTTS Korean text processing — patched v3 (no eunjeon/mecab)
import re
from transformers import AutoTokenizer
from . import punctuation, symbols
from melo.text.ko_dictionary import english_dictionary, etc_dictionary
from anyascii import anyascii
from jamo import hangul_to_jamo



def normalize(text):
    text = text.strip()
    text = normalize_with_dictionary(text, etc_dictionary)
    text = normalize_english(text)
    text = text.lower()
    return text


def normalize_with_dictionary(text, dic):
    if any(key in text for key in dic.keys()):
        pattern = re.compile("|".join(re.escape(key) for key in dic.keys()))
        return pattern.sub(lambda x: dic[x.group()], text)
    return text


def normalize_english(text):
    def fn(m):
        word = m.group()
        if word in english_dictionary:
            return english_dictionary.get(word)
        return word
    text = re.sub("([A-Za-z]+)", fn, text)
    return text


_okt = None

def _get_okt():
    global _okt
    if _okt is None:
        from konlpy.tag import Okt
        _okt = Okt()
    return _okt


def korean_text_to_phonemes(text, character: str = "hangeul") -> list:
    """한국어 텍스트 → 자모 음소 변환 (Okt 기반), symbols에 없는 자모 필터링"""
    okt = _get_okt()
    text = normalize(text)
    morphs = okt.morphs(text)
    result = "".join(morphs)
    if character == "english":
        return list(anyascii(result))
    jamo_list = list(hangul_to_jamo(result))
    # symbols에 있는 자모만 통과
    filtered = [j for j in jamo_list if j in symbols]
    if not filtered:
        filtered = ['_']
    return filtered


def text_normalize(text):
    return normalize(text)


def distribute_phone(n_phone, n_word):
    phones_per_word = [0] * n_word
    for task in range(n_phone):
        min_tasks = min(phones_per_word)
        min_index = phones_per_word.index(min_tasks)
        phones_per_word[min_index] += 1
    return phones_per_word


model_id = 'kykim/bert-kor-base'
tokenizer = AutoTokenizer.from_pretrained(model_id)


def g2p(norm_text):
    tokenized = tokenizer.tokenize(norm_text)
    phs = []
    ph_groups = []
    for t in tokenized:
        if not t.startswith("#"):
            ph_groups.append([t])
        else:
            ph_groups[-1].append(t.replace("#", ""))
    word2ph = []
    for group in ph_groups:
        text = ""
        for ch in group:
            text += ch
        if text == '[UNK]':
            phs += ['_']
            word2ph += [1]
            continue
        elif text in punctuation:
            phs += [text]
            word2ph += [1]
            continue
        phonemes = korean_text_to_phonemes(text)
        phone_len = len(phonemes)
        word_len = len(group)
        aaa = distribute_phone(phone_len, word_len)
        assert len(aaa) == word_len
        word2ph += aaa
        phs += phonemes
    phones = ["_"] + phs + ["_"]
    tones = [0 for i in phones]
    word2ph = [1] + word2ph + [1]
    assert len(word2ph) == len(tokenized) + 2
    return phones, tones, word2ph


def get_bert_feature(text, word2ph, device='cuda'):
    from . import japanese_bert
    return japanese_bert.get_bert_feature(text, word2ph, device=device, model_id=model_id)
'''

def main():
    if not os.path.exists(BACKUP_FILE):
        shutil.copy(KOREAN_FILE, BACKUP_FILE)
        print("✅ 백업 완료")
    else:
        print("ℹ️  기존 백업 유지")

    with open(KOREAN_FILE, "w", encoding="utf-8") as f:
        f.write(NEW_CONTENT)
    print("✅ 패치 v3 적용 완료")

    print("\n🔍 테스트 중...")
    try:
        import importlib, sys
        for mod in list(sys.modules.keys()):
            if 'melo' in mod:
                del sys.modules[mod]

        from melo.api import TTS
        model = TTS(language='KR', device='cpu')
        speaker_ids = model.hps.data.spk2id
        model.tts_to_file(
            '안녕하세요! 저는 AI 음성 합성 시스템입니다. 오늘도 좋은 하루 되세요.',
            speaker_ids['KR'], 'test_ko_v3.wav'
        )
        print("✅ 한국어 TTS 성공! test_ko_v3.wav 생성됨")
    except Exception as e:
        print(f"❌ 실패: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
