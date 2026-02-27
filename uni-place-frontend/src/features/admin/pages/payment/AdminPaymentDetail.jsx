import React from 'react';
import { AdminEndpointDetailProbe } from '../../components/AdminEndpointProbe';
import { adminApi } from '../../api/adminApi';

export default function AdminPaymentDetail() {
  return (
    <AdminEndpointDetailProbe
      title="Admin Payment Detail"
      idLabel="Payment ID"
      fetcher={(id) => adminApi.getPaymentDetail(id)}
      parseId={(v) => (v === '' ? '' : Number(v))}
    />
  );
}
