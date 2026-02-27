import React from 'react';
import { AdminEndpointDetailProbe } from '../../components/AdminEndpointProbe';
import { adminApi } from '../../api/adminApi';

export default function AdminAffiliateDetail() {
  return (
    <AdminEndpointDetailProbe
      title="Admin Affiliate Detail"
      idLabel="Affiliate ID"
      fetcher={(id) => adminApi.getAffiliateDetail(id)}
      parseId={(v) => (v === '' ? '' : Number(v))}
    />
  );
}
