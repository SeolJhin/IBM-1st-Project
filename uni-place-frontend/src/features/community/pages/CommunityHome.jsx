import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../../../app/layouts/components/Header';
import Footer from '../../../app/layouts/components/Footer';
import { communityApi } from '../api/communityApi';
import { adminApi } from '../../admin/api/adminApi';
import { useAuth } from '../../user/hooks/useAuth';
import UserStatusModal from '../../user/components/UserStatusModal';
import styles from './CommunityHome.module.css';
import { reviewApi } from '../../review/api/reviewApi';
import ReviewModal from '../../review/components/ReviewModal';

function normalizeTab(value) {
  const k = String(value ?? '').toUpperCase();
  if (k === 'FREE') return 'FREE';
  if (k === 'QUESTION') return 'QUESTION';
  if (k === 'REVIEW') return 'REVIEW';
  return 'ALL';
}

const TABS = [
  { key: 'ALL', label: '전체' },
  { key: 'FREE', label: '자유' },
  { key: 'QUESTION', label: '질문' },
  { key: 'REVIEW', label: '후기' },
];

function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('ko-KR');
}

function typeLabel(value) {
  const k = String(value ?? '').toUpperCase();
  if (k === 'FREE' || k === 'BOARD_FREE') return '자유';
  if (k === 'QUESTION' || k === 'BOARD_QUESTION') return '질문';
  if (k === 'REVIEW' || k === 'BOARD_REVIEW') return '후기';
  if (k === 'NOTICE' || k === 'BOARD_NOTICE') return '공지';
  return '일반';
}

function typeKey(value) {
  const k = String(value ?? '').toUpperCase();
  if (k === 'FREE' || k === 'BOARD_FREE') return 'free';
  if (k === 'QUESTION' || k === 'BOARD_QUESTION') return 'question';
  if (k === 'REVIEW' || k === 'BOARD_REVIEW') return 'review';
  if (k === 'NOTICE' || k === 'BOARD_NOTICE') return 'notice';
  return 'default';
}

// ── 리치텍스트 에디터 ───────────────────────────────────────────
function RichEditor({ onChange, disabled }) {
  const ref = useRef(null);
  const FONT_SIZES = [
    '12px',
    '14px',
    '16px',
    '18px',
    '20px',
    '24px',
    '28px',
    '32px',
  ];
  const COLORS = [
    '#111827',
    '#ef4444',
    '#f97316',
    '#eab308',
    '#22c55e',
    '#3b82f6',
    '#8b5cf6',
    '#ec4899',
    '#64748b',
  ];

  const exec = (cmd, val) => {
    ref.current?.focus();
    document.execCommand(cmd, false, val ?? null);
  };

  const applySize = (e) => {
    const size = e.target.value;
    exec('fontSize', '7');
    ref.current?.querySelectorAll('font[size="7"]').forEach((s) => {
      s.removeAttribute('size');
      s.style.fontSize = size;
    });
    onChange(ref.current?.innerHTML ?? '');
  };

  const applyColor = (c) => {
    exec('foreColor', c);
    onChange(ref.current?.innerHTML ?? '');
  };

  return (
    <div className={styles.richEditor}>
      <div className={styles.toolbar}>
        <button
          type="button"
          className={styles.toolBtn}
          onMouseDown={(e) => {
            e.preventDefault();
            exec('bold');
          }}
        >
          <b>B</b>
        </button>
        <button
          type="button"
          className={styles.toolBtn}
          onMouseDown={(e) => {
            e.preventDefault();
            exec('italic');
          }}
        >
          <i>I</i>
        </button>
        <button
          type="button"
          className={styles.toolBtn}
          onMouseDown={(e) => {
            e.preventDefault();
            exec('underline');
          }}
        >
          <u>U</u>
        </button>
        <span className={styles.toolDivider} />
        <select
          className={styles.toolSelect}
          defaultValue="16px"
          onChange={applySize}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {FONT_SIZES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <div className={styles.colorPicker}>
          <div className={styles.colorSwatchWrap} title="글자색">
            <span>A</span>
            <div className={styles.colorDropdown}>
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={styles.colorBtn}
                  style={{ background: c }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applyColor(c);
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        <span className={styles.toolDivider} />
        <button
          type="button"
          className={styles.toolBtn}
          onMouseDown={(e) => {
            e.preventDefault();
            exec('justifyLeft');
          }}
        >
          ≡
        </button>
        <button
          type="button"
          className={styles.toolBtn}
          onMouseDown={(e) => {
            e.preventDefault();
            exec('justifyCenter');
          }}
        >
          ☰
        </button>
        <button
          type="button"
          className={styles.toolBtn}
          onMouseDown={(e) => {
            e.preventDefault();
            exec('justifyRight');
          }}
        >
          ≡
        </button>
      </div>
      <div
        ref={ref}
        className={styles.editorArea}
        contentEditable={!disabled}
        onInput={() => onChange(ref.current?.innerHTML ?? '')}
        suppressContentEditableWarning
        data-placeholder="내용을 입력하세요"
      />
    </div>
  );
}

// ── 이미지 삽입 버튼 ────────────────────────────────────────────
function InlineImageBtn({ onInsert, disabled }) {
  const inputRef = useRef(null);
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onInsert(ev.target.result, file);
    reader.readAsDataURL(file);
    e.target.value = '';
  };
  return (
    <>
      <button
        type="button"
        className={styles.imgInsertBtn}
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
      >
        🖼 이미지 삽입
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFile}
      />
    </>
  );
}

