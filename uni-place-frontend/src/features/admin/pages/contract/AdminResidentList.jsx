import React from 'react';
import { AdminEndpointListProbe } from '../../components/AdminEndpointProbe';
import { adminApi } from '../../api/adminApi';

export default function AdminResidentList() {
  return <AdminEndpointListProbe title="Admin Residents" fetcher={() => adminApi.getResidents()} />;
}
