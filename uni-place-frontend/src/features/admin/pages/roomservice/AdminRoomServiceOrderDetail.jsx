import React from 'react';
import { AdminEndpointDetailProbe } from '../../components/AdminEndpointProbe';
import { adminApi } from '../../api/adminApi';

export default function AdminRoomServiceOrderDetail() {
  return (
    <AdminEndpointDetailProbe
      title="Admin Room Service Order Detail"
      idLabel="Order ID"
      fetcher={(id) => adminApi.getRoomServiceOrderById(id)}
      parseId={(v) => (v === '' ? '' : Number(v))}
    />
  );
}
