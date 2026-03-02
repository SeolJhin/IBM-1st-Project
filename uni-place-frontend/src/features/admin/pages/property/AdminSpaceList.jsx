import React, { useCallback, useRef, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import AdminPropertyListTable from './AdminPropertyListTable';
import AdminSpaceModal from './AdminSpaceModal';

export default function AdminSpaceList() {
  const [createModal, setCreateModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const reloadRef = useRef(null);

  const fetchSpaces = useCallback(
    (q) =>
      adminApi.getSpaces({
        page: q.page,
        size: q.size,
        sort: q.sort,
        direct: q.direct,
        buildingId: q.buildingId || undefined,
      }),
    []
  );

  const columns = [
    { key: 'spaceId', label: '공간 ID' },
    { key: 'buildingNm', label: '건물명' },
    { key: 'spaceNm', label: '공간명' },
    { key: 'spaceFloor', label: '층수' },
    { key: 'spaceCapacity', label: '수용 인원' },
    { key: 'spaceOptions', label: '옵션' },
    {
      key: 'actions',
      label: '관리',
      render: (row) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setEditId(row.spaceId);
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

  const filters = [
    {
      key: 'buildingId',
      label: '건물 ID',
      type: 'number',
      placeholder: '예: 1',
      parse: (v) => (v === '' ? '' : Number(v)),
    },
  ];

  const handleSuccess = () => reloadRef.current?.();

  return (
    <>
      <AdminPropertyListTable
        title="공용공간 목록"
        subtitle="시설별 공용공간 현황"
        fetcher={fetchSpaces}
        columns={columns}
        initialQuery={{
          page: 1,
          size: 10,
          sort: 'spaceId',
          direct: 'DESC',
          buildingId: '',
        }}
        filters={filters}
        rowKey="spaceId"
        emptyMessage="조회된 공용공간 데이터가 없습니다."
        createLabel="공용공간 등록"
        onCreateClick={() => setCreateModal(true)}
        reloadRef={reloadRef}
      />

      {createModal && (
        <AdminSpaceModal
          onClose={() => setCreateModal(false)}
          onSuccess={handleSuccess}
        />
      )}

      {editId && (
        <AdminSpaceModal
          spaceId={editId}
          onClose={() => setEditId(null)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}
