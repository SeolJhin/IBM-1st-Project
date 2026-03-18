// features/review/pages/ReviewWrite.jsx
// 리뷰 작성: /reviews/write?roomId=xxx
// 리뷰 수정: /reviews/:reviewId/edit
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useReviewActions, useReviewDetail } from '../hooks/useReviews';
import FileUploader from '../../file/components/FileUploader';
import useFileUpload from '../../file/hooks/useFileUpload';
import styles from './ReviewWrite.module.css';
import { validateTitle } from '../../../shared/utils/validators';

const MAX_TITLE = 100;
const MAX_CTNT = 3000;

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className={styles.starPicker}>
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          className={`${styles.starPickBtn} ${s <= (hover || value) ? styles.starOn : styles.starOff}`}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
          aria-label={`별점 ${s}점`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function ReviewWrite() {
  const navigate = useNavigate();
  const { reviewId } = useParams();
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('roomId');

  const isEdit = Boolean(reviewId);

  const { review: existing, loading: loadingExisting } = useReviewDetail(
    isEdit ? Number(reviewId) : null
  );
  const { create, update, submitting, error } = useReviewActions();

  const [rating, setRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewCtnt, setReviewCtnt] = useState('');
  const [deleteFiles, setDeleteFiles] = useState(false);
  const [validErr, setValidErr] = useState('');
  const fu = useFileUpload({ maxCount: 5 });

  useEffect(() => {
    if (isEdit && existing) {
      setRating(existing.rating ?? 0);
      setReviewTitle(existing.reviewTitle ?? '');
      setReviewCtnt(existing.reviewCtnt ?? '');
    }
  }, [isEdit, existing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidErr('');

    if (rating === 0) {
      setValidErr('별점을 선택해 주세요.');
      return;
    }
    // 제목 입력된 경우에만 길이 검사 (선택 항목)
    if (reviewTitle && reviewTitle.trim().length > 100) {
      setValidErr('제목은 100자 이하로 입력해주세요.');
      return;
    }
    // 내용 입력된 경우 최소 5자
    if (
      reviewCtnt &&
      reviewCtnt.trim().length > 0 &&
      reviewCtnt.trim().length < 5
    ) {
      setValidErr('내용은 5자 이상 입력해주세요.');
      return;
    }

    if (isEdit) {
      const ok = await update(
        Number(reviewId),
        { rating, reviewTitle, reviewCtnt },
        deleteFiles,
        fu.newFiles
      );
      if (ok) navigate(`/reviews/${reviewId}`, { replace: true });
    } else {
      if (!roomId) {
        setValidErr('roomId가 없습니다.');
        return;
      }
      const ok = await create(
        { roomId: Number(roomId), rating, reviewTitle, reviewCtnt },
        fu.newFiles
      );
      if (ok) navigate('/reviews/my', { replace: true });
    }
  };

  if (isEdit && loadingExisting) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingWrap}>
          <span className={styles.spinner} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button
          className={styles.backBtn}
          type="button"
          onClick={() => navigate(-1)}
        >
          ←
        </button>
        <h1 className={styles.title}>{isEdit ? '리뷰 수정' : '리뷰 작성'}</h1>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        {/* 별점 */}
        <div className={styles.fieldGroup}>
          <span className={styles.label}>
            별점 <span className={styles.required}>*</span>
          </span>
          <StarPicker value={rating} onChange={setRating} />
          {rating > 0 && (
            <span className={styles.ratingLabel}>
              {
                [
                  '',
                  '별로예요',
                  '그저 그래요',
                  '보통이에요',
                  '좋아요',
                  '최고예요',
                ][rating]
              }
            </span>
          )}
        </div>

        {/* 제목 */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="reviewTitle">
            제목
          </label>
          <input
            id="reviewTitle"
            className={styles.input}
            type="text"
            placeholder="제목을 입력하세요 (선택)"
            value={reviewTitle}
            maxLength={MAX_TITLE}
            onChange={(e) => setReviewTitle(e.target.value)}
          />
          <span className={styles.charCount}>
            {reviewTitle.length} / {MAX_TITLE}
          </span>
        </div>

        {/* 내용 */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="reviewCtnt">
            내용
          </label>
          <textarea
            id="reviewCtnt"
            className={styles.textarea}
            placeholder="리뷰 내용을 입력하세요 (선택)"
            value={reviewCtnt}
            maxLength={MAX_CTNT}
            onChange={(e) => setReviewCtnt(e.target.value)}
          />
          <span className={styles.charCount}>
            {reviewCtnt.length} / {MAX_CTNT}
          </span>
        </div>

        {/* 사진 */}
        <div className={styles.fieldGroup}>
          <span className={styles.label}>사진</span>
          {isEdit && existing?.fileCk === 'Y' && (
            <div className={styles.deleteFilesRow}>
              <input
                id="deleteFiles"
                type="checkbox"
                checked={deleteFiles}
                onChange={(e) => setDeleteFiles(e.target.checked)}
              />
              <label htmlFor="deleteFiles">기존 사진 모두 삭제</label>
            </div>
          )}
          <FileUploader
            newFiles={fu.newFiles}
            previews={fu.previews}
            deleteFileIds={fu.deleteFileIds}
            addFiles={fu.addFiles}
            removeNewFile={fu.removeNewFile}
            moveNewFile={fu.moveNewFile}
            toggleDeleteExisting={fu.toggleDeleteExisting}
            maxCount={5}
            label="사진"
          />
        </div>

        {(validErr || error) && (
          <p className={styles.errorMsg}>{validErr || error}</p>
        )}

        <button
          className={styles.submitBtn}
          type="submit"
          disabled={submitting}
        >
          {submitting ? '저장 중...' : isEdit ? '수정 완료' : '리뷰 등록'}
        </button>
      </form>
    </div>
  );
}
