import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supportApi } from '../api/supportApi';
import {
  toApiImageUrl,
  toStableFileViewUrl,
} from '../../file/api/fileApi';
import styles from './Support.module.css';
import NoticeEditor from '../components/NoticeEditor';
import { useAuth } from '../../user/hooks/useAuth';

const FILTER_CHIPS = [
  { value: '', label: '전체' },
  { value: 'notice', label: '공지' },
  { value: 'event', label: '이벤트' },
  { value: 'operation', label: '운영' },
  { value: 'policy', label: '정책' },
];

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

export default function NoticeList() {
  const { user } = useAuth();
  const editorRef = useRef(null);
  const isAdmin = normalizeRole(user) === 'admin';

  // ★ URL 쿼리 파라미터 읽기 (?noticeSt=event 등)
  const [searchParams] = useSearchParams();

  // ★ URL에 noticeSt 파라미터가 있으면 초기값으로 사용
  const [activeFilter, setActiveFilter] = useState(
    () => searchParams.get('noticeSt') ?? ''
  );
  const [page, setPage] = useState(1);

  // ── 데이터 상태 ────────────────────────────────────────────
  const [notices, setNotices] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── 글쓰기 상태 ────────────────────────────────────────────
  const [showWriter, setShowWriter] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [writeForm, setWriteForm] = useState({
    noticeTitle: '',
    noticeSt: 'notice',
    code: 'SUP_GENERAL',
    importance: 'N',
  });

  // ── API 호출: activeFilter · page 바뀌면 재실행 ───────────
  useEffect(() => {
    let cancelled = false;

    const fetch = async () => {
      setLoading(true);
      setError(null);

      const params = { page, size: 10 };
      if (activeFilter) params.noticeSt = activeFilter;

      console.log('[NoticeList] API 호출:', params);

      try {
        const data = await supportApi.getNotices(params);
        console.log('[NoticeList] 응답:', data);
        if (cancelled) return;
        setNotices(data?.content ?? []);
        setTotalPages(data?.totalPages ?? 0);
      } catch (err) {
        if (cancelled) return;
        setError(err?.message || '공지사항을 불러오지 못했습니다.');
        setNotices([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetch();
    return () => {
      cancelled = true;
    };
  }, [activeFilter, page]);

  // ── 필터 클릭 ──────────────────────────────────────────────
  const handleFilterChange = (value) => {
    setActiveFilter(value);
    setPage(1);
  };

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
      const pendingFiles = editorRef.current?.getPendingFiles() ?? [];
      let finalHtml = html;

      if (pendingFiles.length > 0) {
        // 1. 공지 먼저 생성해서 noticeId 확보 (blob URL 포함 상태)
        const created = await supportApi.createNotice({
          ...writeForm,
          noticeCtnt: html,
        });

        // 2. 이미지 업로드
        const uploadResult = await supportApi.uploadFiles(
          'NOTICE',
          created.noticeId,
          pendingFiles
        );
        const uploaded = uploadResult?.files ?? [];

        // 3. blob URL → 서버 URL 교체
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        doc.querySelectorAll('img[data-pending]').forEach((img, i) => {
          const f = uploaded[i];
          if (f) {
            // viewUrl: S3모드 → https://...amazonaws.com/...
            //          로컬모드 → /files/{id}/view (toApiImageUrl이 /api 붙여줌)
            img.src = toStableFileViewUrl(f) || toApiImageUrl(f.viewUrl || '');
            img.removeAttribute('data-pending');
          }
        });
        finalHtml = doc.body.innerHTML;

        // 4. 교체된 HTML로 업데이트
        await supportApi.updateNotice(created.noticeId, {
          ...writeForm,
          noticeCtnt: finalHtml,
        });
      } else {
        // 이미지 없으면 바로 생성
        await supportApi.createNotice({
          ...writeForm,
          noticeCtnt: finalHtml,
        });
      }

      resetEditor();
      setShowWriter(false);
      setPage(1);
      setActiveFilter('');
      alert('공지사항이 등록되었습니다.');
    } catch (e) {
      alert(e.message || '등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.pageHead}>
        <h2 className={styles.pageTitle}>공지사항</h2>
      </div>

      {/* ── 필터 칩 + 글쓰기 버튼 (같은 줄) ────────────── */}
      <div className={styles.filterBarRow}>
        <div className={styles.filterChipRow}>
          {FILTER_CHIPS.map((chip) => (
            <button
              key={chip.value || 'all'}
              type="button"
              className={`${styles.filterChip} ${
                activeFilter === chip.value ? styles.filterChipActive : ''
              }`}
              onClick={() => handleFilterChange(chip.value)}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {isAdmin && (
          <button
            className={styles.buttonPrimary}
            onClick={() => {
              setShowWriter((p) => !p);
              if (showWriter) resetEditor();
            }}
          >
            {showWriter ? '닫기' : '+ 공지 글쓰기'}
          </button>
        )}
      </div>

      {/* ── 관리자 글쓰기 폼 ─────────────────────────────── */}
      {isAdmin && (
        <>
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
                {/* ★ 중요 공지 토글 */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    paddingBottom: 2,
                  }}
                >
                  <label className={styles.formLabel}>중요 공지</label>
                  <label className={styles.importanceToggle}>
                    <input
                      type="checkbox"
                      checked={writeForm.importance === 'Y'}
                      onChange={(e) =>
                        setWriteForm((p) => ({
                          ...p,
                          importance: e.target.checked ? 'Y' : 'N',
                        }))
                      }
                      disabled={submitting}
                    />
                    <span className={styles.importanceSlider} />
                  </label>
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

      {/* ── 로딩 / 에러 ──────────────────────────────────── */}
      {loading && <div style={{ padding: 24 }}>로딩중...</div>}
      {!loading && error && (
        <div style={{ padding: 24, color: 'red' }}>{error}</div>
      )}

      {/* ── 목록 테이블 ──────────────────────────────────── */}
      {!loading && !error && (
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
                  <tr
                    key={n.noticeId}
                    className={n.importance === 'Y' ? styles.importantRow : ''}
                  >
                    <td style={{ textAlign: 'center', color: 'var(--muted)' }}>
                      {n.noticeId}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {st && (
                        <span
                          className={`${styles.typeBadge} ${styles[st.cls]}`}
                        >
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
      )}

      {/* ── 페이지네이션 ─────────────────────────────────── */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            이전
          </button>
          <span className={styles.pageInfo}>
            {page} / {totalPages}
          </span>
          <button
            className={styles.pageBtn}
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
