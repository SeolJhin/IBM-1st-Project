import React from 'react';
import { AdminEndpointDetailProbe } from '../../components/AdminEndpointProbe';
import { adminApi } from '../../api/adminApi';

export default function AdminSpaceReservationDetail() {
  return (
    <AdminEndpointDetailProbe
      title="Admin Space Reservation Detail"
      idLabel="Reservation ID"
      fetcher={(id) => adminApi.spaceReservationDetail(id)}
      parseId={(v) => (v === '' ? '' : Number(v))}
    />
  );
}
