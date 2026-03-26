import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import styles from './AdminRoomServiceHub.module.css';
import { propertyApi } from '../../../property/api/propertyApi';
import { api } from '../../../../app/http/axiosInstance';
import RoomServiceDashboard from './AdminRoomServiceDashboard';

export default function AdminServiceHub() {
  const [genLoading, setGenLoading] = useState(false);
  const [buildings, setBuildings] = useState([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState('');

  useEffect(() => {
    propertyApi.getBuildings({ page: 1, size: 100 })
      .then((data) => {
        const list = data?.content || data || [];
        setBuildings(Array.isArray(list) ? list : []);
      })
      .catch(() => {});
  }, []);

  const handleGenerateOrder = async () => {
    if (genLoading) return;
    if (!selectedBuildingId) {
      alert('빌딩을 선택해주세요.');
      return;
    }
    setGenLoading(true);
    try {
      // 1단계: Spring → Python으로 발주 제안 (DB에서 품목 데이터 자동 수집)
      const suggestRes = await api.post('/ai/payment/order-suggestion', {
        intent: 'PAYMENT_ORDER_SUGGESTION',
        buildingId: Number(selectedBuildingId),
      });
      const suggestData = suggestRes.data;
      const meta = suggestData?.data?.metadata || suggestData?.metadata || {};
      const suggestions = meta.suggestions || [];

      if (!suggestions.length) {
        const answer = suggestData?.data?.answer || suggestData?.answer || '';
        const msg = answer && !/^No /i.test(answer) ? answer : '발주 추천할 품목이 없습니다. 모든 상품의 재고가 충분합니다.';
        alert(msg);
        return;
      }

      // 선택된 빌딩 정보
      const selectedBldg = buildings.find((b) => String(b.buildingId) === String(selectedBuildingId));

      // 2단계: 제안된 품목으로 발주서 생성
      const formRes = await api.post('/ai/payment/order-form', {
        intent: 'PAYMENT_ORDER_FORM_CREATE',
        buildingId: Number(selectedBuildingId),
        approved: true,
        approvedItems: suggestions,
        building_nm: selectedBldg?.buildingNm || '',
        building_addr: selectedBldg?.buildingAddr || '',
        lessor_nm: selectedBldg?.buildingLessorNm || '',
        lessor_tel: selectedBldg?.buildingLessorTel || '',
      });
      const formData = formRes.data;
      const formMeta = formData?.data?.metadata || formData?.metadata || {};
      const fileName = formMeta.file_name;

      if (fileName) {
        // Spring 프록시 → Python → 파일 다운로드
        const dlRes = await api.get(`/ai/payment/order-form/download/${encodeURIComponent(fileName)}`, {
          responseType: 'blob',
        });
        const url = window.URL.createObjectURL(new Blob([dlRes.data]));
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        alert(formData?.data?.answer || '발주서 생성에 실패했습니다.');
      }
    } catch (e) {
      const errData = e?.response?.data;
      console.error('[발주서] 에러:', e?.response?.status, JSON.stringify(errData, null, 2));
      alert(errData?.message || e?.message || '발주서 생성 중 오류가 발생했습니다.');
    } finally {
      setGenLoading(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.topRow}>
        <div className={styles.titleArea}>
          <span className={styles.eyebrow}>Room Service</span>
          <div className={styles.goldLine} />
          <h1 className={styles.title}>룸서비스 관리</h1>
        </div>
        <div className={styles.right}>
          <select
            className={styles.buildingSelect}
            value={selectedBuildingId}
            onChange={(e) => setSelectedBuildingId(e.target.value)}
          >
            <option value="">빌딩 선택</option>
            {buildings.map((b) => (
              <option key={b.buildingId} value={b.buildingId}>
                {b.buildingNm}
              </option>
            ))}
          </select>
          <button
            className={styles.orderFormBtn}
            onClick={handleGenerateOrder}
            disabled={genLoading || !selectedBuildingId}
          >
            {genLoading ? '생성 중…' : '📋 발주서 생성'}
          </button>
        </div>
      </div>

      <div className={styles.dashboardArea}>
        <RoomServiceDashboard />
      </div>

      <div className={styles.tabs}>
        <NavLink
          to="/admin/roomservice/room_orders"
          end
          className={({ isActive }) =>
            `${styles.tab} ${isActive ? styles.tabActive : ''}`
          }
        >
          주문내역
        </NavLink>

        <NavLink
          to="/admin/roomservice/room_products"
          className={({ isActive }) =>
            `${styles.tab} ${isActive ? styles.tabActive : ''}`
          }
        >
          상품
        </NavLink>
      </div>

      <div className={styles.panel}>
        <Outlet />
      </div>
    </div>
  );
}
