import React, { useEffect, useMemo, useState } from 'react';
import { adminApi } from '../../admin/api/adminApi';

export default function UserStatusModal({
  open,
  userId,
  currentUserId,
  onClose,
  onUpdated,
  onSaved,
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [nextStatus, setNextStatus] = useState('active');

  const isOpen = open !== undefined ? open : !!userId;
  const isSelf = !!currentUserId && currentUserId === userId;
  const isTargetAdmin = (user?.userRole || '').toLowerCase() === 'admin';

  const statusOptions = useMemo(
    () => [
      { value: 'active', label: 'ACTIVE', color: '#16a34a' },
      { value: 'inactive', label: 'INACTIVE', color: '#d97706' },
      { value: 'banned', label: 'BANNED', color: '#b00020' },
    ],
    []
  );

  useEffect(() => {
    if (!isOpen || !userId || isSelf) return;
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const data = await adminApi.getUserDetail(userId);
        if (!alive) return;
        setUser(data);
        setNextStatus((data?.userSt || 'active').toString().toLowerCase());
      } catch (e) {
        if (!alive) return;
        setError(e?.message || '유저 정보를 불러오지 못했습니다.');
        setUser(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [isOpen, userId, isSelf]);

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    setError('');
    try {
      if (!isTargetAdmin) {
        await adminApi.updateUserStatus(userId, nextStatus);
      }
      onUpdated?.(nextStatus);
      onSaved?.(nextStatus);
      onClose?.();
    } catch (e) {
      setError(e?.message || '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || isSelf) return null;

  const statusColor =
    statusOptions.find((o) => o.value === nextStatus)?.color ?? '#16a34a';

  const fmt = (val) => {
    if (!val) return '-';
    try {
      return new Date(val).toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return String(val);
    }
  };

  return (
    <div style={ms.overlay} onMouseDown={onClose} role="presentation">
      <div
        style={ms.modal}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* 헤더 */}
        <div style={ms.header}>
          <span style={ms.title}>👤 회원 정보 관리</span>
          <button type="button" onClick={onClose} style={ms.closeBtn}>
            ✕
          </button>
        </div>

        {/* 바디 */}
        <div style={ms.body}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 32, color: '#888' }}>
              불러오는 중...
            </div>
          ) : error ? (
            <div style={ms.errorMsg}>{error}</div>
          ) : (
            <>
              {/* ── 기본 정보 ── */}
              <div style={ms.sectionLabel}>기본 정보</div>
              <InfoRow label="닉네임" value={user?.userNm || '-'} />
              <InfoRow
                label="권한"
                value={<RoleBadge role={user?.userRole} />}
              />
              <InfoRow
                label="상태"
                value={<StatusBadge status={user?.userSt} />}
              />
              <InfoRow label="계정 생성일" value={fmt(user?.createdAt)} />
              <InfoRow label="마지막 로그인" value={fmt(user?.lastLoginAt)} />

              <div style={ms.divider} />

              {/* ── 상태 변경 ── */}
              <div style={ms.sectionLabel}>상태 변경</div>
              {isTargetAdmin ? (
                <div style={ms.infoBox}>
                  ℹ️ 관리자 계정의 상태는 변경할 수 없습니다.
                </div>
              ) : (
                <>
                  <div style={ms.ctrlRow}>
                    <span style={ms.ctrlLabel}>상태</span>
                    <select
                      value={nextStatus}
                      onChange={(e) => setNextStatus(e.target.value)}
                      style={{
                        ...ms.select,
                        borderColor: statusColor,
                        color: statusColor,
                      }}
                      disabled={saving}
                    >
                      {statusOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {nextStatus === 'banned' && (
                    <div style={ms.warnBox}>
                      ⚠️ <strong>BANNED</strong> 유저는 커뮤니티 글/댓글 작성이
                      차단됩니다.
                    </div>
                  )}
                </>
              )}

              {error && (
                <div style={{ ...ms.errorMsg, marginTop: 10 }}>{error}</div>
              )}
            </>
          )}
        </div>

        {/* 푸터 */}
        <div style={ms.footer}>
          <button
            type="button"
            onClick={onClose}
            style={ms.secBtn}
            disabled={saving}
          >
            닫기
          </button>
          {!loading && !error && (
            <button
              type="button"
              onClick={handleSave}
              style={{ ...ms.priBtn, opacity: saving ? 0.7 : 1 }}
              disabled={saving}
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '110px 1fr',
        gap: 8,
        padding: '7px 0',
        borderBottom: '1px solid #f3f4f6',
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 600, color: '#6b7280' }}>
        {label}
      </span>
      <span style={{ fontSize: 14, color: '#111', wordBreak: 'break-all' }}>
        {value}
      </span>
    </div>
  );
}

function StatusBadge({ status }) {
  const s = (status || 'active').toString().toLowerCase();
  const cfg = {
    active: { l: 'ACTIVE', bg: '#dcfce7', c: '#16a34a' },
    inactive: { l: 'INACTIVE', bg: '#fef9c3', c: '#a16207' },
    banned: { l: 'BANNED', bg: '#fee2e2', c: '#b91c1c' },
  };
  const { l, bg, c } = cfg[s] || cfg.active;
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 700,
        background: bg,
        color: c,
      }}
    >
      {l}
    </span>
  );
}

