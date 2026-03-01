import React, { useCallback } from 'react';
import { adminApi } from '../../api/adminApi';
import AdminPropertyListTable from './AdminPropertyListTable';

export default function AdminSpaceList() {
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

  return (
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
    />
  );
}
