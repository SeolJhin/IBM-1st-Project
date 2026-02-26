import React from 'react';
import { AdminEndpointDetailProbe } from '../../components/AdminEndpointProbe';
import { adminApi } from '../../api/adminApi';

export default function AdminOrderDetail() {
  return (
    <AdminEndpointDetailProbe
      title="Admin Order Detail"
      idLabel="Order ID"
      fetcher={(id) => adminApi.getOrderDetail(id)}
      parseId={(v) => (v === '' ? '' : Number(v))}
    />
  );
}
