import React, { useCallback } from 'react';
import { adminApi } from '../../api/adminApi';
import AdminPropertyListTable from './AdminPropertyListTable';

export default function AdminBuildingList() {
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
  ];

  return (
    <AdminPropertyListTable
      title="건물 목록"
      subtitle="시설 관리 대상 건물"
      fetcher={fetchBuildings}
      columns={columns}
      initialQuery={{ page: 1, size: 10, sort: 'buildingId', direct: 'DESC' }}
      rowKey="buildingId"
      emptyMessage="등록된 건물이 없습니다."
    />
  );
}
