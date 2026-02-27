import React from 'react';
import { AdminEndpointDetailProbe } from '../../components/AdminEndpointProbe';
import { adminApi } from '../../api/adminApi';

export default function AdminProductDetail() {
  return (
    <AdminEndpointDetailProbe
      title="Admin Product Detail"
      idLabel="Product ID"
      fetcher={async (id) => ({
        product: await adminApi.getProduct(id),
        images: await adminApi.getProductImages(id),
      })}
      parseId={(v) => (v === '' ? '' : Number(v))}
    />
  );
}
