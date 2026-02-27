import React from 'react';
import { AdminEndpointListProbe } from '../../components/AdminEndpointProbe';
import { adminApi } from '../../api/adminApi';

export default function AdminPaymentList() {
  return <AdminEndpointListProbe title="Admin Payments" fetcher={() => adminApi.getPayments()} />;
}
