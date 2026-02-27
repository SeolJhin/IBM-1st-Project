import React from 'react';
import { AdminEndpointListProbe } from '../../components/AdminEndpointProbe';
import { adminApi } from '../../api/adminApi';

export default function AdminProductList() {
  return <AdminEndpointListProbe title="Admin Products" fetcher={() => adminApi.getProducts()} />;
}
