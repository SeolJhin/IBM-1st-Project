import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supportApi } from '../api/supportApi';
import { useAuth } from '../../user/hooks/useAuth';
import styles from './Support.module.css';

const NOTICE_STATUS_OPTIONS = [
  { value: 'notice', label: '공지' },
  { value: 'event', label: '이벤트' },
  { value: 'operation', label: '운영' },
  { value: 'policy', label: '정책' },
];

function normalizeRole(user) {
  const raw =
    user?.userRole ??
    user?.role ??
    user?.userRl ??
    user?.user_role ??
    user?.authority ??
    user?.authorities?.[0];

  return String(raw ?? '').toLowerCase().replace('role_', '');
}

export default function NoticeDetail() {
  const { user } = useAuth();
  const { noticeId } = useParams();
  const navigate = useNavigate();
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    noticeTitle: '',
    noticeCtnt: '',
    noticeSt: 'notice',
    code: 'SUP_GENERAL',
    importance: 'N',
  });

  const isAdmin = normalizeRole(user) === 'admin';

  useEffect(() => {
    let cancelled = false;
    const timerId = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await supportApi.getNoticeDetail(noticeId);
        if (cancelled) return;
        setNotice(data);
        setForm({
          noticeTitle: data?.noticeTitle ?? '',
          noticeCtnt: data?.noticeCtnt ?? '',
          noticeSt: data?.noticeSt ?? 'notice',
          code: data?.code ?? 'SUP_GENERAL',
          importance: data?.importance ?? 'N',
        });
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || '공지사항을 불러오지 못했습니다.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timerId);
    };
  }, [noticeId]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!isAdmin) return;
    const title = form.noticeTitle.trim();
    const content = form.noticeCtnt.trim();
    if (!title) return alert('제목을 입력해주세요.');
    if (!content) return alert('내용을 입력해주세요.');

    setSaving(true);
    try {
      const updated = await supportApi.updateNotice(noticeId, {
        noticeTitle: title,
        noticeCtnt: content,
        noticeSt: form.noticeSt,
        code: form.code,
        importance: form.importance ?? 'N',
      });
      setNotice(updated);
      setEditing(false);
      alert('공지사항이 수정되었습니다.');
    } catch (err) {
      alert(err.message || '공지사항 수정에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isAdmin) return;
    if (!window.confirm('공지사항을 삭제하시겠습니까?')) return;

    setDeleting(true);
    try {
      await supportApi.deleteNotice(noticeId);
      alert('공지사항이 삭제되었습니다.');
      navigate('/support/notice');
    } catch (err) {
      alert(err.message || '공지사항 삭제에 실패했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>로딩중...</div>;
  if (error) return <div style={{ padding: 24, color: 'red' }}>{error}</div>;
  if (!notice) return null;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {editing ? (
          <>
            <label className={styles.formLabel}>제목</label>
            <input
              className={styles.formInput}
              value={form.noticeTitle}
              onChange={(e) => handleChange('noticeTitle', e.target.value)}
              maxLength={100}
              disabled={saving}
            />

            <label className={styles.formLabel}>유형</label>
            <select
              className={styles.formSelect}
              value={form.noticeSt}
              onChange={(e) => handleChange('noticeSt', e.target.value)}
              disabled={saving}
            >
              {NOTICE_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <label className={styles.formLabel}>분류 코드</label>
            <select
              className={styles.formSelect}
              value={form.code}
              onChange={(e) => handleChange('code', e.target.value)}
              disabled={saving}
            >
              <option value="SUP_GENERAL">일반</option>
              <option value="SUP_BILLING">요금/정산</option>
            </select>

            <label className={styles.formLabel}>내용</label>
            <textarea
              className={styles.formTextarea}
              value={form.noticeCtnt}
              onChange={(e) => handleChange('noticeCtnt', e.target.value)}
              maxLength={3000}
              disabled={saving}
            />
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              {notice.importance === 'Y' && <span className={styles.statusBadge}>중요</span>}
              <h2 className={styles.cardTitle} style={{ margin: 0 }}>
                {notice.noticeTitle}
              </h2>
            </div>

            <div className={styles.cardMeta} style={{ marginBottom: 24 }}>
              <span>조회수 {notice.readCount ?? 0}</span>
              <span style={{ margin: '0 8px' }}>|</span>
              <span>{notice.createdAt ? notice.createdAt.slice(0, 10) : '-'}</span>
            </div>

            <div style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap', color: 'var(--text)' }}>
              {notice.noticeCtnt}
            </div>
          </>
        )}

        {isAdmin && (
          <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
            {editing ? (
              <>
                <button className={styles.buttonPrimary} onClick={handleSave} disabled={saving}>
                  {saving ? '저장 중...' : '저장'}
                </button>
                <button
                  className={styles.pageBtn}
                  onClick={() => setEditing(false)}
                  disabled={saving}
                >
                  취소
                </button>
              </>
            ) : (
              <>
                <button className={styles.buttonPrimary} onClick={() => setEditing(true)}>
                  수정
                </button>
                <button className={styles.pageBtn} onClick={handleDelete} disabled={deleting}>
                  {deleting ? '삭제 중...' : '삭제'}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <button
        className={styles.pageBtn}
        onClick={() => navigate('/support/notice')}
        style={{ marginTop: 16 }}
      >
        목록으로
      </button>
    </div>
  );
}
