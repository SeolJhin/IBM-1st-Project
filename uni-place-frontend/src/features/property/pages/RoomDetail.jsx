// features/property/pages/RoomDetail.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../../app/layouts/components/Header';
import Footer from '../../../app/layouts/components/Footer';
import { propertyApi } from '../api/propertyApi';
import { useAuth } from '../../user/hooks/useAuth';
import { useReviewActions } from '../../review/hooks/useReviews';
import { reviewApi } from '../../review/api/reviewApi';
import styles from './RoomDetail.module.css';
import Modal from '../../../shared/components/Modal/Modal';
import TourReservationCreate from '../../reservation/pages/TourReservationCreate';
import TourReservationList from '../../reservation/pages/TourReservationList';

// ── 리뷰 수정 팝업 ──────────────────────────────────────────────────────────
function ReviewEditModal({ review, onClose, onSuccess }) {
  const { update, submitting } = useReviewActions();
  const [rating, setRating] = React.useState(review.rating ?? 0);
  const [hover, setHover] = React.useState(0);
  const [title, setTitle] = React.useState(review.reviewTitle ?? '');
  const [ctnt, setCtnt] = React.useState(review.reviewCtnt ?? '');

  // 기존 파일 목록 (서버에서 불러옴)
  const [existingFiles, setExistingFiles] = React.useState([]);
  const [deletedIds, setDeletedIds] = React.useState([]); // 개별 삭제할 fileId 목록
  const [deleteAll, setDeleteAll] = React.useState(false);

  // 새로 추가할 파일
  const [newFiles, setNewFiles] = React.useState([]);
  const [newPreviews, setNewPreviews] = React.useState([]);
  const [err, setErr] = React.useState('');
  const fileRef = React.useRef(null);

  // 기존 파일 불러오기
  React.useEffect(() => {
    if (review.fileCk === 'Y') {
      reviewApi
        .getDetail(review.reviewId)
        .then((d) => {
          const imgs = (d.files ?? []).filter((f) =>
            ['.png', '.jpg', '.jpeg', '.gif', '.webp', 'image'].includes(
              (f.fileType || '').toLowerCase()
            )
          );
          setExistingFiles(imgs);
        })
        .catch(() => {});
    }
  }, [review.reviewId, review.fileCk]);

  const toggleDeleteOne = (fileId) => {
    setDeletedIds((prev) =>
      prev.includes(fileId)
        ? prev.filter((id) => id !== fileId)
        : [...prev, fileId]
    );
  };

  const removeNew = (idx) => {
    const updated = newFiles.filter((_, i) => i !== idx);
    setNewFiles(updated);
    setNewPreviews(updated.map((f) => URL.createObjectURL(f)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      setErr('별점을 선택해 주세요.');
      return;
    }

    // deleteAll이면 전체 삭제 플래그, 아니면 개별 삭제 처리
    // 백엔드 updateReview는 deleteFiles=true면 전체 삭제 후 새 파일 업로드
    // 개별 삭제는 별도 API 없으므로: deletedIds가 있으면 전체=기존파일 전부를 삭제 후 남은것+새것 업로드
    const shouldDeleteAll = deleteAll || deletedIds.length > 0;
    // kept 파일을 다시 업로드할 수는 없으므로: deleteFiles=true + newFiles만 전송
    // → 단, kept가 있으면 deleteAll=false로 보내고 개별 삭제는 별도 처리가 필요
    // 여기서는 가장 안전한 방식: deleteAll or deletedIds>0 이면 deleteFiles=true
    const ok = await update(
      review.reviewId,
      { rating, reviewTitle: title, reviewCtnt: ctnt },
      shouldDeleteAll,
      newFiles
    );
    if (ok) onSuccess();
    else setErr('수정 실패. 다시 시도해 주세요.');
  };

  const imgUrl = (f) => {
    const raw = f.viewUrl || f.fileUrl || f.url || '';
    return raw.startsWith('/files') ? `/api${raw}` : raw;
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9000,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 20,
          width: '100%',
          maxWidth: 500,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 24px 16px',
            borderBottom: '1px solid #f0ece5',
            flexShrink: 0,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 17,
              fontWeight: 800,
              color: '#3a2e20',
            }}
          >
            ✏️ 리뷰 수정
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(0,0,0,0.06)',
              border: 'none',
              width: 32,
              height: 32,
              borderRadius: 8,
              fontSize: 14,
              cursor: 'pointer',
              color: 'rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            padding: '20px 24px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* 별점 */}
          <div>
            <p
              style={{
                margin: '0 0 8px',
                fontSize: 13,
                fontWeight: 700,
                color: '#5a4a30',
              }}
            >
              별점 <span style={{ color: '#e53e3e' }}>*</span>
            </p>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: 30,
                    cursor: 'pointer',
                    padding: 0,
                    lineHeight: 1,
                    color: s <= (hover || rating) ? '#f6b93b' : '#e0d8cc',
                    transition: 'color 0.1s',
                  }}
                  onMouseEnter={() => setHover(s)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(s)}
                >
                  ★
                </button>
              ))}
              {rating > 0 && (
                <span style={{ fontSize: 13, color: '#ba8037', marginLeft: 8 }}>
                  {
                    [
                      '',
                      '별로예요',
                      '그저그래요',
                      '보통이에요',
                      '좋아요',
                      '최고예요',
                    ][rating]
                  }
                </span>
              )}
            </div>
          </div>

          {/* 제목 */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 700,
                color: '#5a4a30',
                marginBottom: 6,
              }}
            >
              제목
            </label>
            <input
              type="text"
              placeholder="제목을 입력하세요 (선택)"
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1.5px solid #e8dfd0',
                borderRadius: 10,
                fontSize: 14,
                boxSizing: 'border-box',
                background: '#faf7f3',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* 내용 */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 700,
                color: '#5a4a30',
                marginBottom: 6,
              }}
            >
              내용
            </label>
            <textarea
              placeholder="내용을 입력하세요 (선택)"
              maxLength={3000}
              rows={4}
              value={ctnt}
              onChange={(e) => setCtnt(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1.5px solid #e8dfd0',
                borderRadius: 10,
                fontSize: 14,
                resize: 'vertical',
                boxSizing: 'border-box',
                background: '#faf7f3',
                fontFamily: 'inherit',
                lineHeight: 1.6,
              }}
            />
          </div>

          {/* 기존 이미지 */}
          {existingFiles.length > 0 && (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#5a4a30',
                  }}
                >
                  기존 이미지 ({existingFiles.length}장)
                </p>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    color: '#c05050',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={deleteAll}
                    onChange={(e) => {
                      setDeleteAll(e.target.checked);
                      if (e.target.checked) setDeletedIds([]);
                    }}
                  />
                  전체 삭제
                </label>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {existingFiles.map((f) => {
                  const isDeleted = deleteAll || deletedIds.includes(f.fileId);
                  return (
                    <div
                      key={f.fileId}
                      style={{ position: 'relative', width: 80, height: 80 }}
                    >
                      <img
                        src={imgUrl(f)}
                        alt=""
                        style={{
                          width: 80,
                          height: 80,
                          objectFit: 'cover',
                          borderRadius: 8,
                          border: `2px solid ${isDeleted ? '#e53e3e' : '#e8dfd0'}`,
                          opacity: isDeleted ? 0.4 : 1,
                          transition: 'all 0.15s',
                        }}
                      />
                      {!deleteAll && (
                        <button
                          type="button"
                          onClick={() => toggleDeleteOne(f.fileId)}
                          style={{
                            position: 'absolute',
                            top: -6,
                            right: -6,
                            background: isDeleted ? '#e53e3e' : '#3a2e20',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50%',
                            width: 20,
                            height: 20,
                            cursor: 'pointer',
                            fontSize: 11,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {isDeleted ? '↩' : '×'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              {(deleteAll || deletedIds.length > 0) && (
                <p
                  style={{ margin: '6px 0 0', fontSize: 12, color: '#e53e3e' }}
                >
                  {deleteAll
                    ? '저장 시 기존 이미지가 모두 삭제됩니다.'
                    : `${deletedIds.length}장이 삭제됩니다.`}
                </p>
              )}
            </div>
          )}

          {/* 새 이미지 */}
          <div>
            <p
              style={{
                margin: '0 0 10px',
                fontSize: 13,
                fontWeight: 700,
                color: '#5a4a30',
              }}
            >
              새 이미지 ({newFiles.length}/5)
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {newPreviews.map((url, idx) => (
                <div
                  key={idx}
                  style={{ position: 'relative', width: 80, height: 80 }}
                >
                  <img
                    src={url}
                    alt=""
                    style={{
                      width: 80,
                      height: 80,
                      objectFit: 'cover',
                      borderRadius: 8,
                      border: '1.5px solid #e8dfd0',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removeNew(idx)}
                    style={{
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      background: '#3a2e20',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: 20,
                      height: 20,
                      cursor: 'pointer',
                      fontSize: 11,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
              {newFiles.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  style={{
                    width: 80,
                    height: 80,
                    border: '2px dashed #d7cebc',
                    borderRadius: 8,
                    background: '#faf7f3',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    color: '#9a8c70',
                    fontSize: 11,
                  }}
                >
                  <span style={{ fontSize: 20 }}>＋</span>추가
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => {
                const sel = Array.from(e.target.files);
                const m = [...newFiles, ...sel].slice(0, 5);
                setNewFiles(m);
                setNewPreviews(m.map((f) => URL.createObjectURL(f)));
                e.target.value = '';
              }}
            />
          </div>

          {err && (
            <p style={{ margin: 0, color: '#e53e3e', fontSize: 13 }}>{err}</p>
          )}

          <div
            style={{
              display: 'flex',
              gap: 8,
              justifyContent: 'flex-end',
              paddingTop: 4,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#f5f0e8',
                color: '#5a4a30',
                border: 'none',
                borderRadius: 10,
                padding: '11px 22px',
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                background: submitting
                  ? '#d5b870'
                  : 'linear-gradient(135deg, #c4923f, #ba8037)',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '11px 28px',
                fontSize: 14,
                fontWeight: 700,
                cursor: submitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 3px 12px rgba(186,128,55,0.35)',
              }}
            >
              {submitting ? '저장 중...' : '수정 완료'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StarRating({ value = 0, size = 'md' }) {
  return (
    <span className={`${styles.stars} ${styles[`stars_${size}`]}`}>
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

function ReviewDetailModal({ review, onClose }) {
  const [detail, setDetail] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [lbIdx, setLbIdx] = React.useState(null);

  React.useEffect(() => {
    reviewApi
      .getDetail(review.reviewId)
      .then((d) => setDetail(d))
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [review.reviewId]);

  const data = detail || review;
  const IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', 'image'];
  const imageFiles = (data.files ?? []).filter((f) =>
    IMAGE_EXTS.includes((f.fileType || '').toLowerCase())
  );
  const imageUrls = imageFiles.map((f) => {
    const raw = f.viewUrl || f.fileUrl || f.url || '';
    return raw.startsWith('/files') ? `/api${raw}` : raw;
  });

  const stars = data.rating ?? 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9500,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 20,
          width: '100%',
          maxWidth: 640,
          maxHeight: '88vh',
          overflowY: 'auto',
          position: 'relative',
          boxShadow: '0 32px 80px rgba(0,0,0,0.28)',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── 헤더 ── */}
        <div
          style={{
            padding: '22px 28px 18px',
            borderBottom: '1px solid #f0ece5',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexShrink: 0,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* 제목 */}
            {data.reviewTitle ? (
              <h2
                style={{
                  margin: '0 0 10px',
                  fontSize: 18,
                  fontWeight: 800,
                  color: '#3a2e20',
                  lineHeight: 1.4,
                }}
              >
                {data.reviewTitle}
              </h2>
            ) : (
              <h2
                style={{
                  margin: '0 0 10px',
                  fontSize: 18,
                  fontWeight: 800,
                  color: '#9a8c70',
                  lineHeight: 1.4,
                }}
              >
                (제목 없음)
              </h2>
            )}
            {/* 메타 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              {/* 별점 */}
              <div style={{ display: 'flex', gap: 2 }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <span
                    key={s}
                    style={{
                      fontSize: 16,
                      color: s <= stars ? '#f6b93b' : '#e0d8cc',
                    }}
                  >
                    ★
                  </span>
                ))}
                <span
                  style={{
                    fontSize: 13,
                    color: '#ba8037',
                    marginLeft: 4,
                    fontWeight: 700,
                  }}
                >
                  {stars}.0
                </span>
              </div>
              <span style={{ color: '#d7cebc', fontSize: 12 }}>|</span>
              <span style={{ fontSize: 13, color: '#7a6a54', fontWeight: 600 }}>
                {data.userId || '익명'}
              </span>
              <span style={{ color: '#d7cebc', fontSize: 12 }}>|</span>
              <span style={{ fontSize: 12, color: '#9a8c70' }}>
                {data.createdAt
                  ? new Date(data.createdAt).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : ''}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(0,0,0,0.06)',
              border: 'none',
              width: 34,
              height: 34,
              borderRadius: 8,
              fontSize: 14,
              cursor: 'pointer',
              color: 'rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginLeft: 12,
            }}
          >
            ✕
          </button>
        </div>

        {/* ── 본문 ── */}
        <div
          style={{
            padding: '24px 28px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          {loading && (
            <div
              style={{
                textAlign: 'center',
                padding: '32px 0',
                color: '#9a8c70',
                fontSize: 14,
              }}
            >
              불러오는 중...
            </div>
          )}

          {/* 이미지 */}
          {!loading && imageUrls.length > 0 && (
            <div>
              {/* 메인 이미지 */}
              <div
                onClick={() => setLbIdx(0)}
                style={{
                  width: '100%',
                  borderRadius: 12,
                  overflow: 'hidden',
                  background: '#f5f0e8',
                  cursor: 'zoom-in',
                  marginBottom: imageUrls.length > 1 ? 8 : 0,
                  maxHeight: 340,
                }}
              >
                <img
                  src={imageUrls[0]}
                  alt="리뷰 이미지"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                    maxHeight: 340,
                  }}
                />
              </div>
              {/* 서브 이미지 */}
              {imageUrls.length > 1 && (
                <div style={{ display: 'flex', gap: 8 }}>
                  {imageUrls.slice(1).map((url, i) => (
                    <div
                      key={i}
                      onClick={() => setLbIdx(i + 1)}
                      style={{
                        flex: 1,
                        maxWidth: 120,
                        height: 90,
                        borderRadius: 8,
                        overflow: 'hidden',
                        border: '2px solid #e8dfd0',
                        cursor: 'zoom-in',
                      }}
                    >
                      <img
                        src={url}
                        alt=""
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 본문 텍스트 */}
          {!loading && data.reviewCtnt && (
            <div
              style={{
                fontSize: 15,
                color: '#4a3a28',
                lineHeight: 1.9,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                borderTop: imageUrls.length > 0 ? '1px solid #f0ece5' : 'none',
                paddingTop: imageUrls.length > 0 ? 20 : 0,
              }}
            >
              {data.reviewCtnt}
            </div>
          )}

          {/* 내용 없음 */}
          {!loading && imageUrls.length === 0 && !data.reviewCtnt && (
            <p
              style={{
                margin: 0,
                color: '#9a8c70',
                fontSize: 14,
                textAlign: 'center',
                padding: '20px 0',
              }}
            >
              작성된 내용이 없습니다.
            </p>
          )}
        </div>
      </div>

      {/* 라이트박스 */}
      {lbIdx !== null && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(0,0,0,0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setLbIdx(null)}
        >
          <button
            onClick={() => setLbIdx(null)}
            style={{
              position: 'absolute',
              top: 16,
              right: 20,
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: 36,
              cursor: 'pointer',
            }}
          >
            ×
          </button>
          {imageUrls.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLbIdx((i) => (i - 1 + imageUrls.length) % imageUrls.length);
              }}
              style={{
                position: 'absolute',
                left: 16,
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                color: '#fff',
                fontSize: 28,
                width: 48,
                height: 48,
                borderRadius: '50%',
                cursor: 'pointer',
              }}
            >
              ‹
            </button>
          )}
          <img
            src={imageUrls[lbIdx]}
            alt=""
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90vw',
              maxHeight: '88vh',
              objectFit: 'contain',
              borderRadius: 8,
            }}
          />
          {imageUrls.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLbIdx((i) => (i + 1) % imageUrls.length);
              }}
              style={{
                position: 'absolute',
                right: 16,
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                color: '#fff',
                fontSize: 28,
                width: 48,
                height: 48,
                borderRadius: '50%',
                cursor: 'pointer',
              }}
            >
              ›
            </button>
          )}
          <div
            style={{
              position: 'absolute',
              bottom: 20,
              color: 'rgba(255,255,255,0.6)',
              fontSize: 13,
            }}
          >
            {lbIdx + 1} / {imageUrls.length}
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewCard({ review, currentUserId, onEdit, onDelete }) {
  const [showDetail, setShowDetail] = React.useState(false);
  const isOwn = currentUserId && review.userId === currentUserId;
  return (
    <>
      <article
        className={styles.reviewCard}
        onClick={() => setShowDetail(true)}
        style={{ cursor: 'pointer' }}
      >
        {review.thumbnailUrl && (
          <div className={styles.reviewThumb}>
            <img
              src={`/api${review.thumbnailUrl}`}
              alt="리뷰 이미지"
              onError={(e) => {
                e.target.parentElement.style.display = 'none';
              }}
            />
          </div>
        )}
        <div className={styles.reviewBody}>
          <div className={styles.reviewTop}>
            <StarRating value={review.rating} size="sm" />
            <span className={styles.reviewUser}>{review.userId || '익명'}</span>
            <span className={styles.reviewDate}>
              {review.createdAt
                ? new Date(review.createdAt).toLocaleDateString('ko-KR')
                : ''}
            </span>
            {isOwn && (
              <div
                style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => onEdit(review)}
                  style={{
                    background: 'none',
                    border: '1px solid #c9b89a',
                    color: '#7a6a50',
                    fontSize: 12,
                    padding: '2px 8px',
                    borderRadius: 6,
                    cursor: 'pointer',
                  }}
                >
                  수정
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(review.reviewId)}
                  style={{
                    background: 'none',
                    border: '1px solid #f5b8b8',
                    color: '#c05050',
                    fontSize: 12,
                    padding: '2px 8px',
                    borderRadius: 6,
                    cursor: 'pointer',
                  }}
                >
                  삭제
                </button>
              </div>
            )}
          </div>
          <h4 className={styles.reviewTitle}>{review.reviewTitle}</h4>
          <p className={styles.reviewCtnt}>
            {review.reviewCtnt?.length > 100
              ? review.reviewCtnt.slice(0, 100) + '…'
              : review.reviewCtnt}
          </p>
        </div>
      </article>
      {showDetail && (
        <ReviewDetailModal
          review={review}
          onClose={() => setShowDetail(false)}
        />
      )}
    </>
  );
}

function ImageGallery({ files }) {
  const [active, setActive] = useState(0);
  const images = (files || []).filter((f) => {
    const ext = (f.fileType || '').toLowerCase();
    return ['.png', '.jpg', '.jpeg', '.gif', '.webp', 'image'].includes(ext);
  });
  if (!images.length) {
    return (
      <div className={styles.galleryPlaceholder}>
        <span>🏠</span>
        <p>등록된 사진이 없습니다</p>
      </div>
    );
  }
  const getUrl = (img) => {
    const raw = img.viewUrl || img.fileUrl || img.url || '';
    return raw.startsWith('/files') ? `/api${raw}` : raw;
  };
  return (
    <div className={styles.gallery}>
      <div className={styles.galleryMain}>
        <img
          src={getUrl(images[active])}
          alt={`방 사진 ${active + 1}`}
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      </div>
      {images.length > 1 && (
        <div className={styles.galleryThumbs}>
          {images.map((img, i) => (
            <button
              key={i}
              className={`${styles.galleryThumb} ${i === active ? styles.galleryThumbActive : ''}`}
              onClick={() => setActive(i)}
              type="button"
            >
              <img
                src={getUrl(img)}
                alt={`썸네일 ${i + 1}`}
                onError={(e) => {
                  e.target.style.opacity = '0.3';
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 공용공간 미니 카드 ─────────────────────────────────────────────────────────
function SpaceMiniCard({ space, onClick }) {
  const options = space.spaceOptions
    ? space.spaceOptions
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean)
    : [];
  return (
    <article
      className={styles.spaceMiniCard}
      onClick={() => onClick(space.spaceId)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick(space.spaceId)}
    >
      <div className={styles.spaceMiniImg}>
        {space.thumbnailUrl ? (
          <img src={space.thumbnailUrl} alt={space.spaceNm} />
        ) : (
          <div className={styles.spaceMiniImgPh}>🛋️</div>
        )}
      </div>
      <div className={styles.spaceMiniBody}>
        <p className={styles.spaceMiniNm}>{space.spaceNm}</p>
        <p className={styles.spaceMiniMeta}>
          📍 {space.spaceFloor}층 · 👥 최대 {space.spaceCapacity}명
        </p>
        {options.length > 0 && (
          <div className={styles.spaceMiniTags}>
            {options.slice(0, 3).map((o) => (
              <span key={o} className={styles.spaceMiniTag}>
                {o}
              </span>
            ))}
            {options.length > 3 && (
              <span className={styles.spaceMiniTag}>+{options.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export default function RoomDetail() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    create: createReview,
    submitting: reviewSubmitting,
    error: reviewApiError,
  } = useReviewActions();
  const [findMenuOpen, setFindMenuOpen] = useState(false);
  const [reviewEditTarget, setReviewEditTarget] = useState(null);

  // 내 리뷰 삭제
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('리뷰를 삭제할까요?')) return;
    try {
      await reviewApi.remove(reviewId);
      fetchReviews(reviewPage);
    } catch (e) {
      alert(e?.message || '삭제 실패');
    }
  };

  // 인라인 리뷰 작성 상태
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [inlineRating, setInlineRating] = useState(0);
  const [inlineTitle, setInlineTitle] = useState('');
  const [inlineCtnt, setInlineCtnt] = useState('');
  const [inlineFiles, setInlineFiles] = useState([]);
  const [inlinePreviews, setInlinePreviews] = useState([]);
  const [inlineValidErr, setInlineValidErr] = useState('');
  const [inlineSuccess, setInlineSuccess] = useState(false);
  const inlineFileRef = useRef(null);
  const [inlineHover, setInlineHover] = useState(0);
  const [permError, setPermError] = useState('');
  const [tourCreateOpen, setTourCreateOpen] = useState(false);
  const [tourListOpen, setTourListOpen] = useState(false);

  const [room, setRoom] = useState(null);
  const [roomLoading, setRoomLoading] = useState(true);
  const [roomError, setRoomError] = useState(null);

  const [reviewSummary, setReviewSummary] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewTotalPages, setReviewTotalPages] = useState(1);
  const [reviewLoading, setReviewLoading] = useState(false);

  // 같은 건물 공용공간
  const [spaces, setSpaces] = useState([]);
  const [spacesLoading, setSpacesLoading] = useState(false);

  useEffect(() => {
    if (!roomId) return;
    setRoomLoading(true);
    propertyApi
      .getRoomDetail(Number(roomId))
      .then((data) => setRoom(data))
      .catch((err) =>
        setRoomError(err?.message || '방 정보를 불러올 수 없습니다.')
      )
      .finally(() => setRoomLoading(false));
  }, [roomId]);

  // 방 정보 로드 후 같은 건물 공용공간 조회
  useEffect(() => {
    if (!room?.buildingId) return;
    setSpacesLoading(true);
    propertyApi
      .getSpaces(room.buildingId, { page: 1, size: 6 })
      .then((data) => setSpaces(data?.content ?? []))
      .catch(() => setSpaces([]))
      .finally(() => setSpacesLoading(false));
  }, [room?.buildingId]);

  useEffect(() => {
    if (!roomId) return;
    fetch(`/api/reviews/rooms/${roomId}/summary`)
      .then((r) => r.json())
      .then((r) => setReviewSummary(r.data))
      .catch(() => {});
  }, [roomId]);

  const fetchReviews = useCallback(
    async (p) => {
      if (!roomId) return;
      setReviewLoading(true);
      try {
        const res = await fetch(
          `/api/reviews?roomId=${roomId}&page=${p - 1}&size=5&sort=reviewId&direction=DESC`
        );
        const json = await res.json();
        const data = json.data;
        setReviews(data?.content ?? []);
        setReviewTotalPages(data?.totalPages ?? 1);
      } catch {
        setReviews([]);
      } finally {
        setReviewLoading(false);
      }
    },
    [roomId]
  );

  useEffect(() => {
    fetchReviews(reviewPage);
  }, [fetchReviews, reviewPage]);

  // 방 예약 버튼 클릭 → 팝업 오픈
  const handleTourReservation = () => {
    setTourCreateOpen(true);
  };

  // 리뷰 작성 → 인라인 폼 표시
  const handleWriteReview = () => {
    setPermError('');
    if (!user) {
      navigate('/login', { state: { from: `/rooms/${roomId}` } });
      return;
    }
    if (user.userRole !== 'tenant') {
      setPermError('리뷰 작성은 입주자(TENANT) 권한이 필요합니다.');
      return;
    }
    setShowReviewForm(true);
    setInlineSuccess(false);
    setTimeout(() => {
      document
        .querySelector('[data-review-form]')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const handleInlineFileChange = (e) => {
    const selected = Array.from(e.target.files);
    const merged = [...inlineFiles, ...selected].slice(0, 5);
    setInlineFiles(merged);
    setInlinePreviews(merged.map((f) => URL.createObjectURL(f)));
    e.target.value = '';
  };

  const handleInlineSubmit = async (e) => {
    e.preventDefault();
    setInlineValidErr('');
    if (inlineRating === 0) {
      setInlineValidErr('별점을 선택해 주세요.');
      return;
    }
    const ok = await createReview(
      {
        roomId: Number(roomId),
        rating: inlineRating,
        reviewTitle: inlineTitle,
        reviewCtnt: inlineCtnt,
      },
      inlineFiles
    );
    if (ok) {
      setInlineSuccess(true);
      setShowReviewForm(false);
      setInlineRating(0);
      setInlineTitle('');
      setInlineCtnt('');
      setInlineFiles([]);
      setInlinePreviews([]);
      fetchReviews(1);
    }
  };

  useEffect(() => {
    if (!findMenuOpen) return;
    const close = () => setFindMenuOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [findMenuOpen]);

  const rentTypeLabel = { monthly_rent: '월세', stay: '단기' };
  const statusLabel = {
    available: '입주 가능',
    reserved: '예약 중',
    contracted: '계약 중',
    repair: '수리 중',
    cleaning: '청소 중',
  };
  const sunLabel = { s: '남향', n: '북향', e: '동향', w: '서향' };

  if (roomLoading) {
    return (
      <div className={styles.page}>
        <Header />
        <div className={styles.centerBox}>
          <div className={styles.spinner} />
          <p>방 정보를 불러오는 중...</p>
        </div>
        <Footer />
      </div>
    );
  }
  if (roomError || !room) {
    return (
      <div className={styles.page}>
        <Header />
        <div className={styles.centerBox}>
          <p>⚠️ {roomError || '방 정보를 찾을 수 없습니다.'}</p>
          <button onClick={() => navigate('/rooms')}>목록으로</button>
        </div>
        <Footer />
      </div>
    );
  }

  const options = room.roomOptions
    ? room.roomOptions
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean)
    : [];

  return (
    <div className={styles.page}>
      <Header />

      {/* 브레드크럼 */}
      <div className={styles.breadcrumb}>
        <div
          className={styles.breadcrumbInner}
          style={{ justifyContent: 'space-between' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button className={styles.bcBtn} onClick={() => navigate('/')}>
              홈
            </button>
            <span className={styles.bcSep}>›</span>
            <button className={styles.bcBtn} onClick={() => navigate('/rooms')}>
              방 찾기
            </button>
            <span className={styles.bcSep}>›</span>
            <span className={styles.bcCurrent}>
              {room.buildingNm} {room.roomNo}호
            </span>
          </div>

          {/* 방 찾기 드롭다운 */}
          <div
            style={{ position: 'relative' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              style={{
                background: '#ba8037',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '7px 14px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              onClick={() => setFindMenuOpen((v) => !v)}
              type="button"
            >
              🔍 방 찾기&nbsp;
              <span>{findMenuOpen ? '▲' : '▼'}</span>
            </button>
            {findMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 6px)',
                  background: '#fff',
                  border: '1px solid #e8dfd0',
                  borderRadius: '10px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                  minWidth: '160px',
                  zIndex: 100,
                  overflow: 'hidden',
                }}
              >
                <button
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 16px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                  onClick={() => {
                    setFindMenuOpen(false);
                    navigate('/rooms');
                  }}
                >
                  🏠 방 목록 전체
                </button>
                <button
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 16px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                  onClick={() => {
                    setFindMenuOpen(false);
                    navigate('/rooms', { state: { tab: 'buildings' } });
                  }}
                >
                  🏢 건물 목록
                </button>
                <button
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 16px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                  onClick={() => {
                    setFindMenuOpen(false);
                    navigate('/rooms', { state: { tab: 'spaces' } });
                  }}
                >
                  🛋️ 공용공간 목록
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.container}>
        {/* ── 상단: 이미지 + 기본정보 ── */}
        <div className={styles.topGrid}>
          <ImageGallery files={room.files} />

          <div className={styles.infoPanel}>
            <button
              className={styles.buildingLink}
              onClick={() => navigate(`/buildings/${room.buildingId}`)}
            >
              🏢 {room.buildingNm}
              <span className={styles.buildingLinkArrow}>빌딩 상세 보기 →</span>
            </button>

            <div className={styles.roomTitle}>
              <h1 className={styles.roomName}>
                {room.roomNo}호 · {room.floor}층
              </h1>
              <span
                className={`${styles.roomStatus} ${{ available: styles.statusAvailable, reserved: styles.statusOccupied, contracted: styles.statusOccupied, repair: styles.statusMaintenance, cleaning: styles.statusMaintenance }[room.roomSt] || styles.statusMaintenance}`}
              >
                {statusLabel[room.roomSt] || room.roomSt}
              </span>
            </div>

            {/* 별점 */}
            <div className={styles.ratingBlock}>
              {reviewSummary ? (
                <>
                  <StarRating value={reviewSummary.avgRating} size="lg" />
                  <span className={styles.ratingVal}>
                    {reviewSummary.avgRating.toFixed(1)}
                  </span>
                  <span className={styles.ratingCount}>
                    ({reviewSummary.reviewCount}개 리뷰)
                  </span>
                </>
              ) : (
                <span className={styles.ratingNone}>아직 리뷰가 없습니다</span>
              )}
            </div>

            {/* 가격 */}
            <div className={styles.priceBlock}>
              <div className={styles.priceType}>
                {rentTypeLabel[room.rentType] || room.rentType}
              </div>
              <div className={styles.priceMain}>
                월 <strong>{Number(room.rentPrice).toLocaleString()}</strong>원
              </div>
              <div className={styles.priceSub}>
                보증금 {Number(room.deposit).toLocaleString()}원 · 관리비{' '}
                {Number(room.manageFee).toLocaleString()}원
              </div>
            </div>

            {/* 스펙 */}
            <div className={styles.specGrid}>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>면적</span>
                <span className={styles.specValue}>{room.roomSize}㎡</span>
              </div>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>수용인원</span>
                <span className={styles.specValue}>{room.roomCapacity}인</span>
              </div>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>최소기간</span>
                <span className={styles.specValue}>{room.rentMin}개월</span>
              </div>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>채광</span>
                <span className={styles.specValue}>
                  {sunLabel[room.sunDirection] || room.sunDirection || '-'}
                </span>
              </div>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>주소</span>
                <span className={styles.specValue}>{room.buildingAddr}</span>
              </div>
              {room.buildingDesc && (
                <div className={styles.specItem} style={{ gridColumn: '1/-1' }}>
                  <span className={styles.specLabel}>빌딩 소개</span>
                  <span className={styles.specValue}>{room.buildingDesc}</span>
                </div>
              )}
            </div>

            {/* 옵션 */}
            {options.length > 0 && (
              <div className={styles.optionBlock}>
                <p className={styles.optionTitle}>포함 옵션</p>
                <div className={styles.optionTags}>
                  {options.map((o) => (
                    <span key={o} className={styles.optionTag}>
                      {o}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ── 방 예약 버튼 ── */}
            {room?.roomSt !== 'available' ? (
              <>
                <button
                  className={styles.tourReservationBtn}
                  type="button"
                  disabled
                  style={{ opacity: 0.45, cursor: 'not-allowed' }}
                >
                  📅 방 사전 방문 예약하기
                </button>
                <p
                  className={styles.tourReservationHint}
                  style={{ color: '#c0392b' }}
                >
                  현재 이 방은 예약이 불가합니다 (
                  {{
                    reserved: '예약 중',
                    contracted: '계약 중',
                    repair: '수리 중',
                    cleaning: '청소 중',
                  }[room?.roomSt] || room?.roomSt}
                  )
                </p>
              </>
            ) : (
              <>
                <button
                  className={styles.tourReservationBtn}
                  onClick={handleTourReservation}
                  type="button"
                >
                  📅 방 사전 방문 예약하기
                </button>
                <p className={styles.tourReservationHint}>
                  방문 예약 후 현장에서 직접 확인해보세요
                </p>
              </>
            )}
          </div>
        </div>

        {/* ── 방 설명 ── */}
        {room.roomDesc && (
          <section className={styles.descSection}>
            <h2 className={styles.sectionTitle}>방 소개</h2>
            <p className={styles.descText}>{room.roomDesc}</p>
          </section>
        )}

        {/* ── 같은 건물 공용공간 ── */}
        <section className={styles.spacesSection}>
          <div className={styles.spacesSectionHeader}>
            <h2 className={styles.sectionTitle}>🛋️ 같은 건물 공용공간</h2>
            {spaces.length > 0 && (
              <button
                className={styles.spacesSeeAll}
                onClick={() =>
                  navigate(
                    `/spaces?buildingId=${room.buildingId}&buildingNm=${encodeURIComponent(room.buildingNm)}`
                  )
                }
                type="button"
              >
                전체 보기 →
              </button>
            )}
          </div>

          {spacesLoading && (
            <p className={styles.spacesLoading}>공용공간 불러오는 중...</p>
          )}
          {!spacesLoading && spaces.length === 0 && (
            <p className={styles.spacesEmpty}>
              이 건물에 등록된 공용공간이 없습니다.
            </p>
          )}
          {!spacesLoading && spaces.length > 0 && (
            <div className={styles.spacesMiniGrid}>
              {spaces.map((space) => (
                <SpaceMiniCard
                  key={space.spaceId}
                  space={space}
                  onClick={(id) => navigate(`/spaces/${id}`)}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── 리뷰 섹션 ── */}
        <section className={styles.reviewSection}>
          <div className={styles.reviewSectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>리뷰</h2>
              {reviewSummary && (
                <div className={styles.reviewSummaryLine}>
                  <StarRating value={reviewSummary.avgRating} size="md" />
                  <span className={styles.reviewSummaryVal}>
                    {reviewSummary.avgRating.toFixed(1)}
                  </span>
                  <span className={styles.reviewSummaryCount}>
                    · 총 {reviewSummary.reviewCount}개
                  </span>
                </div>
              )}
            </div>
            {!showReviewForm && (
              <button
                className={styles.writeReviewBtn}
                onClick={handleWriteReview}
              >
                ✏️ 리뷰 작성
              </button>
            )}
          </div>

          {/* 권한 에러 메시지 */}
          {permError && (
            <div
              style={{
                background: '#fff5f5',
                border: '1px solid #feb2b2',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '16px',
                color: '#c53030',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              🚫 {permError}
            </div>
          )}
          {showReviewForm && (
            <div
              data-review-form
              style={{
                background: '#fdf8f2',
                border: '1px solid #e8dfd0',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: 700,
                    color: '#3a2e20',
                  }}
                >
                  ✏️ 리뷰 작성
                </h3>
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '18px',
                    color: '#9a8c70',
                  }}
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleInlineSubmit}>
                {/* 별점 */}
                <div style={{ marginBottom: '16px' }}>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#5a4a30',
                      marginBottom: '8px',
                    }}
                  >
                    별점 <span style={{ color: '#e53e3e' }}>*</span>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '28px',
                          color:
                            s <= (inlineHover || inlineRating)
                              ? '#f6b93b'
                              : '#d7cebc',
                          padding: '0',
                        }}
                        onMouseEnter={() => setInlineHover(s)}
                        onMouseLeave={() => setInlineHover(0)}
                        onClick={() => setInlineRating(s)}
                      >
                        ★
                      </button>
                    ))}
                    {inlineRating > 0 && (
                      <span
                        style={{
                          fontSize: '13px',
                          color: '#ba8037',
                          marginLeft: '8px',
                          lineHeight: '36px',
                        }}
                      >
                        {
                          [
                            '',
                            '별로예요',
                            '그저 그래요',
                            '보통이에요',
                            '좋아요',
                            '최고예요',
                          ][inlineRating]
                        }
                      </span>
                    )}
                  </div>
                </div>
                {/* 제목 */}
                <div style={{ marginBottom: '12px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#5a4a30',
                      marginBottom: '6px',
                    }}
                  >
                    제목
                  </label>
                  <input
                    type="text"
                    placeholder="제목을 입력하세요 (선택)"
                    maxLength={100}
                    value={inlineTitle}
                    onChange={(e) => setInlineTitle(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e8dfd0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      background: '#fff',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                {/* 내용 */}
                <div style={{ marginBottom: '12px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#5a4a30',
                      marginBottom: '6px',
                    }}
                  >
                    내용
                  </label>
                  <textarea
                    placeholder="리뷰 내용을 입력하세요 (선택)"
                    maxLength={3000}
                    rows={4}
                    value={inlineCtnt}
                    onChange={(e) => setInlineCtnt(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e8dfd0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      background: '#fff',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                {/* 사진 */}
                <div style={{ marginBottom: '16px' }}>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#5a4a30',
                      marginBottom: '8px',
                    }}
                  >
                    사진 ({inlineFiles.length}/5)
                  </div>
                  <div
                    style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}
                  >
                    {inlinePreviews.map((url, idx) => (
                      <div
                        key={idx}
                        style={{
                          position: 'relative',
                          width: '72px',
                          height: '72px',
                        }}
                      >
                        <img
                          src={url}
                          alt=""
                          style={{
                            width: '72px',
                            height: '72px',
                            objectFit: 'cover',
                            borderRadius: '6px',
                            border: '1px solid #e8dfd0',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = inlineFiles.filter(
                              (_, i) => i !== idx
                            );
                            setInlineFiles(updated);
                            setInlinePreviews(
                              updated.map((f) => URL.createObjectURL(f))
                            );
                          }}
                          style={{
                            position: 'absolute',
                            top: '-6px',
                            right: '-6px',
                            background: '#3a2e20',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50%',
                            width: '18px',
                            height: '18px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {inlineFiles.length < 5 && (
                      <button
                        type="button"
                        onClick={() => inlineFileRef.current?.click()}
                        style={{
                          width: '72px',
                          height: '72px',
                          border: '2px dashed #d7cebc',
                          borderRadius: '6px',
                          background: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '2px',
                          color: '#9a8c70',
                          fontSize: '11px',
                        }}
                      >
                        <span style={{ fontSize: '20px' }}>＋</span>사진 추가
                      </button>
                    )}
                  </div>
                  <input
                    ref={inlineFileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleInlineFileChange}
                  />
                </div>
                {(inlineValidErr || reviewApiError) && (
                  <p
                    style={{
                      color: '#e53e3e',
                      fontSize: '13px',
                      marginBottom: '12px',
                    }}
                  >
                    {inlineValidErr || reviewApiError}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="submit"
                    disabled={reviewSubmitting}
                    style={{
                      background: '#ba8037',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 24px',
                      fontSize: '14px',
                      fontWeight: 700,
                      cursor: reviewSubmitting ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {reviewSubmitting ? '저장 중...' : '리뷰 등록'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(false)}
                    style={{
                      background: '#f5f0e8',
                      color: '#5a4a30',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 20px',
                      fontSize: '14px',
                      cursor: 'pointer',
                    }}
                  >
                    취소
                  </button>
                </div>
              </form>
            </div>
          )}

          {inlineSuccess && (
            <div
              style={{
                background: '#f0fdf4',
                border: '1px solid #86efac',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '16px',
                color: '#166534',
                fontSize: '14px',
              }}
            >
              ✅ 리뷰가 등록되었습니다!
            </div>
          )}

          {reviewLoading && (
            <div className={styles.reviewLoadingRow}>
              <div className={styles.spinnerSm} /> 리뷰 불러오는 중...
            </div>
          )}
          {!reviewLoading && reviews.length === 0 && (
            <div className={styles.reviewEmpty}>
              <p>아직 작성된 리뷰가 없습니다.</p>
              <button
                className={styles.writeReviewBtnSm}
                onClick={handleWriteReview}
              >
                첫 리뷰를 남겨보세요 →
              </button>
            </div>
          )}
          {!reviewLoading && reviews.length > 0 && (
            <div className={styles.reviewList}>
              {reviews.map((r) => (
                <ReviewCard
                  key={r.reviewId}
                  review={r}
                  currentUserId={user?.userId}
                  onEdit={(rev) => setReviewEditTarget(rev)}
                  onDelete={handleDeleteReview}
                />
              ))}
            </div>
          )}
          {reviewTotalPages > 1 && (
            <div className={styles.reviewPagination}>
              <button
                disabled={reviewPage === 1}
                onClick={() => setReviewPage((p) => p - 1)}
                className={styles.rpBtn}
              >
                ‹
              </button>
              {Array.from({ length: reviewTotalPages }, (_, i) => i + 1).map(
                (p) => (
                  <button
                    key={p}
                    className={`${styles.rpBtn} ${p === reviewPage ? styles.rpBtnActive : ''}`}
                    onClick={() => setReviewPage(p)}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                disabled={reviewPage === reviewTotalPages}
                onClick={() => setReviewPage((p) => p + 1)}
                className={styles.rpBtn}
              >
                ›
              </button>
            </div>
          )}
        </section>
      </div>

      <Footer />

      {/* ── 사전방문 예약 팝업 ── */}
      <Modal
        open={tourCreateOpen}
        onClose={() => setTourCreateOpen(false)}
        title="📅 사전 방문 예약"
        size="lg"
      >
        <TourReservationCreate
          inlineMode
          initRoomId={String(roomId)}
          initBuildingId={room?.buildingId ? Number(room.buildingId) : null}
          onSuccess={() => {
            setTourCreateOpen(false);
            setTourListOpen(true);
          }}
          onClose={() => setTourCreateOpen(false)}
          onGoList={() => {
            setTourCreateOpen(false);
            setTourListOpen(true);
          }}
        />
      </Modal>

      {/* ── 사전방문 조회 팝업 ── */}
      <Modal
        open={tourListOpen}
        onClose={() => setTourListOpen(false)}
        title="📋 방문 예약 조회"
        size="lg"
        headerAction={
          <button
            onClick={() => {
              setTourListOpen(false);
              setTourCreateOpen(true);
            }}
            style={{
              background: 'linear-gradient(135deg, #c4923f, #ba8037)',
              border: 'none',
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              padding: '7px 14px',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            + 예약 생성
          </button>
        }
      >
        <TourReservationList
          inlineMode
          onGoCreate={() => {
            setTourListOpen(false);
            setTourCreateOpen(true);
          }}
          onClose={() => setTourListOpen(false)}
        />
      </Modal>

      {/* ── 리뷰 수정 팝업 ── */}
      {reviewEditTarget && (
        <ReviewEditModal
          review={reviewEditTarget}
          onClose={() => setReviewEditTarget(null)}
          onSuccess={() => {
            setReviewEditTarget(null);
            fetchReviews(reviewPage);
          }}
        />
      )}
    </div>
  );
}
