import React from 'react';
import { AdminEndpointDetailProbe } from '../../components/AdminEndpointProbe';
import { adminApi } from '../../api/adminApi';

export default function AdminResidentDetail() {
  return (
    <AdminEndpointDetailProbe
      title="Admin Resident Detail"
      idLabel="User ID"
      fetcher={(userId) => adminApi.getUserDetail(userId)}
    />
  );
}
