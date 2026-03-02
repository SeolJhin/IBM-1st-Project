import React, { useCallback, useRef, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import AdminPropertyListTable from './AdminPropertyListTable';
import AdminRoomModal from './AdminRoomModal';

export default function AdminRoomList() {
  const [createModal, setCreateModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const reloadRef = useRef(null);

  const fetchRooms = useCallback(
    (q) =>
      adminApi.getRooms({
        page: q.page,
        size: q.size,
        sort: q.sort,
        direct: q.direct,
        buildingId: q.buildingId || undefined,
        roomSt: q.roomSt || undefined,
      }),
    []
  );

  const columns = [
    { key: 'roomId', label: '방 ID' },
    { key: 'buildingNm', label: '건물명' },
    {
      key: 'roomNo',
      label: '호수/층',
      render: (row) => `${row?.roomNo ?? '-'}호 / ${row?.floor ?? '-'}층`,
    },
    { key: 'roomSt', label: '상태' },
    {
      key: 'price',
      label: '보증금/월세',
      render: (row) =>
        `${Number(row?.deposit ?? 0).toLocaleString()} / ${Number(row?.rentPrice ?? 0).toLocaleString()}`,
    },
    { key: 'roomCapacity', label: '수용 인원' },
    {
      key: 'actions',
      label: '관리',
      render: (row) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setEditId(row.roomId);
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
    {
      key: 'roomSt',
      label: '방 상태',
      type: 'select',
      options: [
        { value: '', label: '전체' },
        { value: 'available', label: 'available' },
        { value: 'reserved', label: 'reserved' },
        { value: 'contracted', label: 'contracted' },
        { value: 'repair', label: 'repair' },
        { value: 'cleaning', label: 'cleaning' },
      ],
    },
  ];

  const handleSuccess = () => reloadRef.current?.();

  return (
    <>
      <AdminPropertyListTable
        title="방 목록"
        subtitle="건물별 객실 현황"
        fetcher={fetchRooms}
        columns={columns}
        initialQuery={{
          page: 1,
          size: 10,
          sort: 'roomId',
          direct: 'DESC',
          buildingId: '',
          roomSt: '',
        }}
        filters={filters}
        rowKey="roomId"
        emptyMessage="조회된 방 데이터가 없습니다."
        createLabel="방 등록"
        onCreateClick={() => setCreateModal(true)}
        reloadRef={reloadRef}
      />

      {createModal && (
        <AdminRoomModal
          onClose={() => setCreateModal(false)}
          onSuccess={handleSuccess}
        />
      )}

      {editId && (
        <AdminRoomModal
          roomId={editId}
          onClose={() => setEditId(null)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}
