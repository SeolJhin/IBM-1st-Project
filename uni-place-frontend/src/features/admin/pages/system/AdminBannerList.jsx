import React from 'react';
import { AdminEndpointListProbe } from '../../components/AdminEndpointProbe';
import { adminApi } from '../../api/adminApi';

export default function AdminBannerList() {
  return <AdminEndpointListProbe title="Admin Banners" fetcher={() => adminApi.getBanners()} />;
}
