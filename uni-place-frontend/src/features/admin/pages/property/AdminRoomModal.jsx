import { createPortal } from 'react-dom';
import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';
import useBuildingOptions from '../../hooks/useBuildingOptions';
import FileUploader from '../../../file/components/FileUploader';
import useFileUpload from '../../../file/hooks/useFileUpload';
import styles from './AdminCreateModal.module.css';

const EMPTY = {
  buildingNm: '',
  roomNo: '',
  floor: '',
  roomSize: '',
  roomType: '',
  petAllowedYn: 'N',
  deposit: '',
  rentPrice: '',
  manageFee: '',
  rentType: 'monthly_rent',
  roomSt: 'available',
  roomOptions: '',
  roomCapacity: '',
  rentMin: '',
  sunDirection: '',
  roomDesc: '',
};

const RENT_TYPES = [
  { value: 'monthly_rent', label: '월세' },
  { value: 'stay', label: '단기' },
];
const ROOM_STATUS = [
  { value: 'available', label: '입주가능' },
  { value: 'reserved', label: '예약중' },
  { value: 'contracted', label: '계약중' },
  { value: 'repair', label: '수리중' },
  { value: 'cleaning', label: '청소중' },
];
const SUN_DIRS = [
  { value: '', label: '미선택' },
  { value: 'e', label: '동향' },
  { value: 'w', label: '서향' },
  { value: 's', label: '남향' },
  { value: 'n', label: '북향' },
];

const ROOM_TYPES = [
  { value: '', label: '미선택' },
  { value: 'one_room', label: '원룸형' },
  { value: 'two_room', label: '투룸형' },
  { value: 'three_room', label: '쓰리룸형' },
  { value: 'loft', label: '복층' },
  { value: 'share', label: '쉐어' },
];

