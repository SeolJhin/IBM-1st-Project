import React from 'react';
import { AdminEndpointListProbe } from '../../components/AdminEndpointProbe';
import { adminApi } from '../../api/adminApi';

export default function AdminAffiliateList() {
  return <AdminEndpointListProbe title="Admin Affiliates" fetcher={() => adminApi.getAffiliates()} />;
}
