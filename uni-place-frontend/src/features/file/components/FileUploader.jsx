// features/file/components/FileUploader.jsx
import React, { useRef } from 'react';
import { toApiImageUrl } from '../api/fileApi';
import styles from './FileUploader.module.css';

/**
 * 파일 업로드 공용 컴포넌트
 *
 * Props:
 *   existingFiles    FileResponse[]   기존 업로드된 파일 목록
 *   newFiles         File[]           새로 선택한 파일 목록
 *   previews         string[]         새 파일 미리보기 URL
 *   deleteFileIds    number[]         삭제 예정인 기존 파일 ID
 *   addFiles         (FileList) => void
 *   removeNewFile    (index) => void
 *   toggleDeleteExisting (fileId) => void
 *   maxCount         number  (기본 10)
 *   accept           string  (기본 'image/*')
 *   label            string  (기본 '이미지')
 */
export default function FileUploader({
  existingFiles = [],
  newFiles = [],
  previews = [],
  deleteFileIds = [],
  addFiles,
  removeNewFile,
  toggleDeleteExisting,
  maxCount = 10,
  accept = 'image/*',
  label = '이미지',
}) {
  const inputRef = useRef(null);
  const remaining = maxCount - newFiles.length;

  return (
    <div className={styles.wrap}>
      {/* 기존 이미지 */}
      {existingFiles.length > 0 && (
        <div className={styles.section}>
          <p className={styles.sectionLabel}>
            기존 {label} (클릭하면 삭제 표시)
          </p>
          <div className={styles.grid}>
            {existingFiles.map((f) => {
              const marked = deleteFileIds.includes(f.fileId);
              return (
                <div
                  key={f.fileId}
                  className={`${styles.thumb} ${marked ? styles.thumbDeleted : ''}`}
                  onClick={() => toggleDeleteExisting(f.fileId)}
                  title={marked ? '클릭하면 삭제 취소' : '클릭하면 삭제 표시'}
                >
                  <img
                    src={toApiImageUrl(f.viewUrl || f.adminViewUrl)}
                    alt={f.originFilename}
                  />
                  {marked && <div className={styles.deleteOverlay}>삭제</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 새 파일 미리보기 */}
      {previews.length > 0 && (
        <div className={styles.section}>
          <p className={styles.sectionLabel}>추가할 {label}</p>
          <div className={styles.grid}>
            {previews.map((src, i) => (
              <div key={i} className={styles.thumb}>
                <img src={src} alt={`미리보기 ${i + 1}`} />
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => removeNewFile(i)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 파일 선택 버튼 */}
      {remaining > 0 && (
        <button
          type="button"
          className={styles.addBtn}
          onClick={() => inputRef.current?.click()}
        >
          + {label} 추가 ({newFiles.length}/{maxCount})
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        style={{ display: 'none' }}
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}
