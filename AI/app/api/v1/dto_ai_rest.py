from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.ai_request import AiRequest


class RestAiBaseRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    user_id: Optional[str] = Field(default=None, alias="userId")
    user_segment: Optional[str] = Field(default=None, alias="userSegment")
    prompt: Optional[str] = None
    slots: Dict[str, Any] = Field(default_factory=dict)

    def to_ai_request(self, intent: str) -> AiRequest:
        data = self.model_dump(by_alias=False, exclude_none=True)
        user_id = data.pop("user_id", None)
        user_segment = data.pop("user_segment", None)
        prompt = data.pop("prompt", None)
        slots = data.pop("slots", {}) or {}
        slots.update(data)
        return AiRequest(intent=intent, user_id=user_id, user_segment=user_segment, prompt=prompt, slots=slots)


class GeneralQaRequest(RestAiBaseRequest):
    prompt: str


class CommunityContentSearchRequest(RestAiBaseRequest):
    topic: Optional[str] = None
    keyword: Optional[str] = None
    sort: Optional[str] = None
    board_id: Optional[int] = Field(default=None, alias="boardId")


class ContractRenewalRecommendRequest(RestAiBaseRequest):
    contract_end: Optional[str] = Field(default=None, alias="contractEnd")
    room_id: Optional[int] = Field(default=None, alias="roomId")
    rent_price: Optional[int] = Field(default=None, alias="rentPrice")
    building_id: Optional[int] = Field(default=None, alias="buildingId")


class ContractAnomalyDetectionRequest(RestAiBaseRequest):
    contract_count: Optional[int] = Field(default=None, alias="contractCount")
    contract_st: Optional[str] = Field(default=None, alias="contractSt")
    created_at: Optional[str] = Field(default=None, alias="createdAt")
    pattern_score: Optional[float] = Field(default=None, alias="patternScore")


class RoomAvailabilitySearchRequest(RestAiBaseRequest):
    check_in_date: Optional[str] = Field(default=None, alias="checkInDate")
    check_out_date: Optional[str] = Field(default=None, alias="checkOutDate")
    building_addr: Optional[str] = Field(default=None, alias="buildingAddr")
    room_type: Optional[str] = Field(default=None, alias="roomType")
    rent_price: Optional[int] = Field(default=None, alias="rentPrice")
    room_capacity: Optional[int] = Field(default=None, alias="roomCapacity")
    pet_allowed_yn: Optional[str] = Field(default=None, alias="petAllowedYn")
    option: Optional[str] = None


class CommonSpaceRecommendRequest(RestAiBaseRequest):
    space_id: Optional[int] = Field(default=None, alias="spaceId")
    building_id: Optional[int] = Field(default=None, alias="buildingId")
    sr_start_at: Optional[str] = Field(default=None, alias="srStartAt")
    sr_end_at: Optional[str] = Field(default=None, alias="srEndAt")
    usage_pattern: Optional[str] = Field(default=None, alias="usagePattern")


class PaymentSummaryDocumentRequest(RestAiBaseRequest):
    month: Optional[str] = None
    payment_id: Optional[str] = Field(default=None, alias="paymentId")
    total_price: Optional[int] = Field(default=None, alias="totalPrice")
    paid_at: Optional[str] = Field(default=None, alias="paidAt")
    target_type: Optional[str] = Field(default=None, alias="targetType")


class PaymentStatusSummaryRequest(RestAiBaseRequest):
    billing_month: Optional[str] = Field(default=None, alias="billingMonth")
    payment_st: Optional[str] = Field(default=None, alias="paymentSt")
    charge_status: Optional[str] = Field(default=None, alias="chargeStatus")
    due_date: Optional[str] = Field(default=None, alias="dueDate")


class RoomserviceStockItemRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    building_id: Optional[int] = Field(default=None, alias="buildingId")
    prod_id: Optional[int] = Field(default=None, alias="prodId")
    prod_nm: Optional[str] = Field(default=None, alias="prodNm")
    prod_stock: Optional[int] = Field(default=None, alias="prodStock")
    affiliate_id: Optional[int] = Field(default=None, alias="affiliateId")


class RoomserviceStockMonitorRequest(RestAiBaseRequest):
    building_id: Optional[int] = Field(default=None, alias="buildingId")
    prod_id: Optional[int] = Field(default=None, alias="prodId")
    prod_nm: Optional[str] = Field(default=None, alias="prodNm")
    prod_stock: Optional[int] = Field(default=None, alias="prodStock")
    affiliate_id: Optional[int] = Field(default=None, alias="affiliateId")
    items: Optional[List[RoomserviceStockItemRequest]] = None

    def to_ai_request(self, intent: str) -> AiRequest:
        ai_request = super().to_ai_request(intent)
        if self.items:
            ai_request.slots["items"] = [item.model_dump(by_alias=False, exclude_none=True) for item in self.items]
        return ai_request


class ComplainPriorityClassifyRequest(RestAiBaseRequest):
    comp_title: Optional[str] = Field(default=None, alias="compTitle")
    comp_ctnt: Optional[str] = Field(default=None, alias="compCtnt")
    comp_st: Optional[str] = Field(default=None, alias="compSt")
    keyword: Optional[str] = None
    priority_score: Optional[float] = Field(default=None, alias="priorityScore")
