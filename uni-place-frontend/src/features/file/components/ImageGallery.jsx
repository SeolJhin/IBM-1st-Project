// features/file/components/ImageGallery.jsx
import React, { useState } from 'react';
import { toApiImageUrl } from '../api/fileApi';
import styles from './ImageGallery.module.css';

const IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

function isImage(f) {
  const ext = (f?.fileType || '').toLowerCase();
  return IMAGE_EXTS.includes(ext) || ext.startsWith('image/');
}

/**
 * 공용 이미지 갤러리 컴포넌트
 *
 * Props:
 *   files          FileResponse[]
 *   placeholder    ReactNode  (이미지 없을 때 표시)
 */
export default function ImageGallery({ files = [], placeholder }) {
  const [active, setActive] = useState(0);
  const images = files.filter(isImage);

  if (!images.length) {
    return placeholder ? (
      <>{placeholder}</>
    ) : (
      <div className={styles.placeholder}>
        <span>🏠</span>
        <p>등록된 사진이 없습니다</p>
      </div>
    );
  }

  return (
    <div className={styles.gallery}>
      <div className={styles.main}>
        <img
          src={toApiImageUrl(
            images[active]?.viewUrl || images[active]?.adminViewUrl
          )}
          alt={`사진 ${active + 1}`}
        />
      </div>
      {images.length > 1 && (
        <div className={styles.thumbs}>
          {images.map((img, i) => (
            <button
              key={img.fileId ?? i}
              type="button"
              className={`${styles.thumb} ${i === active ? styles.thumbActive : ''}`}
              onClick={() => setActive(i)}
            >
              <img
                src={toApiImageUrl(img.viewUrl || img.adminViewUrl)}
                alt={`썸네일 ${i + 1}`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
