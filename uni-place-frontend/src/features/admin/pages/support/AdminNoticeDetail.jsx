import React from 'react';
import { AdminEndpointDetailProbe } from '../../components/AdminEndpointProbe';
import { adminApi } from '../../api/adminApi';

export default function AdminNoticeDetail() {
  return (
    <AdminEndpointDetailProbe
      title="Admin Notice Detail"
      idLabel="Notice ID"
      fetcher={(id) => adminApi.getNoticeDetail(id)}
      parseId={(v) => (v === '' ? '' : Number(v))}
    />
  );
}
