import React from 'react';
import { AdminEndpointListProbe } from '../../components/AdminEndpointProbe';
import { adminApi } from '../../api/adminApi';

export default function AdminCompanyInfoDetail() {
  return <AdminEndpointListProbe title="Admin Company Info" fetcher={() => adminApi.getCompanyInfo()} />;
}
