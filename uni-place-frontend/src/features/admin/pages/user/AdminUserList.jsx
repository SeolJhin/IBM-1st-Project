import React from 'react';
import { AdminEndpointListProbe } from '../../components/AdminEndpointProbe';
import { adminApi } from '../../api/adminApi';

export default function AdminUserList() {
  return <AdminEndpointListProbe title="Admin User List" fetcher={() => adminApi.getResidents()} />;
}
