import { useCallback, useEffect, useState } from 'react';
import { contractApi } from '../../contract/api/contractApi';
import { pickActiveTenantContract } from '../utils/tenantContract';

export function useTenantContract({ autoFetch = true } = {}) {
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchTenantContract = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const contracts = await contractApi.myContracts();
      const active = pickActiveTenantContract(contracts);
      setContract(active);
      if (!active) {
        setError('현재 입주 중인 계약이 없어 룸서비스를 이용할 수 없습니다.');
      }
      return active;
    } catch (e) {
      setContract(null);
      setError(e?.message || '입주 계약 정보를 불러오지 못했습니다.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!autoFetch) return;
    fetchTenantContract();
  }, [autoFetch, fetchTenantContract]);

  return {
    contract,
    loading,
    error,
    refetch: fetchTenantContract,
    buildingId: contract?.buildingId ?? null,
    buildingNm: contract?.buildingNm ?? '',
    roomId: contract?.roomId ?? null,
    roomNo: contract?.roomNo ?? null,
  };
}
