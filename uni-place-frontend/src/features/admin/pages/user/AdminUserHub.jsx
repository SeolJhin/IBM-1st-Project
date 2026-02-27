import React from 'react';
import { AdminEndpointListProbe } from '../../components/AdminEndpointProbe';
import { adminApi } from '../../api/adminApi';

export default function AdminUserHub() {
  return (
    <AdminEndpointListProbe
      title="Admin User Hub"
      fetcher={async () => ({
        dashboard: await adminApi.dashboard(),
        residents: await adminApi.getResidents(),
      })}
    />
  );
}
