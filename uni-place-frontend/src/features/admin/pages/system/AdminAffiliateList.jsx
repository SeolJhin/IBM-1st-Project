import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

// 프로젝트 공통 request 래퍼(구조 문서 기준)
import { apiUrlEncoded } from '../../../../app/http/request';

function toQueryInt(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function formatDT(v) {
  if (!v) return '';
  // 백엔드가 LocalDateTime을 ISO로 주는 경우(예: 2026-02-28T12:34:56)
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
  } catch {
    return String(v);
  }
}

function Pagination({ page, totalPages, onChange }) {
  if (!totalPages || totalPages <= 1) return null;

  const safePage = Math.min(Math.max(page, 1), totalPages);

  const pages = [];
  const start = Math.max(1, safePage - 2);
  const end = Math.min(totalPages, safePage + 2);
  for (let p = start; p <= end; p++) pages.push(p);

  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
      }}
    >
      <button
        type="button"
        onClick={() => onChange(1)}
        disabled={safePage === 1}
      >
        {'<<'}
      </button>
      <button
        type="button"
        onClick={() => onChange(safePage - 1)}
        disabled={safePage === 1}
      >
        {'<'}
      </button>

      {start > 1 && (
        <>
          <button type="button" onClick={() => onChange(1)}>
            1
          </button>
          {start > 2 && <span>…</span>}
        </>
      )}

      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          style={{
            fontWeight: p === safePage ? 800 : 400,
            textDecoration: p === safePage ? 'underline' : 'none',
          }}
        >
          {p}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span>…</span>}
          <button type="button" onClick={() => onChange(totalPages)}>
            {totalPages}
          </button>
        </>
      )}

      <button
        type="button"
        onClick={() => onChange(safePage + 1)}
        disabled={safePage === totalPages}
      >
        {'>'}
      </button>
      <button
        type="button"
        onClick={() => onChange(totalPages)}
        disabled={safePage === totalPages}
      >
        {'>>'}
      </button>
    </div>
  );
}

