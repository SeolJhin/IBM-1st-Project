import React, { useState } from 'react';
import { adminApi } from '../../api/adminApi';
import FileUploader from '../../../file/components/FileUploader';
import useFileUpload from '../../../file/hooks/useFileUpload';
import styles from './AdminCreateModal.module.css';

const INITIAL = {
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
  { value: 'east', label: '동향' },
  { value: 'west', label: '서향' },
  { value: 'south', label: '남향' },
  { value: 'north', label: '북향' },
];

const ROOM_TYPES = [
  { value: '', label: '미선택' },
  { value: 'one_room', label: '원룸형' },
  { value: 'two_room', label: '투룸형' },
  { value: 'three_room', label: '쓰리룸형' },
  { value: 'loft', label: '복층' },
  { value: 'share', label: '쉐어' },
];

export default function AdminRoomCreateModal({ onClose, onSuccess }) {
  const [form, setForm] = useState(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fu = useFileUpload({ maxCount: 10 });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!form.buildingNm.trim()) {
      setError('건물명은 필수입니다.');
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
      await adminApi.createRoom(fd);
      onSuccess?.();
      onClose();
    } catch (e) {
      setError(e?.message || '방 등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>방 등록</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>위치 정보</h3>
            <div className={styles.grid2}>
              <label className={styles.field}>
                <span className={styles.label}>
                  건물명 <span className={styles.req}>*</span>
                </span>
                <input
                  className={styles.input}
                  name="buildingNm"
                  value={form.buildingNm}
                  onChange={handleChange}
                  placeholder="예: Uniplace A"
                />
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
                  placeholder="예: 1"
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
                  placeholder="예: 1490000"
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
                  placeholder="예: 540000"
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
                  placeholder="예: 50000"
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>최소 계약 기간 (개월)</span>
                <input
                  className={styles.input}
                  type="number"
                  name="rentMin"
                  value={form.rentMin}
                  onChange={handleChange}
                  placeholder="예: 3"
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
                  placeholder="예: 2"
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
                placeholder="방에 대한 설명을 입력하세요"
              />
            </label>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>이미지 업로드</h3>
            <FileUploader
              newFiles={fu.newFiles}
              previews={fu.previews}
              deleteFileIds={fu.deleteFileIds}
              addFiles={fu.addFiles}
              removeNewFile={fu.removeNewFile}
              moveNewFile={fu.moveNewFile}
              toggleDeleteExisting={fu.toggleDeleteExisting}
              label="이미지"
              maxCount={10}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}
        </div>

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
            disabled={loading}
          >
            {loading ? '등록 중...' : '방 등록'}
          </button>
        </div>
      </div>
    </div>
  );
}
