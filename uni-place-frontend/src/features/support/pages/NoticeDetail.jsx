import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supportApi } from '../api/supportApi';
import { useAuth } from '../../user/hooks/useAuth';
import styles from './Support.module.css';
import editorStyles from './NoticeEditor.module.css';
import NoticeEditor from '../components/NoticeEditor';

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
  return String(raw ?? '')
    .toLowerCase()
    .replace('role_', '');
}

export default function NoticeDetail() {
  const { user } = useAuth();
  const { noticeId } = useParams();
  const navigate = useNavigate();
  const editorRef = useRef(null);

  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    noticeTitle: '',
    noticeSt: 'notice',
    code: 'SUP_GENERAL',
    importance: 'N',
  });

  const isAdmin = normalizeRole(user) === 'admin';

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await supportApi.getNoticeDetail(noticeId);
      setNotice(data);
      setForm({
        noticeTitle: data?.noticeTitle ?? '',
        noticeSt: data?.noticeSt ?? 'notice',
        code: data?.code ?? 'SUP_GENERAL',
        importance: data?.importance ?? 'N',
      });
      setError(null);
    } catch (err) {
      setError(err.message || '공지사항을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [noticeId]); // eslint-disable-line

  // 수정 모드 진입 시 에디터에 기존 HTML 세팅
  useEffect(() => {
    if (editing && editorRef.current && notice) {
      // 짧은 딜레이로 DOM 마운트 보장
      setTimeout(() => {
        editorRef.current?.setHTML(notice.noticeCtnt ?? '');
        editorRef.current?.clearPendingFiles();
      }, 0);
    }
  }, [editing]); // eslint-disable-line

  const startEdit = () => setEditing(true);

  const cancelEdit = () => {
    editorRef.current?.clearPendingFiles();
    setEditing(false);
  };

  const handleSave = async () => {
    if (!isAdmin) return;
    if (!form.noticeTitle.trim()) return alert('제목을 입력해주세요.');
    const html = editorRef.current?.getHTML() ?? '';
    if (!html.replace(/<[^>]*>/g, '').trim())
      return alert('내용을 입력해주세요.');

    setSaving(true);
    try {
      const pendingFiles = editorRef.current?.getPendingFiles() ?? [];
      let finalHtml = html;

      if (pendingFiles.length > 0) {
        // 1. 이미지 업로드
        const uploadResult = await supportApi.uploadFiles(
          'NOTICE',
          Number(noticeId),
          pendingFiles
        );
        const uploaded = uploadResult?.files ?? [];

        // 2. blob URL → 서버 URL 교체
        const parser = new DOMParser();
        const doc = parser.parseFromString(finalHtml, 'text/html');
        const pendingImgs = doc.querySelectorAll('img[data-pending]');
        pendingImgs.forEach((img, i) => {
          if (uploaded[i]) {
            img.src = supportApi.getFileViewUrl(uploaded[i].fileId);
            img.removeAttribute('data-pending');
          }
        });
        finalHtml = doc.body.innerHTML;
      }

      const updated = await supportApi.updateNotice(noticeId, {
        noticeTitle: form.noticeTitle,
        noticeCtnt: finalHtml,
        noticeSt: form.noticeSt,
        code: form.code,
        importance: form.importance ?? 'N',
      });

      setNotice(updated);
      editorRef.current?.clearPendingFiles();
      setEditing(false);
      alert('공지사항이 수정되었습니다.');
    } catch (err) {
      alert(err.message || '공지사항 수정에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isAdmin || !window.confirm('공지사항을 삭제하시겠습니까?')) return;
    setDeleting(true);
    try {
      await supportApi.deleteNotice(noticeId);
      navigate('/support/notice');
    } catch (err) {
      alert(err.message || '삭제에 실패했습니다.');
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
            <div style={{ display: 'flex', gap: 12, marginBottom: 4 }}>
              <div style={{ flex: 2 }}>
                <label className={styles.formLabel}>제목</label>
                <input
                  className={styles.formInput}
                  value={form.noticeTitle}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, noticeTitle: e.target.value }))
                  }
                  maxLength={100}
                  disabled={saving}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className={styles.formLabel}>유형</label>
                <select
                  className={styles.formSelect}
                  value={form.noticeSt}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, noticeSt: e.target.value }))
                  }
                  disabled={saving}
                >
                  {NOTICE_STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label className={styles.formLabel}>분류</label>
                <select
                  className={styles.formSelect}
                  value={form.code}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, code: e.target.value }))
                  }
                  disabled={saving}
                >
                  <option value="SUP_GENERAL">일반</option>
                  <option value="SUP_BILLING">요금/정산</option>
                </select>
              </div>
            </div>

            <label className={styles.formLabel}>내용</label>
            <NoticeEditor ref={editorRef} disabled={saving} />

            <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
              <button
                className={styles.buttonPrimary}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? '저장 중...' : '저장'}
              </button>
              <button
                className={styles.pageBtn}
                onClick={cancelEdit}
                disabled={saving}
              >
                취소
              </button>
            </div>
          </>
        ) : (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 8,
              }}
            >
              {notice.importance === 'Y' && (
                <span className={styles.statusBadge}>중요</span>
              )}
              <h2 className={styles.cardTitle} style={{ margin: 0 }}>
                {notice.noticeTitle}
              </h2>
            </div>
            <div className={styles.cardMeta} style={{ marginBottom: 28 }}>
              <span>조회수 {notice.readCount ?? 0}</span>
              <span style={{ margin: '0 8px' }}>|</span>
              <span>
                {notice.createdAt ? notice.createdAt.slice(0, 10) : '-'}
              </span>
            </div>

            {/* 읽기 모드: HTML 그대로 렌더링 */}
            <div
              className={editorStyles.viewer}
              dangerouslySetInnerHTML={{ __html: notice.noticeCtnt ?? '' }}
            />

            {isAdmin && (
              <div style={{ marginTop: 24, display: 'flex', gap: 8 }}>
                <button className={styles.buttonPrimary} onClick={startEdit}>
                  수정
                </button>
                <button
                  className={styles.pageBtn}
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? '삭제 중...' : '삭제'}
                </button>
              </div>
            )}
          </>
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
