import React from 'react';
import { AdminEndpointListProbe } from '../../components/AdminEndpointProbe';
import { adminApi } from '../../api/adminApi';

export default function AdminSpaceList() {
  return <AdminEndpointListProbe title="Admin Spaces" fetcher={() => adminApi.getSpaces()} />;
}
