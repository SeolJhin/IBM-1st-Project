import React from 'react';
import { AdminEndpointDetailProbe } from '../../components/AdminEndpointProbe';
import { adminApi } from '../../api/adminApi';

export default function AdminRefundDetail() {
  return (
    <AdminEndpointDetailProbe
      title="Admin Refund Detail"
      idLabel="Refund ID"
      fetcher={(id) => adminApi.getRefundDetail(id)}
      parseId={(v) => (v === '' ? '' : Number(v))}
    />
  );
}
