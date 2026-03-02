import React, { useCallback, useRef, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import AdminPropertyListTable from './AdminPropertyListTable';
import AdminBuildingModal from './AdminBuildingModal';

export default function AdminBuildingList() {
  const [createModal, setCreateModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const reloadRef = useRef(null);

  const fetchBuildings = useCallback(
    (q) =>
      adminApi.getBuildings({
        page: q.page,
        size: q.size,
        sort: q.sort,
        direct: q.direct,
      }),
    []
  );

  const columns = [
    { key: 'buildingId', label: '건물 ID' },
    { key: 'buildingNm', label: '건물명' },
    { key: 'buildingAddr', label: '주소' },
    { key: 'buildingUsage', label: '용도' },
    { key: 'parkingCapacity', label: '주차 가능' },
    {
      key: 'actions',
      label: '관리',
      render: (row) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setEditId(row.buildingId);
          }}
          style={{
            padding: '4px 10px',
            fontSize: 12,
            fontWeight: 700,
            border: '1px solid rgba(202,162,90,0.5)',
            background: 'rgba(202,162,90,0.18)',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          수정
        </button>
      ),
    },
  ];

  const handleSuccess = () => reloadRef.current?.();

  // 체크박스 일괄 삭제 (순차 처리)
  const handleDeleteSelected = async (ids) => {
    const results = await Promise.allSettled(
      ids.map((id) => adminApi.deleteBuilding(id))
    );
    const failed = results.filter((r) => r.status === 'rejected');
    if (failed.length > 0) {
      throw new Error(`${failed.length}개 삭제 실패 (나머지는 완료)`);
    }
  };

  return (
    <>
      <AdminPropertyListTable
        title="건물 목록"
        subtitle="시설 관리 대상 건물"
        fetcher={fetchBuildings}
        columns={columns}
        initialQuery={{ page: 1, size: 10, sort: 'buildingId', direct: 'DESC' }}
        rowKey="buildingId"
        emptyMessage="등록된 건물이 없습니다."
        createLabel="건물 등록"
        onCreateClick={() => setCreateModal(true)}
        reloadRef={reloadRef}
        onDeleteSelected={handleDeleteSelected}
        deleteLabel="건물 삭제"
      />

      {createModal && (
        <AdminBuildingModal
          onClose={() => setCreateModal(false)}
          onSuccess={handleSuccess}
        />
      )}

      {editId && (
        <AdminBuildingModal
          buildingId={editId}
          onClose={() => setEditId(null)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}
