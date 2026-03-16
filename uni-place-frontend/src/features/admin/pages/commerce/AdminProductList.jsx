// features/admin/pages/commerce/AdminProductList.jsx
// 룸서비스 상품 관리 - 추가/수정/삭제 + 빌딩별 재고 관리
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { adminApi } from '../../api/adminApi';
import styles from './AdminProductList.module.css';

// ─── 상수 ─────────────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: 'on_sale', label: '판매중' },
  { value: 'sold_out', label: '품절' },
];
const STATUS_MAP = { on_sale: '판매중', sold_out: '품절' };

const CODE_FALLBACK = [
  { code: 'PROD_FOOD', label: '식음료' },
  { code: 'PROD_CLEAN', label: '청소' },
  { code: 'PROD_DAILY', label: '생활용품' },
  { code: 'PROD_ELEC', label: '전자/가전' },
  { code: 'PROD_HEALTH', label: '건강/위생' },
];

const EMPTY_FORM = {
  prodNm: '',
  prodPrice: '',
  code: 'PROD_FOOD',
  prodDesc: '',
  affiliateId: '',
};

// ─── 유틸 ──────────────────────────────────────────────────────────────────
const fmt = (v) => Number(v ?? 0).toLocaleString('ko-KR') + '원';
const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

function windowedPages(cur, total, r = 2) {
  const from = Math.max(1, cur - r);
  const to = Math.min(total, cur + r);
  const pages = [];
  for (let p = from; p <= to; p++) pages.push(p);
  return pages;
}

// ─── 카테고리 칩 색상 (코드 기반, DB에서 동적으로 추가된 코드도 순환 색상 적용) ─
const CODE_COLORS = [
  { bg: '#fef3c7', color: '#92400e' }, // 노란 계열 - FOOD
  { bg: '#dbeafe', color: '#1e40af' }, // 파란 계열 - CLEAN
  { bg: '#d1fae5', color: '#065f46' }, // 초록 계열 - DAILY
  { bg: '#ede9fe', color: '#5b21b6' }, // 보라 계열 - ELEC
  { bg: '#fee2e2', color: '#991b1b' }, // 빨간 계열 - HEALTH
  { bg: '#fce7f3', color: '#9d174d' },
  { bg: '#e0f2fe', color: '#075985' },
  { bg: '#f0fdf4', color: '#166534' },
];
// codeOptions 인덱스 기반으로 색상 매핑
function CodeChip({ code, codeOptions }) {
  const idx = codeOptions.findIndex((c) => c.code === code);
  const label = idx >= 0 ? codeOptions[idx].label : (code ?? '-');
  const color = CODE_COLORS[Math.max(idx, 0) % CODE_COLORS.length];
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 700,
        background: color.bg,
        color: color.color,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}
function StatusBadge({ status }) {
  const key = String(status ?? '').toLowerCase();
  return (
    <span
      className={`${styles.badge} ${key === 'sold_out' ? styles.badgeSoldOut : styles.badgeOnSale}`}
    >
      {STATUS_MAP[key] ?? status ?? '-'}
    </span>
  );
}

