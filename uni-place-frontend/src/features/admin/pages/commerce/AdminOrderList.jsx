import React from 'react';
import { AdminEndpointListProbe } from '../../components/AdminEndpointProbe';
import { adminApi } from '../../api/adminApi';

export default function AdminOrderList() {
  return <AdminEndpointListProbe title="Admin Orders" fetcher={() => adminApi.getAllOrders()} />;
}
