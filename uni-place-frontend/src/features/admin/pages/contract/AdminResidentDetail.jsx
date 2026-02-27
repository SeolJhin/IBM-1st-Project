// features/admin/pages/contract/AdminResidentDetail.jsx
import React from 'react';

export default function AdminResidentDetail() {
  return (
    <div style={{ padding: 24 }}>
      <h2>Admin Resident Detail</h2>
      <p>
        현재 백엔드에는 입주자 단건조회 API가 없습니다.
        <br />
        (GET /admin/residents/{'{residentId}'} 가 필요)
      </p>
      <p>
        지금 구조에서는 <b>AdminResidentList.jsx의 모달</b>로 상세 확인을
        하거나, 단건 조회 엔드포인트를 추가한 뒤 Detail 페이지를 붙이는 방식이
        좋아요.
      </p>
    </div>
  );
}
