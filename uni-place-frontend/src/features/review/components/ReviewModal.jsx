// features/review/components/ReviewModal.jsx
// mode: 'detail' | 'write' | 'edit'
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { reviewApi } from '../api/reviewApi';
import { toApiImageUrl } from '../../file/api/fileApi';
import { useAuth } from '../../user/hooks/useAuth';
import styles from './ReviewModal.module.css';

/* ── 별점 표시 ── */
function StarRating({ value = 0, size = 'md' }) {
  const sz = size === 'lg' ? 22 : size === 'sm' ? 14 : 18;
  return (
    <span className={styles.stars} style={{ fontSize: sz }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className={s <= Math.round(value) ? styles.starOn : styles.starOff}
        >
          ★
        </span>
      ))}
    </span>
  );
}

/* ── 별점 선택기 ── */
function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  const labels = [
    '',
    '별로예요',
    '그저 그래요',
    '보통이에요',
    '좋아요',
    '최고예요',
  ];
  return (
    <div>
      <div className={styles.starPickerRow}>
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            className={`${styles.starPickBtn} ${s <= (hover || value) ? styles.starPickOn : styles.starPickOff}`}
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(s)}
            aria-label={`별점 ${s}점`}
          >
            ★
          </button>
        ))}
        {(hover || value) > 0 && (
          <span className={styles.starLabel}>{labels[hover || value]}</span>
        )}
      </div>
    </div>
  );
}