export default function AdminRoomModal({ roomId, onClose, onSuccess }) {
  const isEdit = !!roomId;
  const { buildings, loading: bldgLoading } = useBuildingOptions();
  const [form, setForm] = useState(EMPTY);
  const [existingFiles, setExistingFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);
  const [error, setError] = useState('');
  const fu = useFileUpload({ maxCount: 10 });

  useEffect(() => {
    if (!isEdit) return;
    setFetchLoading(true);
    adminApi
      .getRoomDetail(roomId)
      .then((data) => {
        setForm({
          buildingNm: data.buildingNm || '',
          roomNo: data.roomNo ?? '',
          floor: data.floor ?? '',
          roomSize: data.roomSize ?? '',
          roomType: data.roomType || '',
          petAllowedYn: data.petAllowedYn || 'N',
          deposit: data.deposit ?? '',
          rentPrice: data.rentPrice ?? '',
          manageFee: data.manageFee ?? '',
          rentType: data.rentType || 'monthly_rent',
          roomSt: data.roomSt || 'available',
          roomOptions: data.roomOptions || '',
          roomCapacity: data.roomCapacity ?? '',
          rentMin: data.rentMin ?? '',
          sunDirection: data.sunDirection || '',
          roomDesc: data.roomDesc || '',
        });
        setExistingFiles(data.files || []);
        fu.initExistingOrder(data.files || []);
      })
      .catch((e) => setError(e?.message || '불러오기 실패'))
      .finally(() => setFetchLoading(false));
  }, [isEdit, roomId]);

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.buildingNm) {
      setError('건물을 선택해주세요.');
      return;
    }
    if (!form.roomNo) {
      setError('호수는 필수입니다.');
      return;
    }
    if (!form.floor) {
      setError('층수는 필수입니다.');
      return;
    }
    if (!form.roomSize) {
      setError('방 크기는 필수입니다.');
      return;
    }
    if (!form.rentPrice) {
      setError('월세는 필수입니다.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== '') fd.append(k, v);
      });
      fu.newFiles.forEach((f) => fd.append('files', f));
      if (isEdit) {
        fu.deleteFileIds.forEach((id) => fd.append('deleteFileIds', id));
        if (fu.existingOrder) {
          fu.existingOrder.forEach((id) => fd.append('fileOrder', id));
        }
      }
      const result = await (isEdit
        ? adminApi.updateRoom(roomId, fd)
        : adminApi.createRoom(fd));
      // 수정 완료 후 서버 응답으로 existingFiles 즉시 갱신
      // → 모달을 닫지 않고 다시 열어도 삭제된 이미지가 사라진 상태로 표시됨
      if (isEdit && result?.files) {
        setExistingFiles(result.files);
        fu.reset();
        fu.initExistingOrder(result.files);
      }
      onSuccess?.();
      onClose();
    } catch (e) {
      const msg = e?.message || '';
      const code = e?.errorCode || '';
      const msgLower = msg.toLowerCase();
      if (code === 'BUILDING_409') {
        setError('이미 같은 이름의 건물이 존재합니다.');
      } else if (
        msgLower.includes('uq_rooms_building_roomno') ||
        msgLower.includes('duplicate entry')
      ) {
        setError('같은 건물에 이미 동일한 호수의 방이 존재합니다.');
      } else if (code === 'BUILDING_404') {
        setError('선택한 건물을 찾을 수 없습니다.');
      } else if (code === 'BAD_REQUEST' && msg.includes('건물명')) {
        setError('건물명이 중복됩니다. 관리자에게 문의하세요.');
      } else {
        setError(msg || `방 ${isEdit ? '수정' : '등록'} 실패`);
      }
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>방 {isEdit ? '수정' : '등록'}</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>
        {fetchLoading ? (
          <div className={styles.body}>
            <p style={{ color: '#6b7280', fontSize: 13 }}>불러오는 중...</p>
          </div>
        ) : (
          <div className={styles.body}>
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>위치 정보</h3>
              <div className={styles.grid2}>
                <label
                  className={styles.field}
                  style={{ gridColumn: '1 / -1' }}
                >
                  <span className={styles.label}>
                    건물 선택 <span className={styles.req}>*</span>
                  </span>
                  <select
                    className={styles.select}
                    name="buildingNm"
                    value={form.buildingNm}
                    onChange={handleChange}
                    disabled={bldgLoading}
                  >
                    <option value="">
                      {bldgLoading ? '불러오는 중...' : '건물을 선택하세요'}
                    </option>
                    {buildings.map((b) => (
                      <option key={b.buildingId} value={b.buildingNm}>
                        [{b.buildingId}] {b.buildingNm} — {b.buildingAddr}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>
                    호수 <span className={styles.req}>*</span>
                  </span>
                  <input
                    className={styles.input}
                    type="number"
                    name="roomNo"
                    value={form.roomNo}
                    onChange={handleChange}
                    placeholder="예: 101"
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>
                    층수 <span className={styles.req}>*</span>
                  </span>
                  <input
                    className={styles.input}
                    type="number"
                    name="floor"
                    value={form.floor}
                    onChange={handleChange}
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>
                    방 크기 (㎡) <span className={styles.req}>*</span>
                  </span>
                  <input
                    className={styles.input}
                    type="number"
                    name="roomSize"
                    value={form.roomSize}
                    onChange={handleChange}
                    placeholder="예: 19.5"
                  />
                </label>
              </div>
            </div>
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>임대 조건</h3>
              <div className={styles.grid2}>
                <label className={styles.field}>
                  <span className={styles.label}>임대 유형</span>
                  <select
                    className={styles.select}
                    name="rentType"
                    value={form.rentType}
                    onChange={handleChange}
                  >
                    {RENT_TYPES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>보증금 (원)</span>
                  <input
                    className={styles.input}
                    type="number"
                    name="deposit"
                    value={form.deposit}
                    onChange={handleChange}
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>
                    월세 (원) <span className={styles.req}>*</span>
                  </span>
                  <input
                    className={styles.input}
                    type="number"
                    name="rentPrice"
                    value={form.rentPrice}
                    onChange={handleChange}
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>관리비 (원)</span>
                  <input
                    className={styles.input}
                    type="number"
                    name="manageFee"
                    value={form.manageFee}
                    onChange={handleChange}
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>최소 계약 (개월)</span>
                  <input
                    className={styles.input}
                    type="number"
                    name="rentMin"
                    value={form.rentMin}
                    onChange={handleChange}
                  />
                </label>
              </div>
            </div>
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>방 상세</h3>
              <div className={styles.grid2}>
                <label className={styles.field}>
                  <span className={styles.label}>수용 인원</span>
                  <input
                    className={styles.input}
                    type="number"
                    name="roomCapacity"
                    value={form.roomCapacity}
                    onChange={handleChange}
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>방 상태</span>
                  <select
                    className={styles.select}
                    name="roomSt"
                    value={form.roomSt}
                    onChange={handleChange}
                  >
                    {ROOM_STATUS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>채광 방향</span>
                  <select
                    className={styles.select}
                    name="sunDirection"
                    value={form.sunDirection}
                    onChange={handleChange}
                  >
                    {SUN_DIRS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>방 유형</span>
                  <select
                    className={styles.select}
                    name="roomType"
                    value={form.roomType}
                    onChange={handleChange}
                  >
                    {ROOM_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>반려동물</span>
                  <select
                    className={styles.select}
                    name="petAllowedYn"
                    value={form.petAllowedYn}
                    onChange={handleChange}
                  >
                    <option value="Y">허용</option>
                    <option value="N">불가</option>
                  </select>
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>옵션 (쉼표 구분)</span>
                  <input
                    className={styles.input}
                    name="roomOptions"
                    value={form.roomOptions}
                    onChange={handleChange}
                    placeholder="예: 냉장고,에어컨,세탁기"
                  />
                </label>
              </div>
              <label className={styles.field}>
                <span className={styles.label}>방 설명</span>
                <textarea
                  className={styles.textarea}
                  name="roomDesc"
                  value={form.roomDesc}
                  onChange={handleChange}
                  rows={3}
                />
              </label>
            </div>
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>이미지</h3>
              <FileUploader
                existingFiles={existingFiles}
                newFiles={fu.newFiles}
                previews={fu.previews}
                deleteFileIds={fu.deleteFileIds}
                existingOrder={fu.existingOrder}
                addFiles={fu.addFiles}
                removeNewFile={fu.removeNewFile}
                moveNewFile={fu.moveNewFile}
                toggleDeleteExisting={fu.toggleDeleteExisting}
                moveExisting={fu.moveExisting}
                label="방 이미지"
              />
            </div>
            {error && <div className={styles.error}>{error}</div>}
          </div>
        )}
        <div className={styles.footer}>
          <button
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={loading}
          >
            취소
          </button>
          <button
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={loading || fetchLoading}
          >
            {loading ? '처리 중...' : isEdit ? '수정 완료' : '방 등록'}
          </button>
        </div>
      </div>
    </div>
  ,
  document.body
);
}