function RoleBadge({ role }) {
  const r = (role || 'user').toString().toLowerCase();
  const cfg = {
    admin: { l: 'ADMIN', bg: '#ede9fe', c: '#6d28d9' },
    tenant: { l: 'TENANT', bg: '#dbeafe', c: '#1d4ed8' },
    user: { l: 'USER', bg: '#f3f4f6', c: '#374151' },
  };
  const { l, bg, c } = cfg[r] || cfg.user;
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 700,
        background: bg,
        color: c,
      }}
    >
      {l}
    </span>
  );
}

const ms = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: 16,
  },
  modal: {
    width: 'min(460px,100%)',
    background: '#fff',
    borderRadius: 16,
    boxShadow: '0 20px 50px rgba(0,0,0,0.22)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '15px 20px',
    borderBottom: '1px solid #e5e7eb',
    background: '#f9fafb',
  },
  title: { fontSize: 16, fontWeight: 700, color: '#111' },
  closeBtn: {
    border: 'none',
    background: 'transparent',
    fontSize: 18,
    cursor: 'pointer',
    padding: '4px 6px',
    color: '#9ca3af',
    lineHeight: 1,
  },
  body: { padding: '16px 20px', maxHeight: '70vh', overflowY: 'auto' },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 4,
  },
  divider: { borderTop: '1px dashed #e5e7eb', margin: '14px 0' },
  ctrlRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0' },
  ctrlLabel: { fontSize: 13, fontWeight: 600, color: '#6b7280', minWidth: 36 },
  select: {
    padding: '7px 12px',
    borderRadius: 8,
    border: '1.5px solid',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: 13,
    minWidth: 150,
  },
  warnBox: {
    marginTop: 8,
    padding: '9px 13px',
    background: '#fff5f5',
    border: '1px solid #fca5a5',
    borderRadius: 8,
    fontSize: 12,
    color: '#b00020',
  },
  infoBox: {
    padding: '9px 13px',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    fontSize: 13,
    color: '#64748b',
  },
  errorMsg: { color: '#b00020', fontSize: 13 },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    padding: '13px 20px',
    borderTop: '1px solid #e5e7eb',
    background: '#fafafa',
  },
  priBtn: {
    padding: '9px 20px',
    borderRadius: 10,
    border: 'none',
    background: '#111',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 14,
  },
  secBtn: {
    padding: '9px 16px',
    borderRadius: 10,
    border: '1px solid #d1d5db',
    background: '#fff',
    cursor: 'pointer',
    color: '#374151',
    fontSize: 14,
  },
};
