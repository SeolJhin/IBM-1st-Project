import React from 'react';
import { AdminEndpointDetailProbe } from '../../components/AdminEndpointProbe';
import { adminApi } from '../../api/adminApi';

export default function AdminBannerDetail() {
  return (
    <AdminEndpointDetailProbe
      title="Admin Banner Detail"
      idLabel="Banner ID"
      fetcher={(id) => adminApi.getBannerDetail(id)}
      parseId={(v) => (v === '' ? '' : Number(v))}
    />
  );
}
