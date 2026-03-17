import React, { useCallback, useRef, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import AdminPropertyListTable from './AdminPropertyListTable';
import AdminRoomModal from './AdminRoomModal';

const ROOM_ST_LABEL = {
  available: '입주가능',
  reserved: '예약중',
  contracted: '계약중',
  repair: '수리중',
  cleaning: '청소중',
};

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
        buildingNm: q.buildingNm || undefined,
        roomNo: q.roomNo || undefined,
        roomSt: q.roomSt || undefined,
      }),
    []
  );

  const columns = [
    { key: 'roomNo', label: '방번호' },
    { key: 'buildingNm', label: '건물명' },
    {
      key: 'floorInfo',
      label: '호수/층',
      render: (row) => `${row?.roomNo ?? '-'}호 / ${row?.floor ?? '-'}층`,
    },
    {
      key: 'roomSt',
      label: '상태',
      render: (row) => ROOM_ST_LABEL[row?.roomSt] ?? row?.roomSt ?? '-',
    },
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
      key: 'buildingNm',
      label: '건물 이름',
      type: 'text',
      placeholder: '예: Uniplace A',
    },
    {
      key: 'roomNo',
      label: '방번호',
      type: 'number',
      placeholder: '예: 101',
      parse: (v) => (v === '' ? '' : Number(v)),
    },
    {
      key: 'roomSt',
      label: '방 상태',
      type: 'select',
      options: [
        { value: '', label: '전체' },
        { value: 'available', label: '입주가능' },
        { value: 'reserved', label: '예약중' },
        { value: 'contracted', label: '계약중' },
        { value: 'repair', label: '수리중' },
        { value: 'cleaning', label: '청소중' },
      ],
    },
  ];

  const handleSuccess = () => reloadRef.current?.();

  const handleDeleteSelected = async (ids) => {
    const results = await Promise.allSettled(
      ids.map((id) => adminApi.deleteRoom(id))
    );
    const failed = results.filter((r) => r.status === 'rejected');
    if (failed.length > 0) {
      throw new Error(`${failed.length}개 삭제 실패 (나머지는 완료)`);
    }
  };

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
          buildingNm: '',
          roomNo: '',
          roomSt: '',
        }}
        filters={filters}
        rowKey="roomId"
        emptyMessage="조회된 방 데이터가 없습니다."
        createLabel="방 등록"
        onCreateClick={() => setCreateModal(true)}
        reloadRef={reloadRef}
        onDeleteSelected={handleDeleteSelected}
        deleteLabel="방 삭제"
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
