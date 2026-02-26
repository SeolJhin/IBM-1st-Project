import React, { useMemo, useState } from 'react';
import styles from './AdminUserList.module.css';

function UserDetailModal({ user, onClose, onDelete, onSave }) {
  const [form, setForm] = useState(() => ({
    userNm: user.userNm ?? '',
    userTel: user.userTel ?? '',
    userEmail: user.userEmail ?? '',
    userSt: user.userSt ?? 'active',
  }));

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  return (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalTitle}>회원 정보</div>

        <div className={styles.formGrid}>
          <div className={styles.formRow}>
            <div className={styles.label}>이름</div>
            <input
              className={styles.input}
              name="userNm"
              value={form.userNm}
              onChange={onChange}
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.label}>전화번호</div>
            <input
              className={styles.input}
              name="userTel"
              value={form.userTel}
              onChange={onChange}
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.label}>이메일</div>
            <input
              className={styles.input}
              name="userEmail"
              value={form.userEmail}
              onChange={onChange}
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.label}>상태</div>
            <select
              className={styles.select}
              name="userSt"
              value={form.userSt}
              onChange={onChange}
            >
              <option value="active">활성</option>
              <option value="inactive">비활성</option>
              <option value="suspended">정지</option>
            </select>
          </div>
        </div>

        <div className={styles.modalActions}>
          <button type="button" className={styles.btnGhost} onClick={onDelete}>
            삭제
          </button>
          <div className={styles.spacer} />
          <button type="button" className={styles.btnGhost} onClick={onClose}>
            닫기
          </button>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => onSave(form)}
          >
            수정 확인
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUserList() {
  // ✅ UI 먼저: mock
  const rows = useMemo(
    () => [
      {
        id: 1,
        userNm: '홍길동',
        buildingRoom: 'A동/101호',
        userTel: '010-0000-0000',
        moveInAt: '2026/01/29',
        userSt: 'active',
        residentYn: 'O',
      },
      {
        id: 2,
        userNm: '김유저',
        buildingRoom: 'B동/203호',
        userTel: '010-1111-2222',
        moveInAt: '2026/02/01',
        userSt: 'active',
        residentYn: 'X',
      },
    ],
    []
  );

  const [selected, setSelected] = useState(null);

  const onClickRow = (u) => setSelected(u);

  const onDelete = () => {
    // ✅ 여기 나중에 API 붙이면 됨
    // eslint-disable-next-line no-alert
    alert('삭제 API 연결 예정');
    setSelected(null);
  };

  const onSave = (form) => {
    // ✅ 여기 나중에 API 붙이면 됨
    // eslint-disable-next-line no-alert
    alert(`수정 API 연결 예정\n${JSON.stringify(form, null, 2)}`);
    setSelected(null);
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.table}>
        <div className={styles.thead}>
          <div>이름</div>
          <div>건물/호실</div>
          <div>전화번호</div>
          <div>입주 날짜</div>
          <div>상태</div>
          <div>거주</div>
          <div className={styles.center}>관리</div>
        </div>

        {rows.map((r) => (
          <button
            key={r.id}
            type="button"
            className={styles.trow}
            onClick={() => onClickRow(r)}
          >
            <div className={styles.cellStrong}>{r.userNm}</div>
            <div>{r.buildingRoom}</div>
            <div>{r.userTel}</div>
            <div>{r.moveInAt}</div>
            <div>{r.userSt === 'active' ? '활성' : r.userSt}</div>
            <div>{r.residentYn}</div>
            <div className={styles.center}>수정/삭제</div>
          </button>
        ))}
      </div>

      {selected ? (
        <UserDetailModal
          user={selected}
          onClose={() => setSelected(null)}
          onDelete={onDelete}
          onSave={onSave}
        />
      ) : null}
    </div>
  );
}
