// features/commerce/hooks/useProducts.js
// 상품 목록 조회 + 단일 상품 상세 조회
// 인증 불필요 (공개 API)
//
// [목록 사용 예시]
// const { products, loading, error, refetch } = useProducts();
//
// [상세 사용 예시]
// const { product, loading, error, refetch } = useProduct(prodId);

import { useCallback, useEffect, useState } from 'react';
import { commerceApi } from '../api/commerceApi';

// ─── 전체 상품 목록 훅 ────────────────────────────────────────────────────────
// GET /products (on_sale 상태만 반환)
export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // ProductResponse[] 형태로 반환
      // 각 항목: { prodId, prodNm, prodPrice, prodStock, code, prodDesc, prodSt, affiliateId }
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
    fetch();
  }, [fetch]);

  return {
    products, // ProductResponse[]
    loading,
    error,
    refetch: fetch,
  };
}

// ─── 단일 상품 상세 훅 ────────────────────────────────────────────────────────
// GET /products/{prodId}
/**
 * @param {number | null} prodId - null이면 호출 안 함
 */
export function useProduct(prodId) {
  const [product, setProduct] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProduct = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      // 상품 상세 + 이미지 동시 조회
      const [productData, imageData] = await Promise.all([
        commerceApi.getProduct(id),
        commerceApi.getProductImages(id).catch(() => []), // 이미지 없어도 상품은 표시
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
    fetchProduct(prodId);
  }, [prodId, fetchProduct]);

  const refetch = useCallback(() => {
    if (!prodId) return;
    fetchProduct(prodId);
  }, [prodId, fetchProduct]);

  return {
    product, // ProductResponse | null — { prodId, prodNm, prodPrice, prodStock, code, prodDesc, prodSt, affiliateId }
    images,  // FileResponse[] — 상품 이미지 목록
    loading,
    error,
    refetch,
  };
}
