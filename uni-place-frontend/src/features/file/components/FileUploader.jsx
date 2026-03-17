// features/file/components/FileUploader.jsx
import React, { useRef } from 'react';
import { toApiImageUrl } from '../api/fileApi';
import styles from './FileUploader.module.css';

export default function FileUploader({
  existingFiles = [],
  newFiles = [],
  previews = [],
  deleteFileIds = [],
  existingOrder = null,
  addFiles,
  removeNewFile,
  moveNewFile,
  toggleDeleteExisting,
  moveExisting,
  maxCount = 10,
  accept = 'image/*',
  label = '이미지',
}) {
  const inputRef = useRef(null);
  const dragSrc = useRef(null);

  // 기존 파일을 existingOrder 기준으로 정렬
  const orderedExisting = existingOrder
    ? [...existingFiles].sort(
        (a, b) =>
          existingOrder.indexOf(a.fileId) - existingOrder.indexOf(b.fileId)
      )
    : existingFiles;

  const allCount =
    orderedExisting.filter((f) => !deleteFileIds.includes(f.fileId)).length +
    newFiles.length;
  const remaining = maxCount - allCount;

  // 드래그 핸들러 — 기존 파일
  const handleExistingDragStart = (e, idx) => {
    dragSrc.current = { type: 'existing', idx };
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleExistingDrop = (e, toIdx) => {
    e.preventDefault();
    if (!dragSrc.current) return;
    if (dragSrc.current.type === 'existing') {
      moveExisting?.(dragSrc.current.idx, toIdx);
    }
    dragSrc.current = null;
  };

  // 드래그 핸들러 — 새 파일
  const handleNewDragStart = (e, idx) => {
    dragSrc.current = { type: 'new', idx };
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleNewDrop = (e, toIdx) => {
    e.preventDefault();
    if (!dragSrc.current) return;
    if (dragSrc.current.type === 'new') {
      moveNewFile?.(dragSrc.current.idx, toIdx);
    }
    dragSrc.current = null;
  };

  return (
    <div className={styles.wrap}>
      {/* ── 기존 이미지 ── */}
      {orderedExisting.length > 0 && (
        <div className={styles.section}>
          <p className={styles.sectionLabel}>
            기존 {label} — 드래그로 순서 변경 · 클릭하면 삭제 표시
          </p>
          <div className={styles.grid}>
            {orderedExisting.map((f, idx) => {
              const marked = deleteFileIds.includes(f.fileId);
              const isThumbnail = idx === 0;
              return (
                <div
                  key={f.fileId}
                  className={`${styles.thumbWrap} ${marked ? styles.thumbDeleted : ''}`}
                  draggable
                  onDragStart={(e) => handleExistingDragStart(e, idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleExistingDrop(e, idx)}
                  onClick={() => toggleDeleteExisting(f.fileId)}
                  title={marked ? '클릭하면 삭제 취소' : '클릭하면 삭제 표시'}
                >
                  <div className={styles.thumb}>
                    <img
                      src={toApiImageUrl(f.viewUrl || f.adminViewUrl)}
                      alt={f.originFilename}
                    />
                    {marked && <div className={styles.deleteOverlay}>삭제</div>}
                  </div>
                  {isThumbnail && (
                    <div className={styles.thumbnailBadge}>썸네일</div>
                  )}
                  <div className={styles.orderBadge}>{idx + 1}</div>
                  <div className={styles.moveRow}>
                    <button
                      type="button"
                      className={styles.moveBtn}
                      disabled={idx === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        moveExisting?.(idx, idx - 1);
                      }}
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      className={styles.moveBtn}
                      disabled={idx === orderedExisting.length - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        moveExisting?.(idx, idx + 1);
                      }}
                    >
                      →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 새 파일 미리보기 ── */}
      {previews.length > 0 && (
        <div className={styles.section}>
          <p className={styles.sectionLabel}>
            추가할 {label} — 드래그로 순서 변경
            {orderedExisting.filter((f) => !deleteFileIds.includes(f.fileId))
              .length === 0 && ' (첫 번째가 썸네일)'}
          </p>
          <div className={styles.grid}>
            {previews.map((src, i) => {
              const existingActiveCount = orderedExisting.filter(
                (f) => !deleteFileIds.includes(f.fileId)
              ).length;
              const isThumbnail = existingActiveCount === 0 && i === 0;
              return (
                <div
                  key={i}
                  className={styles.thumbWrap}
                  draggable
                  onDragStart={(e) => handleNewDragStart(e, i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleNewDrop(e, i)}
                >
                  <div className={styles.thumb}>
                    <img src={src} alt={`미리보기 ${i + 1}`} />
                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={() => removeNewFile(i)}
                    >
                      ✕
                    </button>
                  </div>
                  {isThumbnail && (
                    <div className={styles.thumbnailBadge}>썸네일</div>
                  )}
                  <div className={styles.orderBadge}>
                    {existingActiveCount + i + 1}
                  </div>
                  <div className={styles.moveRow}>
                    <button
                      type="button"
                      className={styles.moveBtn}
                      disabled={i === 0}
                      onClick={() => moveNewFile?.(i, i - 1)}
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      className={styles.moveBtn}
                      disabled={i === previews.length - 1}
                      onClick={() => moveNewFile?.(i, i + 1)}
                    >
                      →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 파일 추가 버튼 ── */}
      {remaining > 0 && (
        <button
          type="button"
          className={styles.addBtn}
          onClick={() => inputRef.current?.click()}
        >
          + {label} 추가 ({allCount}/{maxCount})
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
