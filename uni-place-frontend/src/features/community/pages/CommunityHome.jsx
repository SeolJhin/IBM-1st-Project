import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Header from '../../../app/layouts/components/Header';
import Footer from '../../../app/layouts/components/Footer';
import { communityApi } from '../api/communityApi';
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
  if (key === 'FREE') return '자유';
  if (key === 'QUESTION') return '질문';
  if (key === 'REVIEW') return '후기';
  return '일반';
}

export default function CommunityHome() {
  const [activeTab, setActiveTab] = useState('ALL');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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
  }, [activeTab]);

  const pageButtons = useMemo(() => {
    const from = Math.max(1, page - 2);
    const to = Math.min(totalPages, page + 2);
    const nums = [];
    for (let p = from; p <= to; p += 1) nums.push(p);
    return nums;
  }, [page, totalPages]);

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.main}>
        <section className={styles.head}>
          <h1 className={styles.title}>커뮤니티</h1>
          <p className={styles.sub}>
            입주민 이야기와 질문, 후기를 한 곳에서 확인하세요.
          </p>
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
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const boardId = item?.boardId ?? item?.id ?? idx;
                  return (
                    <tr key={boardId}>
                      <td>{typeLabel(item?.boardType)}</td>
                      <td className={styles.titleCell}>
                        {item?.title ?? item?.boardTitle ?? '(제목 없음)'}
                      </td>
                      <td>{item?.userId ?? item?.writerId ?? '-'}</td>
                      <td>{formatDate(item?.createdAt ?? item?.createdDate)}</td>
                      <td>{item?.viewCount ?? item?.views ?? 0}</td>
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
