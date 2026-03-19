import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supportApi } from '../api/supportApi';
import { toApiImageUrl } from '../../file/api/fileApi';
import { useAuth } from '../../user/hooks/useAuth';
import { useRequireAuth } from '../hooks/useRequireAuth';
import styles from './Support.module.css';

const STATUS_MAP = { waiting: '답변 대기', complete: '답변 완료' };

function normalizeRole(user) {
  const raw =
    user?.userRole ??
    user?.role ??
    user?.userRl ??
    user?.user_role ??
    user?.authority ??
    user?.authorities?.[0];
  return String(raw ?? '')
    .toLowerCase()
    .replace('role_', '');
}

export default function QnaDetail() {
  const { user } = useAuth();
  const { qnaId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [qna, setQna] = useState(null);
  const [replies, setReplies] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answerTitle, setAnswerTitle] = useState('');
  const [answerCtnt, setAnswerCtnt] = useState('');
  const [answerSubmitting, setAnswerSubmitting] = useState(false);
  const [pendingImages, setPendingImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const role = normalizeRole(user);
  const isAdmin = role === 'admin';
  const isTenant = role === 'tenant';
  const isOwner = isTenant && qna?.userId === user?.userId;
  const canEdit = isAdmin || isOwner;
  const canDelete = isAdmin || isOwner;

  const loadDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const [detail, replyData, files] = await Promise.all([
        supportApi.getQnaDetail(qnaId),
        supportApi.getQnaReplies(qnaId).catch(() => []),
        supportApi.getFilesByParent('QNA', Number(qnaId)).catch(() => []),
      ]);
      const replyList = Array.isArray(replyData) ? replyData : [];
      setQna(detail);
      setReplies(replyList);
      setImages(Array.isArray(files) ? files : []);
      const adminReply =
        replyList.find((r) => Number(r?.qnaLev) === 1) ?? replyList[0];
      if (adminReply) {
        setAnswerTitle(adminReply.qnaTitle ?? '');
        setAnswerCtnt(adminReply.qnaCtnt ?? '');
      } else {
        setAnswerTitle(detail?.qnaTitle ? `[답변] ${detail.qnaTitle}` : '답변');
        setAnswerCtnt('');
      }
    } catch (err) {
      setError(err.message || '문의 내용을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    loadDetail();
  }, [qnaId, user]); // eslint-disable-line

  const blocked = useRequireAuth(user, '1:1 문의');
  if (blocked) return null;
  if (loading) return <div style={{ padding: 24 }}>로딩중...</div>;
  if (error) return <div style={{ padding: 24, color: 'red' }}>{error}</div>;
  if (!qna) return null;

  const handleDelete = async () => {
    if (!window.confirm('문의를 삭제하시겠습니까?')) return;
    try {
      await supportApi.deleteQna(qnaId);
      navigate('/support/qna');
    } catch (e) {
      alert(e.message || '삭제에 실패했습니다.');
    }
  };

  const handleSubmitAnswer = async () => {
    const title = answerTitle.trim();
    const content = answerCtnt.trim();
    if (!title) return alert('답변 제목을 입력해주세요.');
    if (!content) return alert('답변 내용을 입력해주세요.');
    setAnswerSubmitting(true);
    try {
      const payload = { qnaTitle: title, qnaCtnt: content };
      if (replies.length > 0) await supportApi.updateQnaAnswer(qnaId, payload);
      else await supportApi.createQnaAnswer(qnaId, payload);
      await loadDetail();
      alert(
        replies.length > 0 ? '답변이 수정되었습니다.' : '답변이 등록되었습니다.'
      );
    } catch (e) {
      alert(e.message || '답변 처리에 실패했습니다.');
    } finally {
      setAnswerSubmitting(false);
    }
  };

  const handleImageAdd = (e) => {
    const files = Array.from(e.target.files || []);
    const allowed = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
    const valid = files.filter((f) => allowed.includes(f.type));
    if (valid.length !== files.length)
      alert('이미지 파일(PNG, JPG, GIF, WEBP)만 업로드 가능합니다.');
    setPendingImages((prev) => [
      ...prev,
      ...valid.map((file) => ({ file, previewUrl: URL.createObjectURL(file) })),
    ]);
    e.target.value = '';
  };

  const handleRemovePending = (idx) => {
    setPendingImages((prev) => {
      URL.revokeObjectURL(prev[idx].previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleUploadPending = async () => {
    if (!pendingImages.length) return;
    setUploadingImages(true);
    try {
      await supportApi.uploadFiles(
        'QNA',
        Number(qnaId),
        pendingImages.map((p) => p.file)
      );
      const files = await supportApi
        .getFilesByParent('QNA', Number(qnaId))
        .catch(() => []);
      setImages(Array.isArray(files) ? files : []);
      pendingImages.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      setPendingImages([]);
      alert('사진이 첨부되었습니다.');
    } catch (e) {
      alert(e.message || '사진 업로드에 실패했습니다.');
    } finally {
      setUploadingImages(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <h2 className={styles.cardTitle}>{qna.qnaTitle}</h2>
          <span
            className={styles.statusBadge}
            style={
              qna.qnaSt === 'complete' ? { background: 'var(--highlight)' } : {}
            }
          >
            {STATUS_MAP[qna.qnaSt] ?? qna.qnaSt}
          </span>
        </div>

        <div className={styles.cardMeta} style={{ marginBottom: 8 }}>
          {qna.createdAt ? qna.createdAt.slice(0, 10) : '-'}
        </div>
        {isAdmin && (
          <div className={styles.cardMeta} style={{ marginBottom: 20 }}>
            작성자 ID: {qna.userId || '-'}
          </div>
        )}
        {!isAdmin && <div style={{ marginBottom: 20 }} />}

        <div style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
          {qna.qnaCtnt}
        </div>

        {/* 첨부 사진 */}
        {images.length > 0 && (
          <div
            style={{
              marginTop: 20,
              borderTop: '1px solid #eee',
              paddingTop: 16,
            }}
          >
            <p
              style={{
                fontWeight: 600,
                marginBottom: 12,
                fontSize: 14,
                color: 'var(--muted)',
              }}
            >
              첨부 사진
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {images.map((img) => (
                <a
                  key={img.fileId}
                  href={toApiImageUrl(img.viewUrl || img.adminViewUrl || '')}
                  target="_blank"
                  rel="noreferrer"
                >
                  <img
                    src={toApiImageUrl(img.viewUrl || img.adminViewUrl || '')}
                    alt={img.originFilename}
                    style={{
                      width: 120,
                      height: 96,
                      objectFit: 'cover',
                      borderRadius: 8,
                      border: '1px solid #ddd',
                      cursor: 'pointer',
                    }}
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* 사진 추가 (본인/관리자, 대기 중일 때) */}
        {canEdit && qna.qnaSt === 'waiting' && (
          <div style={{ marginTop: 16 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={handleImageAdd}
            />
            <button
              type="button"
              className={styles.pageBtn}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImages}
              style={{ fontSize: 13, marginBottom: 8 }}
            >
              + 사진 추가
            </button>
            {pendingImages.length > 0 && (
              <div>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 10,
                    marginBottom: 8,
                  }}
                >
                  {pendingImages.map((item, idx) => (
                    <div key={idx} style={{ position: 'relative' }}>
                      <img
                        src={item.previewUrl}
                        alt=""
                        style={{
                          width: 100,
                          height: 80,
                          objectFit: 'cover',
                          borderRadius: 8,
                          border: '1.5px solid var(--primary)',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePending(idx)}
                        style={{
                          position: 'absolute',
                          top: -6,
                          right: -6,
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: '#e55',
                          color: '#fff',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: 12,
                          lineHeight: '20px',
                          textAlign: 'center',
                          padding: 0,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  className={styles.buttonPrimary}
                  onClick={handleUploadPending}
                  disabled={uploadingImages}
                  style={{ fontSize: 13 }}
                >
                  {uploadingImages
                    ? '업로드 중...'
                    : `사진 ${pendingImages.length}장 업로드`}
                </button>
              </div>
            )}
          </div>
        )}

        {canEdit && qna.qnaSt === 'waiting' && (
          <div style={{ marginTop: 24, display: 'flex', gap: 8 }}>
            <button
              className={styles.buttonPrimary}
              onClick={() => navigate(`/support/qna/${qnaId}/edit`)}
            >
              수정
            </button>
            {canDelete && (
              <button className={styles.pageBtn} onClick={handleDelete}>
                삭제
              </button>
            )}
          </div>
        )}
      </div>

      {/* 관리자 답변 표시 */}
      {replies.length > 0 && (
        <div
          className={styles.card}
          style={{ background: 'var(--b-5)', marginTop: 12 }}
        >
          <p
            style={{
              fontWeight: 700,
              marginBottom: 12,
              color: 'var(--primary)',
            }}
          >
            관리자 답변
          </p>
          {replies.map((r, idx) => (
            <div key={idx} style={{ marginBottom: 14 }}>
              {r?.qnaTitle ? (
                <p style={{ fontWeight: 700, marginBottom: 6 }}>{r.qnaTitle}</p>
              ) : null}
              <div style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                {r.qnaCtnt}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 관리자 답변 작성/수정 */}
      {isAdmin && (
        <div className={styles.card} style={{ marginTop: 12 }}>
          <p
            style={{
              fontWeight: 700,
              marginBottom: 12,
              color: 'var(--primary)',
            }}
          >
            관리자 답변 {replies.length > 0 ? '수정' : '작성'}
          </p>
          <label className={styles.formLabel}>답변 제목</label>
          <input
            className={styles.formInput}
            value={answerTitle}
            onChange={(e) => setAnswerTitle(e.target.value)}
            maxLength={255}
            disabled={answerSubmitting}
          />
          <label className={styles.formLabel}>답변 내용</label>
          <textarea
            className={styles.formTextarea}
            value={answerCtnt}
            onChange={(e) => setAnswerCtnt(e.target.value)}
            maxLength={4000}
            disabled={answerSubmitting}
          />
          <div style={{ marginTop: 12 }}>
            <button
              type="button"
              className={styles.buttonPrimary}
              onClick={handleSubmitAnswer}
              disabled={answerSubmitting}
            >
              {answerSubmitting
                ? '처리 중...'
                : replies.length > 0
                  ? '답변 수정'
                  : '답변 등록'}
            </button>
          </div>
        </div>
      )}

      <button
        className={styles.pageBtn}
        onClick={() => navigate('/support/qna')}
        style={{ marginTop: 16 }}
      >
        목록으로
      </button>
    </div>
  );
}
