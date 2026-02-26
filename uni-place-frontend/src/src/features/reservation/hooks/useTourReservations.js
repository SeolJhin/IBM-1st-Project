import { useCallback, useEffect, useState } from 'react';
import { reservationApi } from '../api/reservationApi';

export default function useTourReservations() {
  // rooms
  const [roomsQuery, setRoomsQuery] = useState({
    buildingId: 1,
    buildingNm: '',
    page: 1,
    size: 10,
    sort: 'roomId',
    direct: 'DESC',
  });

  const [roomsPage, setRoomsPage] = useState(null);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState('');

  const loadRooms = useCallback(async () => {
    setRoomsLoading(true);
    setRoomsError('');
    try {
      // ✅ 네 API: reservationApi.reservableRooms
      const page = await reservationApi.reservableRooms(roomsQuery);
      setRoomsPage(page);
    } catch (e) {
      setRoomsError(e?.message ?? '방 조회 실패');
      setRoomsPage(null);
    } finally {
      setRoomsLoading(false);
    }
  }, [roomsQuery]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  // slots
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState('');
  const [slots, setSlots] = useState([]);

  const loadSlots = useCallback(async ({ buildingId, roomId, date }) => {
    setSlotsLoading(true);
    setSlotsError('');
    try {
      // ✅ 네 API: reservationApi.reservableTourSlots
      const res = await reservationApi.reservableTourSlots({
        buildingId,
        roomId,
        date,
      });
      setSlots(res?.availableSlots ?? []);
      return res;
    } catch (e) {
      setSlotsError(e?.message ?? '슬롯 조회 실패');
      setSlots([]);
      throw e;
    } finally {
      setSlotsLoading(false);
    }
  }, []);

  // lookup
  const [lookupPage, setLookupPage] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');

  const lookup = useCallback(async (body, pageOpt) => {
    setLookupLoading(true);
    setLookupError('');
    try {
      // ✅ 네 API: reservationApi.lookupTourReservations
      const page = await reservationApi.lookupTourReservations(body, pageOpt);
      setLookupPage(page);
      return page;
    } catch (e) {
      setLookupError(e?.message ?? '조회 실패');
      setLookupPage(null);
      throw e;
    } finally {
      setLookupLoading(false);
    }
  }, []);

  const create = useCallback(
    async (body) => reservationApi.createTourReservation(body),
    []
  );

  const cancel = useCallback(
    async (tourId, body) => reservationApi.cancelTourReservation(tourId, body),
    []
  );

  return {
    roomsQuery,
    setRoomsQuery,
    roomsPage,
    roomsLoading,
    roomsError,
    reloadRooms: loadRooms,

    slots,
    slotsLoading,
    slotsError,
    loadSlots,

    create,

    lookup,
    lookupPage,
    lookupLoading,
    lookupError,

    cancel,
  };
}
