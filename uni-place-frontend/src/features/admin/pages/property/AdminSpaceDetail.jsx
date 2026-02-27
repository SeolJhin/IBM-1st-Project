import React from 'react';
import { AdminEndpointDetailProbe } from '../../components/AdminEndpointProbe';
import { adminApi } from '../../api/adminApi';

export default function AdminSpaceDetail() {
  return (
    <AdminEndpointDetailProbe
      title="Admin Space Detail"
      idLabel="Space ID"
      fetcher={(id) => adminApi.getSpaceDetail(id)}
      parseId={(v) => (v === '' ? '' : Number(v))}
    />
  );
}