// ─── BuildingStockPanel ────────────────────────────────────────────────────
function BuildingStockPanel({ prodId, onClose, onSaved }) {
  const [rows, setRows] = useState([]); // { buildingId, buildingNm, stock }
  const [loading, setLoading] = useState(true);
  const [inputs, setInputs] = useState({});
  const [saving, setSaving] = useState(null);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // 전체 빌딩 목록 + 현재 상품 재고 병렬 조회
      const [buildingsData, stocksData] = await Promise.all([
        adminApi.getBuildings({ page: 1, size: 100 }),
        adminApi.getProductBuildingStocks(prodId),
      ]);

      const buildings = Array.isArray(buildingsData)
        ? buildingsData
        : (buildingsData?.content ?? []);
      const stocks = Array.isArray(stocksData) ? stocksData : [];

      // buildingId → stock 맵
      const stockMap = {};
      stocks.forEach((s) => {
        stockMap[s.buildingId] = s.stock;
      });

      // 전체 빌딩 기준으로 병합 (재고 없으면 0)
      const merged = buildings
        .map((b) => ({
          buildingId: b.buildingId,
          buildingNm: b.buildingNm ?? `건물 #${b.buildingId}`,
          stock: stockMap[b.buildingId] ?? 0,
        }))
        .sort((a, b) => a.buildingId - b.buildingId);

      setRows(merged);
      const m = {};
      merged.forEach((r) => {
        m[r.buildingId] = String(r.stock);
      });
      setInputs(m);
    } catch {
      setMsg('재고 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [prodId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (buildingId) => {
    const stock = Number(inputs[buildingId] ?? 0);
    if (isNaN(stock) || stock < 0) {
      setMsg('0 이상의 숫자를 입력하세요.');
      return;
    }
    setSaving(buildingId);
    setMsg('');
    try {
      await adminApi.upsertProductBuildingStock(prodId, buildingId, stock);
      setMsg(`저장 완료`);
      await load();
      onSaved?.();
      setTimeout(() => setMsg(''), 2000);
    } catch (e) {
      setMsg(e?.message || '저장 실패');
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className={styles.stockPanel}>
      <div className={styles.stockPanelHeader}>
        <span className={styles.stockPanelTitle}>🏢 건물별 재고 편집</span>
        <button type="button" className={styles.closeBtn} onClick={onClose}>
          ✕
        </button>
      </div>
      {msg && <div className={styles.stockMsg}>{msg}</div>}
      {loading ? (
        <div className={styles.stockLoading}>불러오는 중...</div>
      ) : rows.length === 0 ? (
        <div className={styles.stockEmpty}>등록된 건물이 없습니다.</div>
      ) : (
        <div className={styles.stockList}>
          {rows.map((r) => (
            <div key={r.buildingId} className={styles.stockRow}>
              <span className={styles.stockBuildingLabel}>{r.buildingNm}</span>
              <span className={styles.stockCurrent}>현재: {r.stock}</span>
              <input
                type="number"
                min="0"
                className={styles.stockInput}
                value={inputs[r.buildingId] ?? ''}
                onChange={(e) =>
                  setInputs((prev) => ({
                    ...prev,
                    [r.buildingId]: e.target.value,
                  }))
                }
              />
              <button
                type="button"
                className={styles.stockSaveBtn}
                disabled={saving === r.buildingId}
                onClick={() => handleSave(r.buildingId)}
              >
                {saving === r.buildingId ? '저장 중' : '저장'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ProductFormModal ──────────────────────────────────────────────────────
function ProductFormModal({
  product,
  codeOptions,
  affiliateOptions,
  onClose,
  onSaved,
}) {
  const isEdit = !!product;
  const [form, setForm] = useState(
    isEdit
      ? {
          prodNm: product.prodNm ?? '',
          prodPrice: String(product.prodPrice ?? ''),
          code: product.code ?? 'PROD_FOOD',
          prodDesc: product.prodDesc ?? '',
          affiliateId:
            product.affiliateId != null ? String(product.affiliateId) : '',
        }
      : EMPTY_FORM
  );
  const [statusVal, setStatusVal] = useState(
    isEdit ? (product.prodSt ?? 'on_sale') : 'on_sale'
  );

  // 이미지 상태
  const [existingImages, setExistingImages] = useState([]); // 수정 시 기존 이미지
  const [newFiles, setNewFiles] = useState([]); // 새로 추가할 파일
  const [newPreviews, setNewPreviews] = useState([]); // 새 파일 미리보기 URL
  const [deletedFileIds, setDeletedFileIds] = useState([]); // 삭제 표시된 기존 이미지 ID
  const fileInputRef = useRef(null);

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  // 수정 모드일 때 기존 이미지 로드
  useEffect(() => {
    if (!isEdit) return;
    adminApi
      .getProductImages(product.prodId)
      .then((res) => {
        const list = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
            ? res
            : [];
        setExistingImages(list);
      })
      .catch(() => {});
  }, [isEdit, product?.prodId]);

  const set = (k) => (e) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  // 파일 선택
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const total =
      existingImages.length -
      deletedFileIds.length +
      newFiles.length +
      files.length;
    if (total > 5) {
      setErr('이미지는 최대 5장까지 등록 가능합니다.');
      return;
    }
    setErr('');
    setNewFiles((prev) => [...prev, ...files]);
    setNewPreviews((prev) => [
      ...prev,
      ...files.map((f) => URL.createObjectURL(f)),
    ]);
    e.target.value = '';
  };

  // 새 파일 제거
  const removeNewFile = (idx) => {
    URL.revokeObjectURL(newPreviews[idx]);
    setNewFiles((prev) => prev.filter((_, i) => i !== idx));
    setNewPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  // 기존 이미지 삭제 표시 토글
  const toggleDeleteExisting = (fileId) => {
    setDeletedFileIds((prev) =>
      prev.includes(fileId)
        ? prev.filter((id) => id !== fileId)
        : [...prev, fileId]
    );
  };

  const validate = () => {
    if (!form.prodNm.trim()) return '상품명을 입력하세요.';
    if (
      !form.prodPrice ||
      isNaN(Number(form.prodPrice)) ||
      Number(form.prodPrice) < 0
    )
      return '올바른 가격을 입력하세요.';
    if (!form.code) return '카테고리를 선택하세요.';
    if (!form.prodDesc.trim()) return '상품 설명을 입력하세요.';
    return '';
  };

  const handleSubmit = async () => {
    const errMsg = validate();
    if (errMsg) {
      setErr(errMsg);
      return;
    }
    setSaving(true);
    setErr('');
    const body = {
      prodNm: form.prodNm.trim(),
      prodPrice: Number(form.prodPrice),
      prodStock: 0,
      code: form.code,
      prodDesc: form.prodDesc.trim(),
      affiliateId: form.affiliateId ? Number(form.affiliateId) : null,
    };
    try {
      let prodId = product?.prodId;
      if (isEdit) {
        await adminApi.updateProduct(prodId, body);
        if (statusVal !== product.prodSt) {
          await adminApi.changeProductStatus(prodId, statusVal);
        }
      } else {
        const res = await adminApi.createProduct(body);
        // prodId 추출: ApiResponse 래핑 여부에 따라
        prodId = res?.data ?? res;
      }

      // 기존 이미지 삭제
      if (deletedFileIds.length > 0 && prodId) {
        await adminApi
          .deleteProductImages(prodId, deletedFileIds)
          .catch(() => {});
      }
      // 새 이미지 업로드
      if (newFiles.length > 0 && prodId) {
        await adminApi.uploadProductImages(prodId, newFiles).catch(() => {});
      }

      onSaved();
    } catch (e) {
      setErr(e?.message || (isEdit ? '수정 실패' : '등록 실패'));
    } finally {
      setSaving(false);
    }
  };

  const activeExisting = existingImages.filter(
    (img) => !deletedFileIds.includes(img.fileId)
  );
  const totalImageCount = activeExisting.length + newFiles.length;

  return (
    <div
      className={styles.modalOverlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            {isEdit ? '상품 수정' : '상품 등록'}
          </h3>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>
        <div className={styles.modalBody}>
          {err && <div className={styles.formErr}>{err}</div>}
          <div className={styles.formGrid}>
            <label className={styles.formLabel}>
              <span>
                상품명 <span className={styles.req}>*</span>
              </span>
              <input
                className={styles.formInput}
                value={form.prodNm}
                onChange={set('prodNm')}
                placeholder="예: 아메리카노"
                maxLength={50}
              />
            </label>
            <label className={styles.formLabel}>
              <span>
                카테고리 <span className={styles.req}>*</span>
              </span>
              <select
                className={styles.formSelect}
                value={form.code}
                onChange={set('code')}
              >
                {codeOptions.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.formLabel}>
              <span>
                가격 (원) <span className={styles.req}>*</span>
              </span>
              <input
                type="number"
                min="0"
                className={styles.formInput}
                value={form.prodPrice}
                onChange={set('prodPrice')}
                placeholder="4500"
              />
            </label>
            {isEdit && (
              <label className={styles.formLabel}>
                판매 상태
                <select
                  className={styles.formSelect}
                  value={statusVal}
                  onChange={(e) => setStatusVal(e.target.value)}
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className={styles.formLabel}>
              제휴사
              <select
                className={styles.formSelect}
                value={form.affiliateId}
                onChange={set('affiliateId')}
              >
                <option value="">없음</option>
                {affiliateOptions.map((a) => (
                  <option key={a.affiliateId} value={String(a.affiliateId)}>
                    {a.affiliateNm}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className={styles.formLabelFull}>
            상품 설명 <span className={styles.req}>*</span>
            <textarea
              className={styles.formTextarea}
              value={form.prodDesc}
              onChange={set('prodDesc')}
              placeholder="상품 설명을 입력하세요"
              rows={3}
              maxLength={2000}
            />
          </label>

          {/* ── 이미지 업로드 ── */}
          <div className={styles.imageSection}>
            <div className={styles.imageSectionHeader}>
              <span className={styles.formLabelText}>
                상품 이미지
                <span
                  style={{ color: '#9ca3af', fontWeight: 400, marginLeft: 6 }}
                >
                  ({totalImageCount}/5)
                </span>
              </span>
              {totalImageCount < 5 && (
                <button
                  type="button"
                  className={styles.imageAddBtn}
                  onClick={() => fileInputRef.current?.click()}
                >
                  + 사진 추가
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </div>

            {totalImageCount === 0 ? (
              <div
                className={styles.imageEmpty}
                onClick={() => fileInputRef.current?.click()}
              >
                <span className={styles.imageEmptyIcon}>🖼️</span>
                <span>클릭해서 이미지 추가</span>
              </div>
            ) : (
              <div className={styles.imageGrid}>
                {/* 기존 이미지 */}
                {existingImages.map((img) => {
                  const isDeleting = deletedFileIds.includes(img.fileId);
                  return (
                    <div
                      key={img.fileId}
                      className={`${styles.imageThumb} ${isDeleting ? styles.imageThumbDeleting : ''}`}
                    >
                      <img
                        src={(() => {
                          const u = img.adminViewUrl || img.viewUrl || '';
                          return u.startsWith('/api') ? u : `/api${u}`;
                        })()}
                        alt="상품 이미지"
                        className={styles.imageThumbImg}
                      />
                      <button
                        type="button"
                        className={styles.imageRemoveBtn}
                        onClick={() => toggleDeleteExisting(img.fileId)}
                        title={isDeleting ? '삭제 취소' : '삭제'}
                      >
                        {isDeleting ? '↩' : '✕'}
                      </button>
                      {isDeleting && (
                        <div className={styles.imageDeleteOverlay}>
                          삭제 예정
                        </div>
                      )}
                    </div>
                  );
                })}
                {/* 새 이미지 */}
                {newPreviews.map((url, idx) => (
                  <div key={`new-${idx}`} className={styles.imageThumb}>
                    <img
                      src={url}
                      alt="새 이미지"
                      className={styles.imageThumbImg}
                    />
                    <button
                      type="button"
                      className={styles.imageRemoveBtn}
                      onClick={() => removeNewFile(idx)}
                      title="제거"
                    >
                      ✕
                    </button>
                    <div className={styles.imageNewBadge}>NEW</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.btnCancel}
            onClick={onClose}
            disabled={saving}
          >
            취소
          </button>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? '저장 중...' : isEdit ? '수정 완료' : '등록'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── DeleteConfirmModal ────────────────────────────────────────────────────
function DeleteConfirmModal({ product, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const handleDelete = async () => {
    setLoading(true);
    setErr('');
    try {
      await adminApi.deleteProduct(product.prodId);
      onDeleted();
    } catch (e) {
      setErr(e?.message || '삭제 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={styles.modalOverlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.modal} style={{ maxWidth: 420 }}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>상품 삭제</h3>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>
        <div className={styles.modalBody}>
          {err && <div className={styles.formErr}>{err}</div>}
          <p className={styles.deleteMsg}>
            <strong>
              #{product.prodId} {product.prodNm}
            </strong>{' '}
            상품을 삭제하시겠습니까?
          </p>
          <p className={styles.deleteWarn}>
            주문 내역이 있는 상품은 삭제되지 않을 수 있습니다.
          </p>
        </div>
        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.btnCancel}
            onClick={onClose}
            disabled={loading}
          >
            취소
          </button>
          <button
            type="button"
            className={styles.btnDanger}
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? '삭제 중...' : '삭제 확인'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 메인 컴포넌트 ─────────────────────────────────────────────────────────
export default function AdminProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [codeOptions, setCodeOptions] = useState(CODE_FALLBACK);
  const [affiliateOptions, setAffiliateOptions] = useState([]); // { affiliateId, affiliateNm }

  // 필터
  const [statusFilter, setStatusFilter] = useState('all');
  const [codeFilter, setCodeFilter] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);

  // 모달
  const [formModal, setFormModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [stockPanel, setStockPanel] = useState(null);

  const noticeTid = useRef(null);
  const showNotice = (msg) => {
    setNotice(msg);
    clearTimeout(noticeTid.current);
    noticeTid.current = setTimeout(() => setNotice(''), 3000);
  };

  // 전체 상품 로드 (관리자용 - sold_out 포함)
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.getAllProductsAdmin();
      const list = Array.isArray(data) ? data : [];
      setProducts(list);
    } catch {
      // 폴백: on_sale만 반환하는 공개 API
      try {
        const data = await adminApi.getProducts();
        const list = Array.isArray(data) ? data : [];
        setProducts(list);
      } catch (e2) {
        setError(e2?.message || '상품 목록을 불러오지 못했습니다.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // 공통코드 로드
  const fetchCodes = useCallback(async () => {
    try {
      const data = await adminApi.getCommonCodes('PRODUCT_CATEGORY');
      if (Array.isArray(data) && data.length > 0) {
        setCodeOptions(
          data.map((c) => ({
            code: c.code,
            label: c.codeValue ?? c.code_value ?? c.code,
          }))
        );
      }
    } catch {
      /* fallback 유지 */
    }
  }, []);

  // 제휴사 목록 로드
  const fetchAffiliates = useCallback(async () => {
    try {
      const data = await adminApi.getAffiliates({ page: 0, size: 100 });
      const list = Array.isArray(data) ? data : (data?.content ?? []);
      setAffiliateOptions(
        list.map((a) => ({
          affiliateId: a.affiliateId,
          affiliateNm: a.affiliateNm ?? `제휴사 #${a.affiliateId}`,
        }))
      );
    } catch {
      /* 실패해도 수동 입력 폴백 */
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCodes();
    fetchAffiliates();
  }, [fetchProducts, fetchCodes, fetchAffiliates]);

  // 필터
  const filteredProducts = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return [...products]
      .sort((a, b) => Number(b.prodId ?? 0) - Number(a.prodId ?? 0))
      .filter((p) => {
        if (statusFilter !== 'all' && String(p.prodSt ?? '') !== statusFilter)
          return false;
        if (codeFilter !== 'all' && String(p.code ?? '') !== codeFilter)
          return false;
        if (!q) return true;
        return [p.prodId, p.prodNm, p.prodDesc, p.code, p.affiliateId]
          .map((v) => String(v ?? '').toLowerCase())
          .join(' ')
          .includes(q);
      });
  }, [products, statusFilter, codeFilter, keyword]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / size));
  const safePage = clamp(page, 1, totalPages);
  const pagedProducts = useMemo(() => {
    const from = (safePage - 1) * size;
    return filteredProducts.slice(from, from + size);
  }, [filteredProducts, safePage, size]);
  const pages = useMemo(
    () => windowedPages(safePage, totalPages),
    [safePage, totalPages]
  );
  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const resetFilters = () => {
    setStatusFilter('all');
    setCodeFilter('all');
    setKeyword('');
    setPage(1);
  };

  const codeLabel = (code) =>
    codeOptions.find((c) => c.code === code)?.label ?? code ?? '-';

  const affiliateName = (id) => {
    if (id == null) return '-';
    return (
      affiliateOptions.find((a) => a.affiliateId === id)?.affiliateNm ??
      `#${id}`
    );
  };

  const getBuildingStocks = (p) => {
    const bs = p.buildingStocks;
    if (!bs || typeof bs !== 'object') return [];
    return Object.entries(bs).sort(([a], [b]) => Number(a) - Number(b));
  };

  const getTotalStock = (p) => {
    const entries = getBuildingStocks(p);
    if (entries.length === 0) return p.prodStock ?? 0;
    return entries.reduce((s, [, v]) => s + Number(v ?? 0), 0);
  };

  return (
    <section className={styles.wrap}>
      {/* 상단 */}
      <div className={styles.topRow}>
        <div className={styles.titleArea}>
          <h2 className={styles.title}>룸서비스 상품 관리</h2>
          <p className={styles.sub}>
            총 <strong>{filteredProducts.length}</strong>개
          </p>
        </div>
        <div className={styles.actions}>
          <select
            className={styles.select}
            value={size}
            onChange={(e) => {
              setSize(Number(e.target.value));
              setPage(1);
            }}
          >
            {[10, 20, 30, 50].map((n) => (
              <option key={n} value={n}>
                {n}개씩
              </option>
            ))}
          </select>
          <button
            type="button"
            className={styles.btn}
            onClick={fetchProducts}
            disabled={loading}
          >
            {loading ? '불러오는 중...' : '새로고침'}
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={() => setFormModal('create')}
          >
            + 상품 등록
          </button>
        </div>
      </div>

      {/* 필터 */}
      <div className={styles.filterRow}>
        <label className={styles.filterItem}>
          <span className={styles.filterLabel}>상태</span>
          <select
            className={styles.select}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">전체</option>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.filterItem}>
          <span className={styles.filterLabel}>카테고리</span>
          <select
            className={styles.select}
            value={codeFilter}
            onChange={(e) => {
              setCodeFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">전체</option>
            {codeOptions.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.filterItem}>
          <span className={styles.filterLabel}>검색</span>
          <input
            className={styles.input}
            value={keyword}
            placeholder="ID / 상품명 / 설명 / 제휴사"
            onChange={(e) => {
              setKeyword(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <button type="button" className={styles.btn} onClick={resetFilters}>
          필터 초기화
        </button>
      </div>

      {/* 알림 */}
      <div className={styles.statusRow} aria-live="polite">
        {loading ? '상품 데이터를 불러오는 중...' : notice}
      </div>
      {error && <div className={styles.errorBox}>{error}</div>}

      {/* 테이블 */}
      {!loading && pagedProducts.length === 0 ? (
        <div className={styles.empty}>조건에 맞는 상품이 없습니다.</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: 50 }}>#</th>
                <th>상품명 / 설명</th>
                <th style={{ width: 90 }}>가격</th>
                <th style={{ width: 90 }}>카테고리</th>
                <th style={{ width: 90 }}>제휴사</th>
                <th style={{ width: 80 }}>상태</th>
                <th>건물별 재고</th>
                <th style={{ width: 100 }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {pagedProducts.map((p) => {
                const bsEntries = getBuildingStocks(p);
                const totalStock = getTotalStock(p);
                const isOpen = stockPanel === p.prodId;
                return (
                  <React.Fragment key={p.prodId}>
                    <tr
                      className={
                        p.prodSt === 'sold_out' ? styles.rowSoldOut : ''
                      }
                    >
                      {/* # */}
                      <td className={styles.tdId}>{p.prodId}</td>
                      {/* 상품명 */}
                      <td>
                        <div className={styles.prodNm}>{p.prodNm || '-'}</div>
                        <div className={styles.prodDesc}>
                          {p.prodDesc || '-'}
                        </div>
                      </td>
                      {/* 가격 */}
                      <td className={styles.tdPrice}>{fmt(p.prodPrice)}</td>
                      {/* 카테고리 */}
                      <td>
                        <CodeChip code={p.code} codeOptions={codeOptions} />
                      </td>
                      {/* 제휴사 */}
                      <td className={styles.tdCenter}>
                        {affiliateName(p.affiliateId)}
                      </td>
                      {/* 상태 */}
                      <td>
                        <StatusBadge status={p.prodSt} />
                      </td>
                      {/* 건물별 재고 */}
                      <td>
                        <div className={styles.stockSummary}>
                          <span className={styles.stockTotal}>
                            합계 {totalStock}
                          </span>
                          <div className={styles.stockChipsWrap}>
                            {bsEntries.slice(0, 3).map(([bid, stk]) => (
                              <span
                                key={bid}
                                className={`${styles.stockChip} ${Number(stk) === 0 ? styles.stockChipZero : ''}`}
                              >
                                B{bid}: {stk}
                              </span>
                            ))}
                            {bsEntries.length > 3 && (
                              <span className={styles.stockChipMore}>
                                +{bsEntries.length - 3}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            className={`${styles.btnSm} ${isOpen ? styles.btnSmActive : ''}`}
                            onClick={() =>
                              setStockPanel(isOpen ? null : p.prodId)
                            }
                          >
                            {isOpen ? '닫기' : '재고편집'}
                          </button>
                        </div>
                      </td>
                      {/* 관리 */}
                      <td>
                        <div className={styles.actionBtns}>
                          <button
                            type="button"
                            className={`${styles.btnSm} ${styles.btnEdit}`}
                            onClick={() => setFormModal(p)}
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            className={`${styles.btnSm} ${styles.btnDelete}`}
                            onClick={() => setDeleteModal(p)}
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                    {/* 건물별 재고 인라인 패널 */}
                    {isOpen && (
                      <tr>
                        <td colSpan={9} style={{ padding: 0 }}>
                          <BuildingStockPanel
                            prodId={p.prodId}
                            onClose={() => setStockPanel(null)}
                            onSaved={fetchProducts}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
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
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={safePage <= 1}
          >
            {'<'}
          </button>
          {pages.map((pg) => (
            <button
              key={pg}
              type="button"
              className={`${styles.pageBtn} ${pg === safePage ? styles.pageBtnActive : ''}`}
              onClick={() => setPage(pg)}
            >
              {pg}
            </button>
          ))}
          <button
            type="button"
            className={styles.pageBtn}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={safePage >= totalPages}
          >
            {'>'}
          </button>
        </div>
      )}

      {/* 등록/수정 모달 */}
      {formModal !== null && (
        <ProductFormModal
          product={formModal === 'create' ? null : formModal}
          codeOptions={codeOptions}
          affiliateOptions={affiliateOptions}
          onClose={() => setFormModal(null)}
          onSaved={() => {
            setFormModal(null);
            showNotice(
              formModal === 'create'
                ? '상품이 등록되었습니다.'
                : '상품이 수정되었습니다.'
            );
            fetchProducts();
          }}
        />
      )}

      {/* 삭제 확인 모달 */}
      {deleteModal !== null && (
        <DeleteConfirmModal
          product={deleteModal}
          onClose={() => setDeleteModal(null)}
          onDeleted={() => {
            setDeleteModal(null);
            showNotice('상품이 삭제되었습니다.');
            fetchProducts();
          }}
        />
      )}
    </section>
  );
}
