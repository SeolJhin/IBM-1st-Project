// features/admin/pages/user/AdminUserDetail.jsx
import React from 'react';
import { AdminEndpointDetailProbe } from '../../components/AdminEndpointProbe';
import { adminApi } from '../../api/adminApi';

export default function AdminUserDetail() {
  return (
    <AdminEndpointDetailProbe
      title="Admin User Detail"
      idLabel="User ID"
      fetcher={(id) => adminApi.getUserDetail(id)}
      parseId={(v) => v} // userId는 문자열
    />
  );
}
