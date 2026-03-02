import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './AdminPropertyListTable.module.css';

function normalizePage(payload) {
  const content = Array.isArray(payload?.content)
    ? payload.content
    : Array.isArray(payload)
      ? payload
      : [];

  const page = Number(payload?.page ?? 1);
  const totalPages = Number(payload?.totalPages ?? 1);
  const totalElements = Number(payload?.totalElements ?? content.length);

  return {
    content,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    totalPages: Number.isFinite(totalPages) && totalPages > 0 ? totalPages : 1,
    totalElements: Number.isFinite(totalElements)
      ? totalElements
      : content.length,
  };
}

function pageWindow(page, totalPages, radius = 2) {
  const from = Math.max(1, page - radius);
  const to = Math.min(totalPages, page + radius);
  const result = [];
  for (let p = from; p <= to; p += 1) result.push(p);
  return result;
}

function valueOrDash(v) {
  return v === null || v === undefined || v === '' ? '-' : String(v);
}

export default function AdminPropertyListTable({
  title,
  subtitle,
  fetcher,
  columns,
  initialQuery,
  filters = [],
  emptyMessage,
  rowKey,
  createLabel,
  onCreateClick,
  reloadRef,
  onDeleteSelected, // async (ids: number[]) => void
  deleteLabel, // 삭제 버튼 텍스트 (기본: "선택 삭제")
}) {
  const [query, setQuery] = useState(initialQuery);
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({
    page: 1,
    totalPages: 1,
    totalElements: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 체크박스 선택 state
  const [selected, setSelected] = useState(new Set());
  const [deleting, setDeleting] = useState(false);

  const resolveRowKey = (row, idx) => {
    if (typeof rowKey === 'function') return rowKey(row, idx);
    if (typeof rowKey === 'string' && row?.[rowKey] !== undefined)
      return row[rowKey];
    return idx;
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    setSelected(new Set()); // 페이지 바뀌면 선택 초기화
    try {
      const payload = await fetcher(query);
      const pageData = normalizePage(payload);
      setRows(pageData.content);
      setMeta({
        page: pageData.page,
        totalPages: pageData.totalPages,
        totalElements: pageData.totalElements,
      });
    } catch (e) {
      setRows([]);
      setMeta({ page: 1, totalPages: 1, totalElements: 0 });
      setError(e?.message || '목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [fetcher, query]);

  useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    if (reloadRef) reloadRef.current = load;
  }, [reloadRef, load]);

  const pages = useMemo(
    () => pageWindow(meta.page, meta.totalPages),
    [meta.page, meta.totalPages]
  );

  const setFilterValue = (key, rawValue, parse) => {
    const nextValue = parse ? parse(rawValue) : rawValue;
    setQuery((prev) => ({ ...prev, [key]: nextValue, page: 1 }));
  };

  // ── 체크박스 핸들러 ──
  const allKeys = rows.map((r, i) => resolveRowKey(r, i));
  const allChecked =
    allKeys.length > 0 && allKeys.every((k) => selected.has(k));
  const someChecked = allKeys.some((k) => selected.has(k));

  const toggleAll = () => {
    if (allChecked) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allKeys));
    }
  };

  const toggleOne = (key) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // ── 일괄 삭제 ──
  const handleDeleteSelected = async () => {
    if (selected.size === 0) return;
    if (
      !window.confirm(
        `선택한 ${selected.size}개를 삭제하시겠습니까?\n삭제 후 복구할 수 없습니다.`
      )
    )
      return;
    setDeleting(true);
    try {
      await onDeleteSelected([...selected]);
      await load();
    } catch (e) {
      alert(e?.message || '삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  const hasDelete = typeof onDeleteSelected === 'function';

  // columns 앞에 체크박스 컬럼 삽입 (삭제 기능 있을 때만)
  const effectiveColumns = hasDelete
    ? [{ key: '__check__', label: '' }, ...columns]
    : columns;

  return (
    <section className={styles.wrap}>
      <div className={styles.topRow}>
        <div className={styles.titleArea}>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.sub}>
            {subtitle} 총 <strong>{meta.totalElements}</strong>건
          </p>
        </div>
        <div className={styles.actions}>
          {onCreateClick && (
            <button
              type="button"
              className={`${styles.btn} ${styles.btnCreate}`}
              onClick={onCreateClick}
            >
              + {createLabel || '새로 만들기'}
            </button>
          )}
          {hasDelete && selected.size > 0 && (
            <button
              type="button"
              className={`${styles.btn} ${styles.btnDelete}`}
              onClick={handleDeleteSelected}
              disabled={deleting}
            >
              {deleting
                ? '삭제 중...'
                : `🗑 ${deleteLabel || '선택 삭제'} (${selected.size})`}
            </button>
          )}
          {'direct' in query && (
            <select
              className={styles.select}
              value={query.direct ?? 'DESC'}
              onChange={(e) =>
                setQuery((prev) => ({
                  ...prev,
                  direct: e.target.value,
                  page: 1,
                }))
              }
            >
              <option value="DESC">최신순</option>
              <option value="ASC">오래된순</option>
            </select>
          )}
          <select
            className={styles.select}
            value={query.size ?? 10}
            onChange={(e) =>
              setQuery((prev) => ({
                ...prev,
                size: Number(e.target.value),
                page: 1,
              }))
            }
          >
            {[10, 20, 30, 50].map((n) => (
              <option key={n} value={n}>
                {n}개
              </option>
            ))}
          </select>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={load}
            disabled={loading}
          >
            {loading ? '로딩중...' : '새로고침'}
          </button>
        </div>
      </div>

      {filters.length > 0 && (
        <div className={styles.filterRow}>
          {filters.map((f) => (
            <label key={f.key} className={styles.filterItem}>
              <span className={styles.filterLabel}>{f.label}</span>
              {f.type === 'select' ? (
                <select
                  className={styles.select}
                  value={query[f.key] ?? ''}
                  onChange={(e) =>
                    setFilterValue(f.key, e.target.value, f.parse)
                  }
                >
                  {(f.options ?? []).map((opt) => (
                    <option key={String(opt.value)} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className={styles.input}
                  type={f.type || 'text'}
                  value={query[f.key] ?? ''}
                  placeholder={f.placeholder || ''}
                  onChange={(e) =>
                    setFilterValue(f.key, e.target.value, f.parse)
                  }
                />
              )}
            </label>
          ))}
          <button
            type="button"
            className={styles.btn}
            onClick={() => setQuery({ ...initialQuery })}
          >
            필터 초기화
          </button>
        </div>
      )}

      {error ? <div className={styles.errorBox}>{error}</div> : null}
      {loading ? (
        <div className={styles.loading}>데이터를 불러오는 중입니다...</div>
      ) : null}

      {!loading && rows.length === 0 ? (
        <div className={styles.empty}>
          {emptyMessage || '데이터가 없습니다.'}
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                {effectiveColumns.map((col) => (
                  <th
                    key={col.key}
                    className={col.key === '__check__' ? styles.checkTh : ''}
                  >
                    {col.key === '__check__' ? (
                      <input
                        type="checkbox"
                        className={styles.checkbox}
                        checked={allChecked}
                        ref={(el) => {
                          if (el) el.indeterminate = someChecked && !allChecked;
                        }}
                        onChange={toggleAll}
                        title="전체 선택"
                      />
                    ) : (
                      col.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const key = resolveRowKey(row, idx);
                const isChecked = selected.has(key);
                return (
                  <tr key={key} className={isChecked ? styles.rowSelected : ''}>
                    {effectiveColumns.map((col) => (
                      <td
                        key={col.key}
                        className={
                          col.key === '__check__' ? styles.checkTd : ''
                        }
                      >
                        {col.key === '__check__' ? (
                          <input
                            type="checkbox"
                            className={styles.checkbox}
                            checked={isChecked}
                            onChange={() => toggleOne(key)}
                          />
                        ) : col.render ? (
                          col.render(row, idx)
                        ) : (
                          valueOrDash(row?.[col.key])
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {meta.totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            type="button"
            className={styles.pageBtn}
            disabled={meta.page <= 1}
            onClick={() =>
              setQuery((prev) => ({ ...prev, page: prev.page - 1 }))
            }
          >
            {'<'}
          </button>
          {pages.map((p) => (
            <button
              key={p}
              type="button"
              className={`${styles.pageBtn} ${p === meta.page ? styles.pageBtnActive : ''}`}
              onClick={() => setQuery((prev) => ({ ...prev, page: p }))}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            className={styles.pageBtn}
            disabled={meta.page >= meta.totalPages}
            onClick={() =>
              setQuery((prev) => ({ ...prev, page: prev.page + 1 }))
            }
          >
            {'>'}
          </button>
        </div>
      )}
    </section>
  );
}
