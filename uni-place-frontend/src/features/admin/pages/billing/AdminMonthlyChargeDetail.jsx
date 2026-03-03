import React from 'react';
import { AdminEndpointDetailProbe } from '../../components/AdminEndpointProbe';
import { adminApi } from '../../api/adminApi';

export default function AdminMonthlyChargeDetail() {
  return (
    <AdminEndpointDetailProbe
      title="?? ?? ??"
      idLabel="?? ID"
      fetcher={(id) => adminApi.getMonthlyChargeDetail(id)}
      parseId={(v) => (v === '' ? '' : Number(v))}
    />
  );
}
