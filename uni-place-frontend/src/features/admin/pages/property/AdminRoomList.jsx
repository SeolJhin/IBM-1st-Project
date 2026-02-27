import React from 'react';
import { AdminEndpointListProbe } from '../../components/AdminEndpointProbe';
import { adminApi } from '../../api/adminApi';

export default function AdminRoomList() {
  return <AdminEndpointListProbe title="Admin Rooms" fetcher={() => adminApi.getRooms()} />;
}
