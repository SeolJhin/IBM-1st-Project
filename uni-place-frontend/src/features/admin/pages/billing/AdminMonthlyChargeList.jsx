import React from 'react';
import { AdminEndpointListProbe } from '../../components/AdminEndpointProbe';
import { adminApi } from '../../api/adminApi';

export default function AdminMonthlyChargeList() {
  return (
    <AdminEndpointListProbe
      title="Admin Monthly Charges"
      fetcher={(filters) => adminApi.getMonthlyCharges(filters.contractId)}
      controls={[{ name: 'contractId', label: 'Contract ID', type: 'number' }]}
      initialFilters={{ contractId: '' }}
      normalizeFilters={(f) => ({
        contractId: f.contractId === '' ? '' : Number(f.contractId),
      })}
    />
  );
}
