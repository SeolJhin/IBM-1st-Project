from __future__ import annotations

import json
import logging
from datetime import datetime
from typing import Any
from urllib.error import URLError, HTTPError
from urllib.request import Request, urlopen

from app.config.settings import settings

logger = logging.getLogger(__name__)


def publish_action_event(event_type: str, payload: dict[str, Any]) -> dict[str, Any]:
    url = (settings.action_webhook_url or "").strip()
    body = {
        "event_type": event_type,
        "occurred_at": datetime.utcnow().isoformat() + "Z",
        "payload": payload,
    }

    if not url:
        return {"status": "disabled"}

    data = json.dumps(body, ensure_ascii=True).encode("utf-8")
    timeout = max(1, int(settings.action_webhook_timeout_seconds))
    request = Request(url=url, data=data, method="POST", headers={"Content-Type": "application/json"})
    try:
        with urlopen(request, timeout=timeout) as response:
            return {"status": "sent", "http_status": int(getattr(response, "status", 200))}
    except HTTPError as exc:
        logger.warning("Action event HTTPError: %s", exc.code)
        return {"status": "failed", "http_status": int(exc.code)}
    except URLError as exc:
        logger.warning("Action event URLError: %s", exc.reason)
        return {"status": "failed", "reason": exc.reason.__class__.__name__ if hasattr(exc, "reason") else "URLError"}
    except Exception as exc:
        logger.warning("Action event failed: %s", exc.__class__.__name__)
        return {"status": "failed", "reason": exc.__class__.__name__}
