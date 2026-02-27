import React from 'react';
import { AdminEndpointDetailProbe } from '../../components/AdminEndpointProbe';
import { adminApi } from '../../api/adminApi';

export default function AdminTourReservationDetail() {
  return (
    <AdminEndpointDetailProbe
      title="Admin Tour Reservation Detail"
      idLabel="Tour ID"
      fetcher={(id) => adminApi.getTourReservationById(id)}
      parseId={(v) => (v === '' ? '' : Number(v))}
    />
  );
}
