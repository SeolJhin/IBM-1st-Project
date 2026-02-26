import React from 'react';
import { AdminEndpointDetailProbe } from '../../components/AdminEndpointProbe';
import { adminApi } from '../../api/adminApi';

export default function AdminFaqDetail() {
  return (
    <AdminEndpointDetailProbe
      title="Admin FAQ Detail"
      idLabel="FAQ ID"
      fetcher={(id) => adminApi.getFaqDetail(id)}
      parseId={(v) => (v === '' ? '' : Number(v))}
    />
  );
}
