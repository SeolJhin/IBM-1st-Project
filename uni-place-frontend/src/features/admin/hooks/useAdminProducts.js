// src/features/admin/hooks/useAdminProducts.js
//
// 관리자 상품 관리 훅 모음
// 백엔드: AdminProductController (/admin/products)
//
// ── 훅 목록 ───────────────────────────────────────────────────────────────────
//
// [상품 목록]
// useAdminProductList()
//   → 공개 API GET /products 사용 (관리자 전용 목록 GET 없음)
//   → on_sale 상태만 반환됨 (백엔드 스펙)
//   → { products, loading, error, refetch }
//
// [상품 상세]
// useAdminProductDetail(prodId)
//   → 공개 API GET /products/{prodId} + GET /products/{prodId}/images
//   → { product, images, loading, error, refetch }
//
// [상품 생성]
// useAdminProductCreate()
//   → POST /admin/products (JSON)
//   → { createProduct, loading, error }
//   → createProduct(body) 반환값: 생성된 prodId (number)
//
// [상품 수정]
// useAdminProductUpdate()
//   → PUT /admin/products/{prodId} (JSON, 전체 필드 교체)
//   → { updateProduct, loading, error }
//
// [상품 상태 변경]
// useAdminProductStatus()
//   → PATCH /admin/products/{prodId}/status
//   → { changeStatus, loading, error }
//   → changeStatus(prodId, 'ON_SALE' | 'OUT_OF_STOCK' | 'DISCONTINUED')
//
// [상품 삭제]
// useAdminProductDelete()
//   → DELETE /admin/products/{prodId}
//   → { deleteProduct, loading, error }
//
// [이미지 관리]
// useAdminProductImages(prodId)
//   → GET    /admin/products/{prodId}/images
//   → POST   /admin/products/{prodId}/images   (복수 업로드)
//   → PUT    /admin/products/{prodId}/image    (대표 이미지 교체)
//   → DELETE /admin/products/{prodId}/images   (body: fileId[])
//   → { images, loading, error, upload, replace, remove, refetch }
//
// ─────────────────────────────────────────────────────────────────────────────
//
// ProductStatus (백엔드 enum)
//   'ON_SALE'       — 판매 중
//   'OUT_OF_STOCK'  — 품절
//   'DISCONTINUED'  — 판매 종료
//
// ProductCreateRequest / ProductUpdateRequest 공통 필드:
//   prodNm: string       — 상품명 (필수)
//   prodPrice: number    — 가격 (필수)
//   prodStock: number    — 재고 수량 (필수)
//   code?: string        — 상품 코드 (선택)
//   prodDesc?: string    — 상품 설명 (선택)
//   prodSt: string       — 상품 상태 ProductStatus (필수)
//   affiliateId?: number — 제휴사 ID (선택)

import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../api/adminApi';
import { commerceApi } from '../../commerce/api/commerceApi';

// ─── 상품 목록 ────────────────────────────────────────────────────────────────
// 공개 GET /products 사용 (on_sale 상태만 반환)
export function useAdminProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // AdminProductController에 목록 GET 없으므로 공개 API 사용
      // ProductResponse[]: { prodId, prodNm, prodPrice, prodStock, code, prodDesc, prodSt, affiliateId }
      const data = await commerceApi.getProducts();
      setProducts(data ?? []);
    } catch (err) {
      setError(err?.message || '상품 목록을 불러오는 데 실패했습니다.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products, // ProductResponse[]
    loading,
    error,
    refetch: fetchProducts,
  };
}

// ─── 상품 상세 ────────────────────────────────────────────────────────────────
// 공개 GET /products/{prodId} + GET /products/{prodId}/images
/**
 * @param {number | null} prodId — null이면 호출하지 않음
 */
export function useAdminProductDetail(prodId) {
  const [product, setProduct] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDetail = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      // 상품 상세 + 이미지 동시 조회
      const [productData, imageData] = await Promise.all([
        commerceApi.getProduct(id),
        // 이미지는 없어도 상품 표시는 가능
        adminApi.getProductImages(id).catch(() => []),
      ]);
      setProduct(productData ?? null);
      setImages(imageData ?? []);
    } catch (err) {
      setError(err?.message || '상품 정보를 불러오는 데 실패했습니다.');
      setProduct(null);
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!prodId) return;
    fetchDetail(prodId);
  }, [prodId, fetchDetail]);

  const refetch = useCallback(() => {
    if (!prodId) return;
    fetchDetail(prodId);
  }, [prodId, fetchDetail]);

  return {
    product, // ProductResponse | null
    images, // FileResponse[]
    loading,
    error,
    refetch,
  };
}

