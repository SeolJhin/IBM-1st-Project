import React from 'react';
import { AdminEndpointDetailProbe } from '../../components/AdminEndpointProbe';
import { adminApi } from '../../api/adminApi';

export default function AdminComplainDetail() {
  return (
    <AdminEndpointDetailProbe
      title="Admin Complain Detail"
      idLabel="Complain ID"
      fetcher={(id) => adminApi.getComplainDetail(id)}
      parseId={(v) => (v === '' ? '' : Number(v))}
    />
  );
}
