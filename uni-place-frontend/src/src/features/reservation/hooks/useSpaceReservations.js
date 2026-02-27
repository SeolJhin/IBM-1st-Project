import { useCallback, useEffect, useState } from 'react';
import { reservationApi } from '../api/reservationApi';

export default function useSpaceReservations() {
  // ✅ reservable spaces
  const [spacesQuery, setSpacesQuery] = useState({
    buildingId: 1,
    date: new Date().toISOString().slice(0, 10),
    page: 1,
    size: 10,
    sort: 'spaceId',
    direct: 'DESC',
  });

  const [spacesPage, setSpacesPage] = useState(null);
  const [spacesLoading, setSpacesLoading] = useState(false);
  const [spacesError, setSpacesError] = useState('');

  const loadSpaces = useCallback(async () => {
    setSpacesLoading(true);
    setSpacesError('');
    try {
      // ✅ 네 API: reservationApi.reservableSpaces
      const page = await reservationApi.reservableSpaces(spacesQuery);
      setSpacesPage(page);
    } catch (e) {
      setSpacesError(e?.message ?? '공용공간 조회 실패');
      setSpacesPage(null);
    } finally {
      setSpacesLoading(false);
    }
  }, [spacesQuery]);

  useEffect(() => {
    loadSpaces();
  }, [loadSpaces]);

  // ✅ my reservations
  const [myQuery, setMyQuery] = useState({
    page: 1,
    size: 10,
    sort: 'reservationId',
    direct: 'DESC',
  });

  const [myPage, setMyPage] = useState(null);
  const [myLoading, setMyLoading] = useState(false);
  const [myError, setMyError] = useState('');

  const loadMy = useCallback(async () => {
    setMyLoading(true);
    setMyError('');
    try {
      // ✅ 네 API: reservationApi.mySpaceReservations
      const page = await reservationApi.mySpaceReservations(myQuery);
      setMyPage(page);
    } catch (e) {
      setMyError(e?.message ?? '내 예약 조회 실패');
      setMyPage(null);
    } finally {
      setMyLoading(false);
    }
  }, [myQuery]);

  useEffect(() => {
    loadMy();
  }, [loadMy]);

  // ✅ create / cancel (네 API 함수명에 맞춤)
  const create = useCallback(
    async (body) => reservationApi.createSpaceReservation(body),
    []
  );

  const cancel = useCallback(
    async (reservationId) =>
      reservationApi.cancelSpaceReservation(reservationId),
    []
  );

  return {
    spacesQuery,
    setSpacesQuery,
    spacesPage,
    spacesLoading,
    spacesError,
    reloadSpaces: loadSpaces,

    myQuery,
    setMyQuery,
    myPage,
    myLoading,
    myError,
    reloadMy: loadMy,

    create,
    cancel,
  };
}
