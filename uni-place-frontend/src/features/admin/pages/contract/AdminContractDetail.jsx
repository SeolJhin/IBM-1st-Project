import React from 'react';
import { AdminEndpointDetailProbe } from '../../components/AdminEndpointProbe';
import { adminApi } from '../../api/adminApi';

export default function AdminContractDetail() {
  return (
    <AdminEndpointDetailProbe
      title="Admin Contract Detail"
      idLabel="Contract ID"
      fetcher={(id) => adminApi.getContractById(id)}
      parseId={(v) => (v === '' ? '' : Number(v))}
    />
  );
}
