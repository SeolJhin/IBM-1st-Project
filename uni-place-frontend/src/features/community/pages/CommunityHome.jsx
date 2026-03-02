import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('ko-KR');
}

function typeLabel(value) {
  const key = String(value ?? '').toUpperCase();
  if (key === 'FREE' || key === 'BOARD_FREE') return '자유';
  if (key === 'QUESTION' || key === 'BOARD_QUESTION') return '질문';
  if (key === 'REVIEW' || key === 'BOARD_REVIEW') return '후기';
  if (key === 'NOTICE' || key === 'BOARD_NOTICE') return '공지';
  return '일반';
}

export default function CommunityHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userRole = String(user?.userRole ?? '').toLowerCase();

  const [activeTab, setActiveTab] = useState('ALL');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [showWriter, setShowWriter] = useState(false);
  const [writeType, setWriteType] = useState('FREE');
  const [writeTitle, setWriteTitle] = useState('');
  const [writeContent, setWriteContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selectedWriteType = activeTab === 'ALL' ? writeType : activeTab;
  const isAdmin = userRole === 'admin';
  const isTenant = userRole === 'tenant';
  const isUser = userRole === 'user';
  const effectiveWriteType =
    isUser && activeTab === 'ALL' ? 'QUESTION' : selectedWriteType;
  const isQuestionWrite =
    String(effectiveWriteType).toUpperCase() === 'QUESTION' ||
    String(effectiveWriteType).toUpperCase() === 'BOARD_QUESTION';

  const canOpenWriter = isAdmin || isTenant || (isUser && (activeTab === 'ALL' || activeTab === 'QUESTION'));
  const canSubmitWrite = isAdmin || isTenant || (isUser && isQuestionWrite);

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
      setError(e?.message || '커뮤니티 게시글을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
    if (activeTab !== 'ALL') {
      setWriteType(activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'ALL' && isUser && writeType !== 'QUESTION') {
      setWriteType('QUESTION');
    }
  }, [activeTab, isUser, writeType]);

  useEffect(() => {
    if (!canOpenWriter) {
      setShowWriter(false);
    }
  }, [canOpenWriter]);

  const pageButtons = useMemo(() => {
    const from = Math.max(1, page - 2);
    const to = Math.min(totalPages, page + 2);
    const nums = [];
    for (let p = from; p <= to; p += 1) nums.push(p);
    return nums;
  }, [page, totalPages]);

  const submitPost = async () => {
    if (!canSubmitWrite) {
      setError('커뮤니티 질문은 일반회원/입주자/관리자만 등록할 수 있습니다.');
      return;
    }

    const title = writeTitle.trim();
    const content = writeContent.trim();

    if (!title) {
      setError('제목을 입력해주세요.');
      return;
    }
    if (!content) {
      setError('내용을 입력해주세요.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await communityApi.createBoard({
        boardTitle: title,
        boardCtnt: content,
        code: effectiveWriteType,
        anonymity: 'N',
      });

      setWriteTitle('');
      setWriteContent('');
      setShowWriter(false);

      if (page === 1) {
        await load();
      } else {
        setPage(1);
      }
    } catch (e) {
      setError(e?.message || '게시글 작성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.main}>
        <section className={styles.head}>
          <h1 className={styles.title}>커뮤니티</h1>
          <p className={styles.sub}>전체, 자유, 질문, 후기 게시글을 조회하고 작성할 수 있습니다.</p>
        </section>

        <div className={styles.tabs}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`${styles.tabBtn} ${activeTab === tab.key ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className={styles.writerBar}>
          {canOpenWriter ? (
            <button
              type="button"
              className={styles.writeToggleBtn}
              onClick={() =>
                setShowWriter((v) => {
                  const next = !v;
                  if (next && activeTab === 'ALL' && isUser) {
                    setWriteType('QUESTION');
                  }
                  return next;
                })
              }
            >
              {showWriter ? '작성 닫기' : '글쓰기'}
            </button>
          ) : null}
        </div>

        {canOpenWriter && showWriter && (
          <section className={styles.writerBox}>
            <div className={styles.writerRow}>
              <label className={styles.writerLabel}>분류</label>
              {activeTab === 'ALL' ? (
                <select
                  className={styles.writerSelect}
                  value={isUser ? 'QUESTION' : writeType}
                  onChange={(e) => setWriteType(e.target.value)}
                  disabled={submitting}
                >
                  {(isAdmin || isTenant) ? <option value="FREE">자유</option> : null}
                  <option value="QUESTION">질문</option>
                  {(isAdmin || isTenant) ? <option value="REVIEW">후기</option> : null}
                </select>
              ) : (
                <div className={styles.writerFixed}>{typeLabel(activeTab)}</div>
              )}
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

            <div className={styles.writerRow}>
              <label className={styles.writerLabel}>내용</label>
              <textarea
                className={styles.writerTextarea}
                value={writeContent}
                onChange={(e) => setWriteContent(e.target.value)}
                disabled={submitting}
                placeholder="내용을 입력하세요"
                rows={6}
              />
            </div>

            <div className={styles.writerActions}>
              <button
                type="button"
                className={styles.submitBtn}
                onClick={submitPost}
                disabled={submitting}
              >
                {submitting ? '등록 중...' : '등록'}
              </button>
            </div>
          </section>
        )}

        {error ? <div className={styles.error}>{error}</div> : null}

        {loading ? (
          <div className={styles.state}>불러오는 중...</div>
        ) : items.length === 0 ? (
          <div className={styles.state}>게시글이 없습니다.</div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>분류</th>
                  <th>제목</th>
                  <th>작성자</th>
                  <th>작성일</th>
                  <th>조회</th>
                  <th>좋아요</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const boardId = item?.boardId ?? item?.id ?? idx;
                  return (
                    <tr key={boardId}>
                      <td>{typeLabel(item?.code ?? item?.boardType)}</td>
                      <td className={styles.titleCell}>
                        <button
                          type="button"
                          className={styles.titleBtn}
                          onClick={() => navigate(`/community/${boardId}`)}
                        >
                          {item?.boardTitle ?? item?.title ?? '(제목 없음)'}
                        </button>
                      </td>
                      <td>{item?.userId ?? item?.writerId ?? '-'}</td>
                      <td>{formatDate(item?.createdAt ?? item?.createdDate)}</td>
                      <td>{item?.readCount ?? item?.viewCount ?? item?.views ?? 0}</td>
                      <td>{item?.likeCount ?? item?.likes ?? 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              type="button"
              className={styles.pageBtn}
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
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
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
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
