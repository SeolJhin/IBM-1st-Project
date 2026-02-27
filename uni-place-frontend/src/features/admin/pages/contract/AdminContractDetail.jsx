// features/admin/pages/contract/AdminContractDetail.jsx
import React from 'react';
import { AdminEndpointDetailProbe } from '../../components/AdminEndpointProbe';
import { adminApi } from '../../api/adminApi';

export default function AdminContractDetail() {
  return (
    <AdminEndpointDetailProbe
      title="Admin Contract Detail"
      idLabel="Contract ID"
      fetcher={(id) => adminApi.contractDetail(id)}
      parseId={(v) => (v === '' ? '' : Number(v))}
    />
  );
}
