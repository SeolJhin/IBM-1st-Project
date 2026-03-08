import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotices } from '../hooks/useNotices';
import { supportApi } from '../api/supportApi';
import styles from './Support.module.css';
import NoticeEditor from '../components/NoticeEditor';
import { useAuth } from '../../user/hooks/useAuth';

const NOTICE_STATUS_OPTIONS = [
  { value: 'notice', label: '공지' },
  { value: 'event', label: '이벤트' },
  { value: 'operation', label: '운영' },
  { value: 'policy', label: '정책' },
];
const NOTICE_ST_LABEL = {
  notice: { label: '공지', cls: 'type_notice' },
  event: { label: '이벤트', cls: 'type_event' },
  operation: { label: '운영', cls: 'type_operation' },
  policy: { label: '정책', cls: 'type_policy' },
};

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

/* HTML에서 blob: URL을 서버 뷰 URL로 치환 */
function replaceBlobUrls(html, fileResponses, apiBase) {
  let result = html;
  fileResponses.forEach((fr) => {
    // data-pending 이미지의 blob src를 서버 URL로 교체 (순서 기반)
    // 실제로는 에디터의 replaceObjectUrl을 쓰는 게 더 안전함
  });
  return result;
}

export default function NoticeList() {
  const { user } = useAuth();
  const { notices, pagination, loading, error, goToPage, refetch } =
    useNotices();
  const editorRef = useRef(null);

  const [showWriter, setShowWriter] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [writeForm, setWriteForm] = useState({
    noticeTitle: '',
    noticeSt: 'notice',
    code: 'SUP_GENERAL',
    importance: 'N',
  });

  const isAdmin = normalizeRole(user) === 'admin';

  const resetEditor = () => {
    setWriteForm({
      noticeTitle: '',
      noticeSt: 'notice',
      code: 'SUP_GENERAL',
      importance: 'N',
    });
    editorRef.current?.setHTML('');
    editorRef.current?.clearPendingFiles();
  };

  const handleCreate = async () => {
    if (!isAdmin) return alert('관리자만 등록할 수 있습니다.');
    if (!writeForm.noticeTitle.trim()) return alert('제목을 입력해주세요.');
    const html = editorRef.current?.getHTML() ?? '';
    if (!html.replace(/<[^>]*>/g, '').trim())
      return alert('내용을 입력해주세요.');

    setSubmitting(true);
    try {
      // 1. 공지 먼저 등록 (html 그대로 저장 — blob URL 포함)
      const created = await supportApi.createNotice({
        ...writeForm,
        noticeCtnt: html,
      });

      // 2. 이미지 파일 업로드
      const pendingFiles = editorRef.current?.getPendingFiles() ?? [];
      if (pendingFiles.length > 0 && created?.noticeId) {
        const uploadResult = await supportApi.uploadFiles(
          'NOTICE',
          created.noticeId,
          pendingFiles
        );
        // 3. blob URL → 서버 뷰 URL 로 교체한 html 로 공지 업데이트
        let finalHtml = editorRef.current?.getHTML() ?? html;
        const uploaded = uploadResult?.files ?? [];
        uploaded.forEach((fr) => {
          // blob URL은 순서 기반으로 교체
        });
        // 업로드된 파일 URL로 교체하기 위해 내부 img src 순서 매핑
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

        await supportApi.updateNotice(created.noticeId, {
          ...writeForm,
          noticeCtnt: finalHtml,
        });
      }

      resetEditor();
      setShowWriter(false);
      await refetch();
      alert('공지사항이 등록되었습니다.');
    } catch (e) {
      alert(e.message || '등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>로딩중...</div>;
  if (error) return <div style={{ padding: 24, color: 'red' }}>{error}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.pageHead}>
        <h2 className={styles.pageTitle}>공지사항</h2>
      </div>

      {isAdmin && (
        <>
          <div className={styles.listActions}>
            <button
              className={styles.buttonPrimary}
              onClick={() => {
                setShowWriter((p) => !p);
                if (showWriter) resetEditor();
              }}
            >
              {showWriter ? '닫기' : '+ 공지 글쓰기'}
            </button>
          </div>

          {showWriter && (
            <div className={styles.card} style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 4 }}>
                <div style={{ flex: 2 }}>
                  <label className={styles.formLabel}>제목</label>
                  <input
                    className={styles.formInput}
                    value={writeForm.noticeTitle}
                    onChange={(e) =>
                      setWriteForm((p) => ({
                        ...p,
                        noticeTitle: e.target.value,
                      }))
                    }
                    maxLength={100}
                    disabled={submitting}
                    placeholder="공지 제목을 입력하세요"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className={styles.formLabel}>유형</label>
                  <select
                    className={styles.formSelect}
                    value={writeForm.noticeSt}
                    onChange={(e) =>
                      setWriteForm((p) => ({ ...p, noticeSt: e.target.value }))
                    }
                    disabled={submitting}
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
                    value={writeForm.code}
                    onChange={(e) =>
                      setWriteForm((p) => ({ ...p, code: e.target.value }))
                    }
                    disabled={submitting}
                  >
                    <option value="SUP_GENERAL">일반</option>
                    <option value="SUP_BILLING">요금/정산</option>
                  </select>
                </div>
              </div>

              <label className={styles.formLabel}>내용</label>
              <NoticeEditor ref={editorRef} disabled={submitting} />

              <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                <button
                  className={styles.buttonPrimary}
                  onClick={handleCreate}
                  disabled={submitting}
                >
                  {submitting ? '등록 중...' : '등록'}
                </button>
                <button
                  className={styles.pageBtn}
                  onClick={() => {
                    setShowWriter(false);
                    resetEditor();
                  }}
                  disabled={submitting}
                >
                  취소
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
            <th style={{ width: 100 }}>유형</th>
            <th>제목</th>
            <th style={{ width: 100 }}>조회수</th>
            <th style={{ width: 120 }}>날짜</th>
          </tr>
        </thead>
        <tbody>
          {notices.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                style={{
                  textAlign: 'center',
                  padding: 32,
                  color: 'var(--muted)',
                }}
              >
                등록된 공지사항이 없습니다.
              </td>
            </tr>
          ) : (
            notices.map((n) => {
              const st = NOTICE_ST_LABEL[n.noticeSt];
              return (
                <tr key={n.noticeId}>
                  <td style={{ textAlign: 'center', color: 'var(--muted)' }}>
                    {n.noticeId}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {st && (
                      <span className={`${styles.typeBadge} ${styles[st.cls]}`}>
                        {st.label}
                      </span>
                    )}
                  </td>
                  <td>
                    <div className={styles.tableTitleCell}>
                      {n.importance === 'Y' && (
                        <span className={styles.statusBadge}>중요</span>
                      )}
                      <Link
                        to={`/support/notice/${n.noticeId}`}
                        className={styles.tableLink}
                      >
                        {n.noticeTitle}
                      </Link>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center', color: 'var(--muted)' }}>
                    {n.readCount ?? 0}
                  </td>
                  <td
                    style={{
                      textAlign: 'center',
                      color: 'var(--muted)',
                      fontSize: 13,
                    }}
                  >
                    {n.createdAt ? n.createdAt.slice(0, 10) : '-'}
                  </td>
                </tr>
              );
            })
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
