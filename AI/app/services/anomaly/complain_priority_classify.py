from ibm_watsonx_ai import Credentials
from ibm_watsonx_ai.foundation_models import ModelInference
import json, re

from app.config.settings import settings

# 키워드 규칙 (keyword_weight=0.4)
HIGH_KEYWORDS = ["화재", "가스", "폭발", "감전", "긴급", "위험",
                 "쓰러", "의식", "범죄", "폭력", "칼"]
LOW_KEYWORDS  = ["문의", "건의", "추가", "알려주", "가능한가요", "궁금"]

def classify_complain(title: str, content: str) -> dict:
    text = f"{title} {content}"

    # 1단계: 키워드 규칙으로 빠르게 판단 (keyword_weight=0.4)
    if any(k in text for k in HIGH_KEYWORDS):
        keyword_score = 1.0   # high
    elif any(k in text for k in LOW_KEYWORDS):
        keyword_score = 0.0   # low
    else:
        keyword_score = 0.5   # medium

    # 2단계: LLM으로 감성/긴급도 판단 (sentiment+urgency weight=0.6)
    model = ModelInference(
        model_id=settings.watsonx_model_id,
        credentials=Credentials(
            api_key=settings.watsonx_api_key,
            url=settings.watsonx_url,
        ),
        project_id=settings.watsonx_project_id,
        params={
            "temperature": 0.0,
            "max_new_tokens": 200,
        }
    )
    
    prompt = f"""민원 제목: {title}
민원 내용: {content}

위 민원의 중요도를 분류하세요.
- high: 안전사고·화재·범죄·긴급 대응 필요
- medium: 시설 고장·소음·생활 불편
- low: 단순 문의·건의·개선 요청

반드시 JSON만 출력:
{{"importance": "high|medium|low", "reason": "한 문장 근거"}}"""

    raw = model.generate_text(prompt=prompt)
    
    # JSON 파싱
    match = re.search(r'\{.*?\}', raw, re.DOTALL)
    llm_result = json.loads(match.group()) if match else {}
    
    # 3단계: 키워드 + LLM 결합 (high_priority_threshold=0.75)
    llm_score = {"high": 1.0, "medium": 0.5, "low": 0.0}.get(
        llm_result.get("importance", "medium"), 0.5
    )
    final_score = keyword_score * 0.4 + llm_score * 0.6
    
    if final_score >= 0.75:
        importance = "high"
    elif final_score >= 0.35:
        importance = "medium"
    else:
        importance = "low"
    
    return {
        "importance": importance,
        "ai_reason": llm_result.get("reason", "AI 분석 완료")
    }