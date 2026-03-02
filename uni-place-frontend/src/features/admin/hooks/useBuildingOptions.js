import { useState, useEffect } from 'react';
import { adminApi } from '../api/adminApi';

/**
 * 건물 목록을 가져와서 드롭다운 옵션으로 반환하는 훅
 */
export default function useBuildingOptions() {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    adminApi
      .getBuildings({ page: 1, size: 100, sort: 'buildingId', direct: 'ASC' })
      .then((res) => {
        const list = Array.isArray(res?.content)
          ? res.content
          : Array.isArray(res)
            ? res
            : [];
        setBuildings(list);
      })
      .catch(() => setBuildings([]))
      .finally(() => setLoading(false));
  }, []);

  return { buildings, loading };
}
