import os
import unittest

from fastapi.testclient import TestClient

os.environ.setdefault("AI_ADMIN_API_KEY", "test-admin-key")

from app.main import app


class AiRestSmokeTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.client = TestClient(app)

    def test_rest_smoke_endpoints(self) -> None:
        tests = [
            ("post", "/api/v1/ai/chat/general-qa", {"userId": "u1", "prompt": "How do I book a tour?"}),
            ("post", "/api/v1/ai/chat/agent-chatbot", {"userId": "u1", "slots": {"prompt": "Tell me move-in process"}}),
            ("post", "/api/v1/ai/chat/voice-assistant", {"userId": "u1", "prompt": "voice test", "ttsEnabled": False}),
            ("post", "/api/v1/ai/search/rag", {"userId": "u1", "query": "move-in guide"}),
            ("post", "/api/v1/ai/community/content-search", {"userId": "u1", "keyword": "notice"}),
            ("post", "/api/v1/ai/community/content-moderation", {"userId": "u1", "content": "this is a test"}),
            ("post", "/api/v1/ai/contracts/renewal-recommendations", {"userId": "u1"}),
            ("post", "/api/v1/ai/contracts/anomaly-detections", {"userId": "u1"}),
            ("post", "/api/v1/ai/rooms/availability-searches", {"userId": "u1", "buildingAddr": "Gangnam"}),
            ("post", "/api/v1/ai/common-spaces/recommendations", {"userId": "u1"}),
            ("post", "/api/v1/ai/payments/summary-documents", {"userId": "u1"}),
            ("post", "/api/v1/ai/payments/status-summaries", {"userId": "u1"}),
            (
                "post",
                "/api/v1/ai/payments/order-suggestions",
                {"userId": "u1", "items": [{"buildingId": 1, "prodNm": "Detergent", "prodStock": 2, "paidAmount": 120000}]},
            ),
            ("post", "/api/v1/ai/operations/roomservice-stock-monitoring", {"userId": "u1", "prodStock": 3, "prodNm": "Detergent"}),
            ("post", "/api/v1/ai/operations/complaint-priority-classification", {"userId": "u1"}),
        ]

        for method, path, payload in tests:
            with self.subTest(path=path):
                response = self._request(method, path, payload)
                self.assertEqual(200, response.status_code, msg=f"{path} -> {response.status_code} {response.text}")
                if path in {
                    "/api/v1/ai/payments/summary-documents",
                    "/api/v1/ai/payments/status-summaries",
                    "/api/v1/ai/payments/order-suggestions",
                    "/api/v1/ai/operations/roomservice-stock-monitoring",
                }:
                    body = response.json()
                    self.assertIn("metadata", body, msg=f"{path} metadata missing")
                    self.assertIn("draft_path", body["metadata"], msg=f"{path} draft_path missing")

    def test_rag_admin_endpoints(self) -> None:
        headers = {"X-AI-Admin-Key": "test-admin-key"}
        status = self.client.get("/api/v1/ai/admin/rag/status", headers=headers)
        self.assertEqual(200, status.status_code, msg=status.text)
        payload = status.json()
        self.assertIn("milvus_collection", payload)

        reindex = self.client.post("/api/v1/ai/admin/rag/reindex-if-changed", headers=headers)
        self.assertEqual(200, reindex.status_code, msg=reindex.text)
        result = reindex.json()
        self.assertIn("status", result)

    def _request(self, method: str, path: str, payload: dict) -> object:
        if method == "post":
            return self.client.post(path, json=payload)
        if method == "get":
            return self.client.get(path, params=payload)
        raise AssertionError(f"Unsupported method: {method}")


if __name__ == "__main__":
    unittest.main()
