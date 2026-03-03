import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../../app/layouts/components/Header';
import Footer from '../../../app/layouts/components/Footer';
import { communityApi } from '../api/communityApi';
import { useAuth } from '../../user/hooks/useAuth';
import styles from './CommunityHome.module.css';

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
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('ALL');
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
      const data = await communityApi.getBoards({
        page,
        size: 10,
        boardType: activeTab,
      });
      const content = Array.isArray(data?.content)
        ? data.content
        : Array.isArray(data)
          ? data
          : [];
      setItems(content);
      setTotalPages(Math.max(1, Number(data?.totalPages ?? 1)));
    } catch (e) {
      setItems([]);
      setTotalPages(1);
      setError(e?.message || '게시글을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    setPage(1);
  }, [activeTab]);
  useEffect(() => {
    if (!canOpenWriter) setShowWriter(false);
  }, [canOpenWriter]);

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
                disabled={submitting || !writeTitle.trim()}
              >
                {submitting ? '등록 중...' : '등록'}
              </button>
            </div>
          </section>
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
                          onClick={() => navigate(`/community/${boardId}`)}
                        >
                          {item?.boardTitle ?? item?.title ?? '(제목 없음)'}
                          {(item?.fileCk === 'Y' ||
                            item?.files?.length > 0) && (
                            <span className={styles.fileIcon}>📎</span>
                          )}
                        </button>
                      </td>
                      <td className={styles.authorCell}>
                        {item?.userId ?? '-'}
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
    </div>
  );
}
