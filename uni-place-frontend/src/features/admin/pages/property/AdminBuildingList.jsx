import React from 'react';
import { AdminEndpointListProbe } from '../../components/AdminEndpointProbe';
import { adminApi } from '../../api/adminApi';

export default function AdminBuildingList() {
  return <AdminEndpointListProbe title="Admin Buildings" fetcher={() => adminApi.getBuildings()} />;
}