export default function AdminAffiliateList() {
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();

  // URL state (검색조건/페이지 유지)
  const page = useMemo(() => toQueryInt(sp.get('page')) || 1, [sp]);
  const size = useMemo(() => toQueryInt(sp.get('size')) || 20, [sp]);

  const [filters, setFilters] = useState({
    buildingId: sp.get('buildingId') || '',
    code: sp.get('code') || '',
    keyword: sp.get('keyword') || '',
    affiliateSt: sp.get('affiliateSt') || '',
  });

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [pageMeta, setPageMeta] = useState({
    page: 1,
    size: 20,
    totalPages: 1,
    totalElements: 0,
  });
  const [error, setError] = useState('');

  const statusOptions = [
    { value: '', label: '전체' },
    { value: 'planned', label: 'planned(예정)' },
    { value: 'progress', label: 'progress(진행)' },
    { value: 'ended', label: 'ended(종료)' },
  ];

  const buildQuery = (overrides = {}) => {
    const q = {
      buildingId: filters.buildingId?.trim()
        ? Number(filters.buildingId)
        : undefined,
      code: filters.code?.trim() || undefined,
      keyword: filters.keyword?.trim() || undefined,
      affiliateSt: filters.affiliateSt?.trim() || undefined,
      page: (overrides.page ?? page) - 1, // Spring Pageable: 0-base
      size: overrides.size ?? size,
      // sort는 기본이 affiliateId,DESC라 생략 가능. 필요하면: sort: 'affiliateId,desc'
    };
    // undefined 제거
    Object.keys(q).forEach((k) => q[k] === undefined && delete q[k]);
    return q;
  };

  const syncUrl = (next) => {
    const params = new URLSearchParams(sp);
    Object.entries(next).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') params.delete(k);
      else params.set(k, String(v));
    });
    setSp(params, { replace: true });
  };

  const fetchList = async () => {
    setLoading(true);
    setError('');
    try {
      const query = buildQuery();
      const res = await apiUrlEncoded.get('/admin/affiliates', query);

      // ApiResponse<PageResponse<AffiliateSummaryResponse>>
      const data = res?.data?.data;
      const content = data?.content ?? [];
      setRows(content);

      setPageMeta({
        page: data?.page ?? page,
        size: data?.size ?? size,
        totalPages: data?.totalPages ?? 1,
        totalElements: data?.totalElements ?? 0,
      });
    } catch (e) {
      setError(e?.message || '목록 조회 중 오류가 발생했습니다.');
      setRows([]);
      setPageMeta({ page, size, totalPages: 1, totalElements: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size, sp.toString()]);

  const onSubmitSearch = (e) => {
    e.preventDefault();
    // 검색 시 page=1로
    syncUrl({
      page: 1,
      size,
      buildingId: filters.buildingId.trim(),
      code: filters.code.trim(),
      keyword: filters.keyword.trim(),
      affiliateSt: filters.affiliateSt.trim(),
    });
  };

  const onReset = () => {
    setFilters({ buildingId: '', code: '', keyword: '', affiliateSt: '' });
    syncUrl({
      page: 1,
      size,
      buildingId: '',
      code: '',
      keyword: '',
      affiliateSt: '',
    });
  };

  const goPage = (p) => syncUrl({ page: p });

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <h2 style={{ margin: 0 }}>제휴 관리</h2>
        <button
          type="button"
          onClick={() => navigate('/admin/system/affiliates/new')}
        >
          + 제휴 등록
        </button>
      </div>

      {/* 검색 영역 */}
      <form
        onSubmit={onSubmitSearch}
        style={{
          border: '1px solid #ddd',
          borderRadius: 8,
          padding: 16,
          marginBottom: 16,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: 12,
        }}
      >
        <div>
          <label style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>
            건물 ID
          </label>
          <input
            value={filters.buildingId}
            onChange={(e) =>
              setFilters((p) => ({ ...p, buildingId: e.target.value }))
            }
            placeholder="예: 1"
            inputMode="numeric"
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>
            제휴 분류(code)
          </label>
          <input
            value={filters.code}
            onChange={(e) =>
              setFilters((p) => ({ ...p, code: e.target.value }))
            }
            placeholder="common_code.code"
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>
            키워드
          </label>
          <input
            value={filters.keyword}
            onChange={(e) =>
              setFilters((p) => ({ ...p, keyword: e.target.value }))
            }
            placeholder="업체명/대표자/전화"
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>
            상태
          </label>
          <select
            value={filters.affiliateSt}
            onChange={(e) =>
              setFilters((p) => ({ ...p, affiliateSt: e.target.value }))
            }
            style={{ width: '100%' }}
          >
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div
          style={{
            gridColumn: '1 / -1',
            display: 'flex',
            gap: 8,
            justifyContent: 'flex-end',
          }}
        >
          <button type="button" onClick={onReset}>
            초기화
          </button>
          <button type="submit">검색</button>
        </div>
      </form>

      {/* 목록 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <div style={{ fontSize: 13, color: '#555' }}>
          총 <b>{pageMeta.totalElements}</b>건
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12 }}>페이지 크기</span>
          <select
            value={size}
            onChange={(e) => syncUrl({ size: Number(e.target.value), page: 1 })}
          >
            {[10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        style={{
          border: '1px solid #ddd',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#fafafa' }}>
            <tr>
              <th
                style={{
                  textAlign: 'left',
                  padding: 12,
                  borderBottom: '1px solid #eee',
                }}
              >
                ID
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: 12,
                  borderBottom: '1px solid #eee',
                }}
              >
                건물ID
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: 12,
                  borderBottom: '1px solid #eee',
                }}
              >
                업체명
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: 12,
                  borderBottom: '1px solid #eee',
                }}
              >
                전화
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: 12,
                  borderBottom: '1px solid #eee',
                }}
              >
                분류(code)
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: 12,
                  borderBottom: '1px solid #eee',
                }}
              >
                상태
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: 12,
                  borderBottom: '1px solid #eee',
                }}
              >
                시작
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: 12,
                  borderBottom: '1px solid #eee',
                }}
              >
                종료
              </th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} style={{ padding: 16 }}>
                  로딩 중...
                </td>
              </tr>
            )}

            {!loading && error && (
              <tr>
                <td colSpan={8} style={{ padding: 16, color: 'crimson' }}>
                  {error}
                </td>
              </tr>
            )}

            {!loading && !error && rows.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: 16 }}>
                  데이터가 없습니다.
                </td>
              </tr>
            )}

            {!loading &&
              !error &&
              rows.map((r) => (
                <tr
                  key={r.affiliateId}
                  onClick={() =>
                    navigate(`/admin/system/affiliates/${r.affiliateId}`)
                  }
                  style={{ cursor: 'pointer' }}
                >
                  <td
                    style={{ padding: 12, borderBottom: '1px solid #f0f0f0' }}
                  >
                    {r.affiliateId}
                  </td>
                  <td
                    style={{ padding: 12, borderBottom: '1px solid #f0f0f0' }}
                  >
                    {r.buildingId}
                  </td>
                  <td
                    style={{ padding: 12, borderBottom: '1px solid #f0f0f0' }}
                  >
                    {r.affiliateNm}
                  </td>
                  <td
                    style={{ padding: 12, borderBottom: '1px solid #f0f0f0' }}
                  >
                    {r.affiliateTel || '-'}
                  </td>
                  <td
                    style={{ padding: 12, borderBottom: '1px solid #f0f0f0' }}
                  >
                    {r.code || '-'}
                  </td>
                  <td
                    style={{ padding: 12, borderBottom: '1px solid #f0f0f0' }}
                  >
                    {r.affiliateSt || '-'}
                  </td>
                  <td
                    style={{ padding: 12, borderBottom: '1px solid #f0f0f0' }}
                  >
                    {formatDT(r.affiliateStartAt) || '-'}
                  </td>
                  <td
                    style={{ padding: 12, borderBottom: '1px solid #f0f0f0' }}
                  >
                    {formatDT(r.affiliateEndAt) || '-'}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <Pagination
        page={pageMeta.page}
        totalPages={pageMeta.totalPages}
        onChange={goPage}
      />
    </div>
  );
}
