import React from 'react';
import { AdminEndpointListProbe } from '../../components/AdminEndpointProbe';
import { adminApi } from '../../api/adminApi';

export default function AdminContractList() {
  return <AdminEndpointListProbe title="Admin Contracts" fetcher={() => adminApi.getContracts()} />;
}
