import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotices } from '../hooks/useNotices';
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

export default function NoticeList() {
  const { user } = useAuth();
  const { notices, pagination, loading, error, goToPage, refetch } = useNotices();
  const [showWriter, setShowWriter] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [writeForm, setWriteForm] = useState({
    noticeTitle: '',
    noticeCtnt: '',
    noticeSt: 'notice',
    code: 'SUP_GENERAL',
    importance: 'N',
  });

  const isAdmin = normalizeRole(user) === 'admin';

  const handleChange = (field, value) => {
    setWriteForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateNotice = async () => {
    const title = writeForm.noticeTitle.trim();
    const content = writeForm.noticeCtnt.trim();
    if (!title) return alert('제목을 입력해주세요.');
    if (!content) return alert('내용을 입력해주세요.');

    setSubmitting(true);
    try {
      await supportApi.createNotice({
        noticeTitle: title,
        noticeCtnt: content,
        noticeSt: writeForm.noticeSt,
        code: writeForm.code,
        importance: writeForm.importance,
      });
      setWriteForm({
        noticeTitle: '',
        noticeCtnt: '',
        noticeSt: 'notice',
        code: 'SUP_GENERAL',
        importance: 'N',
      });
      setShowWriter(false);
      await refetch();
      alert('공지사항이 등록되었습니다.');
    } catch (e) {
      alert(e.message || '공지사항 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>로딩중...</div>;
  if (error) return <div style={{ padding: 24, color: 'red' }}>{error}</div>;

  return (
    <div className={styles.container}>
      {isAdmin && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button className={styles.buttonPrimary} onClick={() => setShowWriter((v) => !v)}>
              {showWriter ? '작성 닫기' : '공지 글쓰기'}
            </button>
          </div>

          {showWriter && (
            <div className={styles.card} style={{ marginBottom: 16 }}>
              <label className={styles.formLabel}>제목</label>
              <input
                className={styles.formInput}
                value={writeForm.noticeTitle}
                onChange={(e) => handleChange('noticeTitle', e.target.value)}
                maxLength={100}
                disabled={submitting}
              />

              <label className={styles.formLabel}>유형</label>
              <select
                className={styles.formSelect}
                value={writeForm.noticeSt}
                onChange={(e) => handleChange('noticeSt', e.target.value)}
                disabled={submitting}
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
                value={writeForm.code}
                onChange={(e) => handleChange('code', e.target.value)}
                disabled={submitting}
              >
                <option value="SUP_GENERAL">일반</option>
                <option value="SUP_BILLING">요금/정산</option>
              </select>

              <label className={styles.formLabel}>내용</label>
              <textarea
                className={styles.formTextarea}
                value={writeForm.noticeCtnt}
                onChange={(e) => handleChange('noticeCtnt', e.target.value)}
                maxLength={3000}
                disabled={submitting}
              />

              <div style={{ marginTop: 12 }}>
                <button
                  className={styles.buttonPrimary}
                  onClick={handleCreateNotice}
                  disabled={submitting}
                >
                  {submitting ? '등록 중...' : '등록'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <table className={styles.table}>
        <thead>
          <tr>
            <th style={{ width: 60 }}>번호</th>
            <th>제목</th>
            <th style={{ width: 100 }}>조회수</th>
            <th style={{ width: 120 }}>날짜</th>
          </tr>
        </thead>
        <tbody>
          {notices.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>
                등록된 공지사항이 없습니다.
              </td>
            </tr>
          ) : (
            notices.map((notice) => (
              <tr key={notice.noticeId}>
                <td style={{ textAlign: 'center', color: 'var(--muted)' }}>{notice.noticeId}</td>
                <td>
                  {notice.importance === 'Y' && (
                    <span className={styles.statusBadge} style={{ marginRight: 8 }}>
                      중요
                    </span>
                  )}
                  <Link to={`/support/notice/${notice.noticeId}`} className={styles.tableLink}>
                    {notice.noticeTitle}
                  </Link>
                </td>
                <td style={{ textAlign: 'center', color: 'var(--muted)' }}>{notice.readCount ?? 0}</td>
                <td style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                  {notice.createdAt ? notice.createdAt.slice(0, 10) : '-'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {pagination.totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            disabled={pagination.isFirst}
            onClick={() => goToPage(pagination.page - 1)}
          >
            이전
          </button>
          <span className={styles.pageInfo}>
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            className={styles.pageBtn}
            disabled={pagination.isLast}
            onClick={() => goToPage(pagination.page + 1)}
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