/* ── 라이트박스 ── */
function Lightbox({ images, index, onClose }) {
  const [cur, setCur] = useState(index);
  useEffect(() => {
    setCur(index);
  }, [index]);
  return (
    <div className={styles.lightbox} onClick={onClose}>
      <button className={styles.lbClose} onClick={onClose}>
        ×
      </button>
      {images.length > 1 && (
        <button
          className={styles.lbNav}
          style={{ left: 16 }}
          onClick={(e) => {
            e.stopPropagation();
            setCur((i) => (i - 1 + images.length) % images.length);
          }}
        >
          ‹
        </button>
      )}
      <img
        src={images[cur]}
        alt={`리뷰 이미지 ${cur + 1}`}
        onClick={(e) => e.stopPropagation()}
        className={styles.lbImg}
      />
      {images.length > 1 && (
        <button
          className={styles.lbNav}
          style={{ right: 16 }}
          onClick={(e) => {
            e.stopPropagation();
            setCur((i) => (i + 1) % images.length);
          }}
        >
          ›
        </button>
      )}
      {images.length > 1 && (
        <div className={styles.lbDots}>
          {images.map((_, i) => (
            <span
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                setCur(i);
              }}
              className={`${styles.lbDot} ${i === cur ? styles.lbDotActive : ''}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── 메인 모달 ── */
/**
 * Props:
 *  mode: 'detail' | 'write' | 'edit'
 *  reviewId: (detail/edit 시)
 *  roomId: (write 시)
 *  onClose: () => void
 *  onSaved: () => void   작성/수정/삭제 성공 후 콜백
 */
export default function ReviewModal({
  mode: initialMode,
  reviewId: initReviewId,
  roomId,
  onClose,
  onSaved,
}) {
  const { user } = useAuth();
  const isAdmin = String(user?.userRole ?? '').toLowerCase() === 'admin';
  const isTenant = String(user?.userRole ?? '').toLowerCase() === 'tenant';

  const [mode, setMode] = useState(initialMode);
  const [reviewId, setReviewId] = useState(initReviewId);

  // 상세 데이터
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  // 작성/수정 폼
  const [rating, setRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewCtnt, setReviewCtnt] = useState('');
  const [deleteFiles, setDeleteFiles] = useState(false);
  const [newFiles, setNewFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formErr, setFormErr] = useState('');
  const fileInputRef = useRef();

  // 상세 로드
  const loadDetail = useCallback(
    async (id) => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await reviewApi.getDetail(id);
        setReview(data);
        if (mode === 'edit') {
          setRating(data.rating ?? 0);
          setReviewTitle(data.reviewTitle ?? '');
          setReviewCtnt(data.reviewCtnt ?? '');
        }
      } catch (e) {
        setFormErr(e.message || '불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    },
    [mode]
  );

  useEffect(() => {
    if ((mode === 'detail' || mode === 'edit') && reviewId)
      loadDetail(reviewId);
  }, [mode, reviewId, loadDetail]);

  // 파일 추가
  const handleAddFiles = (e) => {
    const files = Array.from(e.target.files || []);
    const remaining = 5 - newFiles.length;
    const toAdd = files.slice(0, remaining);
    setNewFiles((prev) => [...prev, ...toAdd]);
    setPreviews((prev) => [
      ...prev,
      ...toAdd.map((f) => URL.createObjectURL(f)),
    ]);
    e.target.value = '';
  };
  const removeNewFile = (idx) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[idx]);
      return prev.filter((_, i) => i !== idx);
    });
  };

  // 제출
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErr('');
    if (rating === 0) {
      setFormErr('별점을 선택해 주세요.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'edit') {
        await reviewApi.update(
          reviewId,
          { rating, reviewTitle, reviewCtnt },
          deleteFiles,
          newFiles
        );
      } else {
        if (!roomId) {
          setFormErr('roomId가 없습니다.');
          setSubmitting(false);
          return;
        }
        await reviewApi.create(
          { roomId: Number(roomId), rating, reviewTitle, reviewCtnt },
          newFiles
        );
      }
      onSaved?.();
      onClose();
    } catch (err) {
      const code = err?.errorCode || '';
      const MAP = {
        REVIEW_409: '이미 이 방에 리뷰를 작성하셨습니다.',
        REVIEW_403_1: '입주자만 리뷰를 작성·수정할 수 있습니다.',
      };
      setFormErr(MAP[code] || err?.message || '저장에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // 삭제
  const handleDelete = async () => {
    if (!window.confirm('리뷰를 삭제할까요?')) return;
    setSubmitting(true);
    try {
      await reviewApi.remove(reviewId);
      onSaved?.();
      onClose();
    } catch (e) {
      setFormErr(e.message || '삭제 실패');
    } finally {
      setSubmitting(false);
    }
  };

  // 이미지 파일 필터
  const IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
  const imageFiles = (review?.files ?? []).filter((f) => {
    const t = (f.fileType || '').toLowerCase();
    return IMAGE_EXTS.includes(t) || t.startsWith('image/');
  });
  const imageUrls = imageFiles.map((f) => toApiImageUrl(f.viewUrl));

  // ESC 닫기
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const renderDetail = () => (
    <div className={styles.detailBody}>
      {/* 건물/방 배지 */}
      {(review.buildingNm || review.roomNo) && (
        <div className={styles.roomBadge}>
          {review.buildingNm && (
            <span className={styles.buildingBadge}>{review.buildingNm}</span>
          )}
          {review.roomNo && (
            <span className={styles.roomNoBadge}>{review.roomNo}호</span>
          )}
        </div>
      )}
      {/* 별점 + 작성자 */}
      <div className={styles.detailMeta}>
        <StarRating value={review.rating} size="lg" />
        <span className={styles.ratingNum}>{review.rating}.0</span>
        <span className={styles.authorName}>{review.userId ?? '-'}</span>
        <span className={styles.detailDate}>
          {review.createdAt
            ? new Date(review.createdAt).toLocaleDateString('ko-KR')
            : ''}
        </span>
      </div>
      {/* 제목 */}
      {review.reviewTitle && (
        <h3 className={styles.detailTitle}>{review.reviewTitle}</h3>
      )}
      {/* 이미지 */}
      {imageUrls.length > 0 && (
        <div className={styles.imgGrid}>
          {imageUrls.map((url, idx) => (
            <img
              key={idx}
              src={url}
              alt={`리뷰 이미지 ${idx + 1}`}
              className={styles.reviewImg}
              onClick={() => setLightbox(idx)}
            />
          ))}
        </div>
      )}
      {/* 내용 */}
      {review.reviewCtnt && (
        <p className={styles.detailContent}>{review.reviewCtnt}</p>
      )}
      {/* 본인 또는 어드민 액션 */}
      <div className={styles.detailActions}>
        {isTenant && user?.userId === review.realUserId && (
          <>
            <button
              type="button"
              className={styles.editBtn}
              onClick={() => {
                setMode('edit');
              }}
            >
              수정
            </button>
            <button
              type="button"
              className={styles.deleteBtn}
              onClick={handleDelete}
              disabled={submitting}
            >
              삭제
            </button>
          </>
        )}
        {isAdmin && (
          <button
            type="button"
            className={styles.adminDeleteBtn}
            onClick={handleDelete}
            disabled={submitting}
          >
            🗑 관리자 삭제
          </button>
        )}
      </div>
    </div>
  );

  const renderForm = () => (
    <form className={styles.form} onSubmit={handleSubmit}>
      {/* 별점 */}
      <div className={styles.fieldGroup}>
        <span className={styles.fieldLabel}>
          별점 <span className={styles.req}>*</span>
        </span>
        <StarPicker value={rating} onChange={setRating} />
      </div>
      {/* 제목 */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel} htmlFor="rm-title">
          제목
        </label>
        <input
          id="rm-title"
          className={styles.input}
          type="text"
          placeholder="제목을 입력하세요 (선택)"
          value={reviewTitle}
          maxLength={100}
          onChange={(e) => setReviewTitle(e.target.value)}
        />
        <span className={styles.charCount}>{reviewTitle.length} / 100</span>
      </div>
      {/* 내용 */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel} htmlFor="rm-ctnt">
          내용
        </label>
        <textarea
          id="rm-ctnt"
          className={styles.textarea}
          placeholder="리뷰 내용을 입력하세요 (선택)"
          value={reviewCtnt}
          maxLength={3000}
          onChange={(e) => setReviewCtnt(e.target.value)}
        />
        <span className={styles.charCount}>{reviewCtnt.length} / 3000</span>
      </div>
      {/* 사진 */}
      <div className={styles.fieldGroup}>
        <span className={styles.fieldLabel}>사진</span>
        {mode === 'edit' && review?.fileCk === 'Y' && (
          <label className={styles.deleteFilesLabel}>
            <input
              type="checkbox"
              checked={deleteFiles}
              onChange={(e) => setDeleteFiles(e.target.checked)}
            />
            <span>기존 사진 모두 삭제</span>
          </label>
        )}
        <div className={styles.imageRow}>
          {previews.map((url, idx) => (
            <div key={idx} className={styles.previewWrap}>
              <img src={url} alt="" className={styles.previewImg} />
              <button
                type="button"
                className={styles.removeImgBtn}
                onClick={() => removeNewFile(idx)}
              >
                ×
              </button>
            </div>
          ))}
          {newFiles.length < 5 && (
            <button
              type="button"
              className={styles.addImgBtn}
              onClick={() => fileInputRef.current?.click()}
            >
              <span className={styles.addImgIcon}>📷</span>
              <span>사진 추가</span>
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={handleAddFiles}
        />
      </div>
      {formErr && <p className={styles.formErr}>{formErr}</p>}
      <button type="submit" className={styles.submitBtn} disabled={submitting}>
        {submitting
          ? '저장 중...'
          : mode === 'edit'
            ? '수정 완료'
            : '리뷰 등록'}
      </button>
    </form>
  );

  const titleMap = {
    detail: '리뷰 상세',
    write: '리뷰 작성',
    edit: '리뷰 수정',
  };

  return (
    <>
      {/* 오버레이 */}
      <div className={styles.overlay} onClick={onClose} />

      {/* 라이트박스 (오버레이 위) */}
      {lightbox !== null && (
        <Lightbox
          images={imageUrls}
          index={lightbox}
          onClose={() => setLightbox(null)}
        />
      )}

      {/* 모달 패널 */}
      <div className={styles.modal} role="dialog" aria-modal="true">
        {/* 헤더 */}
        <div className={styles.modalHeader}>
          {mode === 'edit' && (
            <button
              type="button"
              className={styles.backInModal}
              onClick={() => {
                setMode('detail');
              }}
            >
              ←
            </button>
          )}
          <h2 className={styles.modalTitle}>{titleMap[mode]}</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            ×
          </button>
        </div>

        {/* 바디 */}
        <div className={styles.modalBody}>
          {loading ? (
            <div className={styles.centerBox}>
              <span className={styles.spinner} />
            </div>
          ) : mode === 'detail' && review ? (
            renderDetail()
          ) : mode === 'write' || mode === 'edit' ? (
            renderForm()
          ) : formErr ? (
            <p className={styles.formErr}>{formErr}</p>
          ) : null}
        </div>
      </div>
    </>
  );
}
