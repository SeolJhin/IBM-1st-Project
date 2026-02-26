import React from 'react';
import { AdminEndpointListProbe } from '../../components/AdminEndpointProbe';
import { adminApi } from '../../api/adminApi';

export default function AdminRefundList() {
  return <AdminEndpointListProbe title="Admin Refunds" fetcher={() => adminApi.getRefunds()} />;
}