// ─── 상품 생성 ────────────────────────────────────────────────────────────────
// POST /admin/products
export function useAdminProductCreate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * @param {{
   *   prodNm: string,
   *   prodPrice: number,
   *   prodStock: number,
   *   code?: string,
   *   prodDesc?: string,
   *   prodSt: 'on_sale' | 'OUT_OF_STOCK' | 'DISCONTINUED',
   *   affiliateId?: number
   * }} body — ProductCreateRequest
   * @returns {Promise<number>} 생성된 prodId
   */
  const createProduct = useCallback(async (body) => {
    setLoading(true);
    setError(null);
    try {
      const prodId = await adminApi.createProduct(body);
      return prodId;
    } catch (err) {
      setError(err?.message || '상품 생성에 실패했습니다.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createProduct, // createProduct(body) → prodId (number)
    loading,
    error,
  };
}

// ─── 상품 수정 ────────────────────────────────────────────────────────────────
// PUT /admin/products/{prodId}
export function useAdminProductUpdate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * 전체 필드 교체 (PUT)
   * @param {number} prodId
   * @param {{
   *   prodNm: string,
   *   prodPrice: number,
   *   prodStock: number,
   *   code?: string,
   *   prodDesc?: string,
   *   prodSt: 'on_sale' | 'OUT_OF_STOCK' | 'DISCONTINUED',
   *   affiliateId?: number
   * }} body — ProductUpdateRequest
   * @returns {Promise<null>}
   */
  const updateProduct = useCallback(async (prodId, body) => {
    setLoading(true);
    setError(null);
    try {
      await adminApi.updateProduct(prodId, body);
    } catch (err) {
      setError(err?.message || '상품 수정에 실패했습니다.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    updateProduct, // updateProduct(prodId, body) → void
    loading,
    error,
  };
}

// ─── 상품 상태 변경 ───────────────────────────────────────────────────────────
// PATCH /admin/products/{prodId}/status
export function useAdminProductStatus() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * @param {number} prodId
   * @param {'on_sale' | 'OUT_OF_STOCK' | 'DISCONTINUED'} status
   * @returns {Promise<null>}
   */
  const changeStatus = useCallback(async (prodId, status) => {
    setLoading(true);
    setError(null);
    try {
      await adminApi.changeProductStatus(prodId, status);
    } catch (err) {
      setError(err?.message || '상품 상태 변경에 실패했습니다.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    changeStatus, // changeStatus(prodId, status) → void
    loading,
    error,
  };
}

// ─── 상품 삭제 ────────────────────────────────────────────────────────────────
// DELETE /admin/products/{prodId}
export function useAdminProductDelete() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * @param {number} prodId
   * @returns {Promise<null>}
   */
  const deleteProduct = useCallback(async (prodId) => {
    setLoading(true);
    setError(null);
    try {
      await adminApi.deleteProduct(prodId);
    } catch (err) {
      setError(err?.message || '상품 삭제에 실패했습니다.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    deleteProduct, // deleteProduct(prodId) → void
    loading,
    error,
  };
}

// ─── 상품 이미지 관리 ─────────────────────────────────────────────────────────
// GET    /admin/products/{prodId}/images
// POST   /admin/products/{prodId}/images
// PUT    /admin/products/{prodId}/image
// DELETE /admin/products/{prodId}/images
/**
 * @param {number | null} prodId — null이면 이미지 목록 조회 안 함
 */
export function useAdminProductImages(prodId) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  // ── 이미지 목록 조회 ──────────────────────────────────────────────────────
  const fetchImages = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      // FileResponse[]: { fileId, filePath, fileNm, fileSize, ... }
      const data = await adminApi.getProductImages(id);
      setImages(data ?? []);
    } catch (err) {
      setError(err?.message || '이미지 목록을 불러오는 데 실패했습니다.');
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!prodId) return;
    fetchImages(prodId);
  }, [prodId, fetchImages]);

  const refetch = useCallback(() => {
    if (!prodId) return;
    fetchImages(prodId);
  }, [prodId, fetchImages]);

  // ── 공통 액션 래퍼 ────────────────────────────────────────────────────────
  const runAction = useCallback(
    async (apiFn) => {
      setActionLoading(true);
      setActionError(null);
      try {
        const result = await apiFn();
        // 성공 후 이미지 목록 재조회
        if (prodId) await fetchImages(prodId);
        return result;
      } catch (err) {
        setActionError(err?.message || '이미지 처리에 실패했습니다.');
        throw err;
      } finally {
        setActionLoading(false);
      }
    },
    [prodId, fetchImages]
  );

  // ── 이미지 복수 업로드 ────────────────────────────────────────────────────
  // form-data key: "files"
  /**
   * @param {File[]} files
   * @returns {Promise<FileUploadResponse>}
   */
  const upload = useCallback(
    (files) => runAction(() => adminApi.uploadProductImages(prodId, files)),
    [prodId, runAction]
  );

  // ── 대표 이미지 교체 (기존 전체 soft delete 후 1장 업로드) ────────────────
  // form-data key: "file"
  /**
   * @param {File} file
   * @returns {Promise<FileUploadResponse>}
   */
  const replace = useCallback(
    (file) => runAction(() => adminApi.replaceProductMainImage(prodId, file)),
    [prodId, runAction]
  );

  // ── 이미지 삭제 (soft delete) ─────────────────────────────────────────────
  /**
   * @param {number[]} fileIds
   * @returns {Promise<null>}
   */
  const remove = useCallback(
    (fileIds) => runAction(() => adminApi.deleteProductImages(prodId, fileIds)),
    [prodId, runAction]
  );

  return {
    images, // FileResponse[]
    loading, // 목록 조회 로딩
    error, // 목록 조회 에러
    actionLoading, // 업로드/교체/삭제 중 로딩
    actionError, // 업로드/교체/삭제 에러
    upload, // upload(File[]) — 복수 업로드
    replace, // replace(File)  — 대표 이미지 교체
    remove, // remove(fileIds) — 이미지 soft delete
    refetch,
  };
}
