import React from 'react';
import { AdminEndpointListProbe } from '../../components/AdminEndpointProbe';
import { adminApi } from '../../api/adminApi';

export default function AdminRoomServiceOrderList() {
  return <AdminEndpointListProbe title="Admin Room Service Orders" fetcher={() => adminApi.getAllRoomServiceOrders()} />;
}