// ── 메인 컴포넌트 ───────────────────────────────────────────────
export default function CommunityHome() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState(() =>
    normalizeTab(searchParams.get('tab'))
  );
  const [reviewModal, setReviewModal] = useState(null); // { mode, reviewId? }
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [showWriter, setShowWriter] = useState(false);
  const [writeTitle, setWriteTitle] = useState('');
  const [writeContent, setWriteContent] = useState('');
  const [pendingImages, setPendingImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [anonymous, setAnonymous] = useState(false);

  const editorContainerRef = useRef(null);

  // 로그인 여부 & 역할 확인
  const isLoggedIn = !!user;
  const userRole = String(user?.userRole ?? '').toLowerCase();
  const isAdmin = userRole === 'admin';
  const isTenant = userRole === 'tenant';
  const isBanned = String(user?.userSt ?? '').toLowerCase() === 'banned';

  const [userStatusModalId, setUserStatusModalId] = useState(null);

  // 검색 상태
  const [searchType, setSearchType] = useState('title'); // 'title' | 'userId'
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeSearch, setActiveSearch] = useState({ type: '', keyword: '' });

  useEffect(() => {
    const nextTab = normalizeTab(searchParams.get('tab'));
    setActiveTab((prev) => (prev === nextTab ? prev : nextTab));
  }, [searchParams]);

  // 글 작성시 실제 코드값 (ALL탭은 자유로 기본)
  const effectiveCode = (() => {
    if (activeTab === 'FREE') return 'FREE';
    if (activeTab === 'QUESTION') return 'QUESTION';
    if (activeTab === 'NOTICE') return 'NOTICE';
    return 'FREE';
  })();

  // 탭별 글쓰기 권한:
  // - 자유(FREE) / ALL탭: 로그인한 모든 사용자 (user, tenant, admin)
  // - 질문(QUESTION): tenant, admin만
  // - 후기(REVIEW): 글쓰기 버튼 없음 (별도 리뷰 작성 페이지)
  // - 공지(NOTICE): admin만
  const canOpenWriter = (() => {
    if (!isLoggedIn) return false;
    if (activeTab === 'REVIEW') return false;
    if (activeTab === 'NOTICE') return isAdmin;
    if (activeTab === 'QUESTION') return isAdmin || isTenant;
    // FREE, ALL
    return true;
  })();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let data;
      // 후기탭: reviews 테이블 전체 조회
      if (activeTab === 'REVIEW') {
        data = await reviewApi.getAll({ page: page - 1, size: 10 });
        const content = Array.isArray(data?.content) ? data.content : [];
        setItems(content);
        setTotalPages(Math.max(1, Number(data?.totalPages ?? 1)));
        return;
      }
      if (activeSearch.keyword && activeSearch.keyword.trim()) {
        data = await communityApi.searchBoards({
          page,
          size: 10,
          boardType: activeTab,
          searchType: activeSearch.type || 'title',
          keyword: activeSearch.keyword.trim(),
          auth: isAdmin,
        });
      } else {
        data = await communityApi.getBoards({
          page,
          size: 10,
          boardType: activeTab,
          auth: isAdmin,
        });
      }
      const content = Array.isArray(data?.content)
        ? data.content
        : Array.isArray(data)
          ? data
          : [];

      // 공지(importance=Y)는 상단 고정, 나머지는 최신순(boardId desc)
      const sorted = [...content].sort((a, b) => {
        const aNotice = a?.importance === 'Y' ? 0 : 1;
        const bNotice = b?.importance === 'Y' ? 0 : 1;
        if (aNotice !== bNotice) return aNotice - bNotice;
        return (b?.boardId ?? 0) - (a?.boardId ?? 0);
      });

      setItems(sorted);
      setTotalPages(Math.max(1, Number(data?.totalPages ?? 1)));
    } catch (e) {
      setItems([]);
      setTotalPages(1);
      setError(e?.message || '게시글을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, isAdmin, activeSearch]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    setPage(1);
    setSearchKeyword('');
    setActiveSearch({ type: '', keyword: '' });
  }, [activeTab]);
  useEffect(() => {
    if (!canOpenWriter) setShowWriter(false);
  }, [canOpenWriter]);

  const handleSearch = () => {
    setPage(1);
    setActiveSearch({ type: searchType, keyword: searchKeyword });
  };

  const handleSearchReset = () => {
    setSearchKeyword('');
    setActiveSearch({ type: '', keyword: '' });
    setPage(1);
  };

  const handleAdminDeleteBoard = async (boardId, e) => {
    e.stopPropagation();
    if (!window.confirm('관리자 권한으로 이 게시글을 삭제할까요?')) return;
    try {
      await adminApi.adminDeleteBoard(boardId);
      await load();
    } catch (err) {
      window.alert(err?.message || '삭제 실패');
    }
  };

  const pageButtons = useMemo(() => {
    const from = Math.max(1, page - 2);
    const to = Math.min(totalPages, page + 2);
    const nums = [];
    for (let p = from; p <= to; p++) nums.push(p);
    return nums;
  }, [page, totalPages]);

  const handleInsertImage = (dataUrl, file) => {
    const editorEl =
      editorContainerRef.current?.querySelector('[contenteditable]');
    if (editorEl) {
      editorEl.focus();
      const img = document.createElement('img');
      img.src = dataUrl;
      img.style.cssText =
        'max-width:100%;border-radius:8px;margin:8px 0;display:block;';
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(img);
        range.setStartAfter(img);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      } else {
        editorEl.appendChild(img);
      }
      setWriteContent(editorEl.innerHTML);
    }
    setPendingImages((prev) => [...prev, { dataUrl, file }]);
  };

  const submitPost = async () => {
    if (!isLoggedIn) {
      setError('로그인이 필요합니다.');
      return;
    }

    if (isBanned) {
      setError('정지(banned) 상태의 계정은 커뮤니티 글을 작성할 수 없습니다.');
      return;
    }
    const title = writeTitle.trim();
    const contentText = (writeContent ?? '').replace(/<[^>]*>/g, '').trim();
    if (!title) {
      setError('제목을 입력해주세요.');
      return;
    }
    if (!contentText) {
      setError('내용을 입력해주세요.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await communityApi.createBoard({
        boardTitle: title,
        boardCtnt: writeContent,
        code: effectiveCode,
        anonymity: anonymous ? 'Y' : 'N',
      });
      setWriteTitle('');
      setWriteContent('');
      setAnonymous(false);
      setPendingImages([]);
      setShowWriter(false);
      if (page === 1) await load();
      else setPage(1);
    } catch (e) {
      setError(e?.message || '게시글 작성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (e, boardId) => {
    e.stopPropagation();
    if (!isLoggedIn) return;
    const item = items.find((i) => (i.boardId ?? i.id) === boardId);
    if (!item) return;
    const token = localStorage.getItem('access_token') || '';
    try {
      await fetch(`/boards/${boardId}/likes`, {
        method: item.likedByMe ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems((prev) =>
        prev.map((i) =>
          (i.boardId ?? i.id) === boardId
            ? {
                ...i,
                likedByMe: !i.likedByMe,
                likeCount: (i.likeCount ?? 0) + (i.likedByMe ? -1 : 1),
              }
            : i
        )
      );
    } catch {
      /* silent */
    }
  };

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        {/* 헤더 */}
        <section className={styles.head}>
          <h1 className={styles.title}>커뮤니티</h1>
          <p className={styles.sub}>
            전체, 자유, 질문, 후기 게시글을 조회하고 작성할 수 있습니다.
          </p>
        </section>

        {/* 탭 + 글쓰기 버튼 */}
        <div className={styles.topBar}>
          <div className={styles.tabs}>
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`${styles.tabBtn} ${activeTab === tab.key ? styles.tabBtnActive : ''}`}
                onClick={() => {
                  setActiveTab(tab.key);
                  setShowWriter(false);
                  const next = new URLSearchParams(searchParams);
                  if (tab.key === 'ALL') next.delete('tab');
                  else next.set('tab', tab.key);
                  setSearchParams(next, { replace: true });
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 자유/전체/질문 탭에서 로그인 유저에게만 글쓰기 버튼 표시 */}
          {canOpenWriter && (
            <button
              type="button"
              className={styles.writeToggleBtn}
              onClick={() => setShowWriter((v) => !v)}
            >
              {showWriter ? '✕ 닫기' : '✏ 글쓰기'}
            </button>
          )}
        </div>

        {/* 검색 바 */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            margin: '12px 0',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            style={{
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid #ddd',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            <option value="title">제목</option>
            {isAdmin && <option value="userId">아이디</option>}
          </select>
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="검색어 입력"
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #ddd',
              fontSize: 14,
              minWidth: 200,
              flex: 1,
            }}
          />
          <button
            type="button"
            onClick={handleSearch}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              background: '#111',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            검색
          </button>
          {activeSearch.keyword && (
            <button
              type="button"
              onClick={handleSearchReset}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                background: '#f3f4f6',
                color: '#444',
                border: '1px solid #ddd',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              초기화
            </button>
          )}
        </div>

        {/* 글쓰기 폼 */}
        {canOpenWriter && showWriter && (
          <section className={styles.writerBox}>
            <div className={styles.writerRow}>
              <label className={styles.writerLabel}>분류</label>
              <div className={styles.writerFixed}>
                {activeTab === 'ALL' ? '자유' : typeLabel(activeTab)}
              </div>
            </div>
            <div className={styles.writerRow}>
              <label className={styles.writerLabel}>제목</label>
              <input
                className={styles.writerInput}
                value={writeTitle}
                onChange={(e) => setWriteTitle(e.target.value)}
                maxLength={200}
                disabled={submitting}
                placeholder="제목을 입력하세요"
              />
            </div>
            <div className={`${styles.writerRow} ${styles.writerRowContent}`}>
              <label className={styles.writerLabel}>내용</label>
              <div className={styles.editorWrapper} ref={editorContainerRef}>
                <RichEditor onChange={setWriteContent} disabled={submitting} />
                <div className={styles.editorFooter}>
                  <InlineImageBtn
                    onInsert={handleInsertImage}
                    disabled={submitting}
                  />
                  {pendingImages.length > 0 && (
                    <span className={styles.imgCount}>
                      이미지 {pendingImages.length}개
                    </span>
                  )}
                </div>
              </div>
            </div>
            {error && <div className={styles.error}>{error}</div>}
            <div className={styles.anonymousRow}>
              <label className={styles.anonymousLabel}>
                <input
                  type="checkbox"
                  className={styles.anonymousCheck}
                  checked={anonymous}
                  onChange={(e) => setAnonymous(e.target.checked)}
                  disabled={submitting}
                />
                익명으로 작성
              </label>
            </div>
            <div className={styles.writerActions}>
              <button
                type="button"
                className={styles.cancelWriteBtn}
                onClick={() => setShowWriter(false)}
                disabled={submitting}
              >
                취소
              </button>
              <button
                type="button"
                className={styles.submitBtn}
                onClick={submitPost}
                disabled={submitting || !writeTitle.trim() || isBanned}
              >
                {submitting ? '등록 중...' : '등록'}
              </button>
            </div>
          </section>
        )}

        {showWriter && isBanned && (
          <div className={styles.error}>
            정지(banned) 상태의 계정은 커뮤니티 글을 작성할 수 없습니다.
          </div>
        )}

        {!showWriter && error && <div className={styles.error}>{error}</div>}

        {/* 목록 */}
        {loading ? (
          <div className={styles.state}>불러오는 중...</div>
        ) : items.length === 0 ? (
          <div className={styles.state}>게시글이 없습니다.</div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.colType}>분류</th>
                  <th>제목</th>
                  <th className={styles.colAuthor}>작성자</th>
                  <th className={styles.colDate}>작성일</th>
                  <th className={styles.colNum}>조회</th>
                  <th className={styles.colNum}>좋아요</th>
                  {isAdmin && <th className={styles.colNum}>관리</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const boardId = item?.boardId ?? item?.id ?? idx;
                  const tkey = typeKey(item?.code ?? item?.boardType);
                  return (
                    <tr key={boardId} className={styles.row}>
                      <td>
                        <span
                          className={`${styles.typeBadge} ${styles['type_' + tkey]}`}
                        >
                          {typeLabel(item?.code ?? item?.boardType)}
                        </span>
                      </td>
                      <td className={styles.titleCell}>
                        <button
                          type="button"
                          className={styles.titleBtn}
                          onClick={() => {
                            if (activeTab === 'REVIEW') {
                              setReviewModal({
                                mode: 'detail',
                                reviewId: item.reviewId,
                              });
                            } else {
                              const tabQuery =
                                activeTab && activeTab !== 'ALL'
                                  ? `?tab=${encodeURIComponent(activeTab)}`
                                  : '';
                              navigate(`/community/${boardId}${tabQuery}`);
                            }
                          }}
                        >
                          {activeTab === 'REVIEW'
                            ? item?.reviewTitle ||
                              item?.reviewCtnt?.slice(0, 40) ||
                              '(내용 없음)'
                            : (item?.boardTitle ??
                              item?.title ??
                              '(제목 없음)')}
                          {(item?.fileCk === 'Y' ||
                            item?.files?.length > 0) && (
                            <span className={styles.fileIcon}>📎</span>
                          )}
                        </button>
                      </td>
                      <td className={styles.authorCell}>
                        {activeTab === 'REVIEW' ? (
                          <span
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <span style={{ color: '#d9ad5b', fontSize: 12 }}>
                              {'★'.repeat(item.rating ?? 0)}
                            </span>
                            <span style={{ fontSize: 12, color: '#9a8c70' }}>
                              {item?.userId ?? '-'}
                            </span>
                          </span>
                        ) : isAdmin && item?.realUserId ? (
                          <button
                            type="button"
                            className={styles.titleBtn}
                            onClick={() =>
                              setUserStatusModalId(item.realUserId)
                            }
                            title="회원 정보/상태 변경"
                          >
                            {item.realUserNickname ?? item.realUserId}
                          </button>
                        ) : (
                          <span>{item?.userId ?? '-'}</span>
                        )}
                      </td>
                      <td className={styles.dateCell}>
                        {formatDate(item?.createdAt)}
                      </td>
                      <td className={styles.numCell}>{item?.readCount ?? 0}</td>
                      <td className={styles.numCell}>
                        <button
                          type="button"
                          className={`${styles.likeBtn} ${item?.likedByMe ? styles.likeBtnActive : ''}`}
                          onClick={(e) => handleLike(e, boardId)}
                        >
                          {item?.likedByMe ? '❤️' : '🤍'} {item?.likeCount ?? 0}
                        </button>
                      </td>
                      {isAdmin && (
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={(e) => handleAdminDeleteBoard(boardId, e)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: 6,
                              background: '#fee2e2',
                              color: '#b91c1c',
                              border: '1px solid #fca5a5',
                              cursor: 'pointer',
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            삭제
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              type="button"
              className={styles.pageBtn}
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              {'<'}
            </button>
            {pageButtons.map((p) => (
              <button
                key={p}
                type="button"
                className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ''}`}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              className={styles.pageBtn}
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              {'>'}
            </button>
          </div>
        )}
      </main>
      <Footer />

      {reviewModal && (
        <ReviewModal
          mode={reviewModal.mode}
          reviewId={reviewModal.reviewId}
          roomId={reviewModal.roomId}
          onClose={() => setReviewModal(null)}
          onSaved={() => {
            setReviewModal(null);
            load();
          }}
        />
      )}

      {isAdmin && userStatusModalId && (
        <UserStatusModal
          userId={userStatusModalId}
          currentUserId={user?.userId}
          onClose={() => setUserStatusModalId(null)}
          onSaved={() => load()}
        />
      )}
    </div>
  );
}
