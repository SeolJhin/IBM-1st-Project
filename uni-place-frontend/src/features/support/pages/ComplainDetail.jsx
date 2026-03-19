import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supportApi } from '../api/supportApi';
import { toApiImageUrl } from '../../file/api/fileApi';
import { useAuth } from '../../user/hooks/useAuth';
import styles from './Support.module.css';

const STATUS_MAP = {
  received: '접수완료',
  in_progress: '처리중',
  resolved: '처리완료',
};

const IMPORTANCE_MAP = {
  high: { label: '긴급', color: '#e55353', bg: '#fff0f0' },
  medium: { label: '보통', color: '#f0952a', bg: '#fff7ee' },
  low: { label: '낮음', color: '#8c8c8c', bg: '#f5f5f5' },
};

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

export default function ComplainDetail() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);
  const complainListPath = location.pathname.startsWith('/admin/')
    ? '/admin/support/complain'
    : '/support/complain';

  const [data, setData] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 상태 변경
  const [statusValue, setStatusValue] = useState('received');
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  // 이미지 추가
  const [pendingImages, setPendingImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  // 관리자 답변
  const [replyCtnt, setReplyCtnt] = useState('');
  const [replyStatus, setReplyStatus] = useState('resolved');
  const [replySubmitting, setReplySubmitting] = useState(false);

  const role = normalizeRole(user);
  const isAdmin = role === 'admin';
  const isTenant = role === 'tenant';
  const isOwner = isTenant && data?.userId === user?.userId;
  const canEdit = isAdmin || isOwner;
  const canDelete = isAdmin || isOwner;

  // replyCk가 'Y'이면 이미 답변이 있는 상태
  const hasReply = data?.replyCk === 'Y';

  const loadDetail = async () => {
    setLoading(true);
    try {
      const [res, files] = await Promise.all([
        supportApi.getComplainDetail(id),
        supportApi.getFilesByParent('COMPLAIN', Number(id)).catch(() => []),
      ]);
      setData(res);
      setImages(Array.isArray(files) ? files : []);
      setStatusValue(res?.compSt ?? 'received');
      // 기존 답변 내용이 있으면 입력창에 채워두기
      if (res?.replyCtnt) setReplyCtnt(res.replyCtnt);
      if (res?.compSt) setReplyStatus(res.compSt);
    } catch (err) {
      if (Number(err?.status) === 404) {
        navigate(complainListPath, { replace: true });
        return;
      }
      setError(err.message || '민원 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [id]); // eslint-disable-line

  if (loading) return <div style={{ padding: 24 }}>로딩중...</div>;
  if (error) return <div style={{ padding: 24, color: 'red' }}>{error}</div>;
  if (!data) return null;

  const handleDelete = async () => {
    if (!window.confirm('민원을 삭제하시겠습니까?')) return;
    try {
      await supportApi.deleteComplain(id);
      navigate(complainListPath);
    } catch (e) {
      alert(e.message || '삭제에 실패했습니다.');
    }
  };

  const handleUpdateStatus = async () => {
    if (!isAdmin) return;
    setStatusSubmitting(true);
    try {
      const updated = await supportApi.updateComplainStatus(id, statusValue);
      setData((prev) => ({
        ...prev,
        ...(updated ?? {}),
        compSt: updated?.compSt ?? statusValue,
      }));
      alert('민원 처리상태가 변경되었습니다.');
    } catch (e) {
      alert(e.message || '민원 상태 변경에 실패했습니다.');
    } finally {
      setStatusSubmitting(false);
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
        'COMPLAIN',
        Number(id),
        pendingImages.map((p) => p.file)
      );
      const files = await supportApi
        .getFilesByParent('COMPLAIN', Number(id))
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

  /** 관리자 답변 등록 / 수정 */
  const handleCreateReply = async () => {
    if (!replyCtnt.trim()) return alert('답변 내용을 입력해주세요.');
    setReplySubmitting(true);
    try {
      const updated = await supportApi.createComplainReply(id, {
        replyCtnt,
        compSt: replyStatus,
      });
      setData((prev) => ({
        ...prev,
        ...(updated ?? {}),
        replyCk: 'Y',
        replyCtnt: updated?.replyCtnt ?? replyCtnt,
        compSt: updated?.compSt ?? replyStatus,
      }));
      alert('답변이 등록되었습니다.');
    } catch (e) {
      alert(e.message || '답변 등록에 실패했습니다.');
    } finally {
      setReplySubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* ── 민원 본문 카드 ── */}
      <div className={styles.card}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 8,
          }}
        >
          <h2 className={styles.cardTitle} style={{ margin: 0 }}>
            {data.compTitle}
          </h2>
          <span
            className={styles.statusBadge}
            style={
              data.compSt === 'resolved'
                ? { background: 'var(--highlight)' }
                : {}
            }
          >
            {STATUS_MAP[data.compSt] ?? data.compSt}
          </span>
        </div>

        <div className={styles.cardMeta} style={{ marginBottom: 8 }}>
          {data.createdAt ? data.createdAt.slice(0, 10) : '-'}
        </div>
        {isAdmin && (
          <div className={styles.cardMeta} style={{ marginBottom: 8 }}>
            작성자 ID: {data.userId || '-'}
          </div>
        )}

        {/* AI 중요도 표시 */}
        {data.importance &&
          (() => {
            const imp = IMPORTANCE_MAP[data.importance];
            return imp ? (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 16,
                  padding: '6px 14px',
                  borderRadius: 8,
                  background: imp.bg,
                  border: `1px solid ${imp.color}22`,
                }}
              >
                <span
                  style={{ fontWeight: 700, color: imp.color, fontSize: 13 }}
                >
                  AI 중요도: {imp.label}
                </span>
                {data.aiReason && (
                  <span style={{ color: 'var(--muted)', fontSize: 12 }}>
                    — {data.aiReason}
                  </span>
                )}
              </div>
            ) : null;
          })()}
        {!data.importance && <div style={{ marginBottom: 16 }} />}

        <div style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
          {data.compCtnt}
        </div>

        {/* 첨부 이미지 */}
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

        {/* 사진 추가 (본인/관리자) */}
        {canEdit && (
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
              style={{ marginBottom: 8, fontSize: 13 }}
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

        {/* 처리상태 변경 + 수정/삭제 버튼 (관리자/본인) */}
        {canEdit && (
          <>
            <div
              style={{
                marginTop: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {isAdmin && (
                <>
                  <select
                    className={styles.formSelect}
                    value={statusValue}
                    onChange={(e) => setStatusValue(e.target.value)}
                    disabled={statusSubmitting}
                    style={{ maxWidth: 180 }}
                  >
                    <option value="received">접수완료</option>
                    <option value="in_progress">처리중</option>
                    <option value="resolved">처리완료</option>
                  </select>
                  <button
                    className={styles.buttonPrimary}
                    onClick={handleUpdateStatus}
                    disabled={statusSubmitting}
                  >
                    {statusSubmitting ? '변경 중...' : '처리상태 변경'}
                  </button>
                </>
              )}
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <button
                className={styles.buttonPrimary}
                onClick={() => navigate(`/support/complain/edit/${id}`)}
              >
                수정
              </button>
              {canDelete && (
                <button className={styles.pageBtn} onClick={handleDelete}>
                  삭제
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── 관리자 답변 표시 (replyCk=Y이고 내용 있을 때) ── */}
      {hasReply && data.replyCtnt && (
        <div
          className={styles.card}
          style={{
            borderColor: 'var(--primary)',
            background: 'var(--b-5)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 12,
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'var(--primary)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              A
            </span>
            <span
              style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}
            >
              관리자 답변
            </span>
            {data.updatedAt && (
              <span
                style={{
                  fontSize: 13,
                  color: 'var(--muted)',
                  marginLeft: 'auto',
                }}
              >
                {data.updatedAt.slice(0, 10)}
              </span>
            )}
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              lineHeight: 1.8,
              color: 'var(--muted)',
              whiteSpace: 'pre-wrap',
            }}
          >
            {data.replyCtnt}
          </p>
        </div>
      )}

      {/* ── 관리자 답변 입력 카드 ── */}
      {isAdmin && (
        <div className={styles.card}>
          <h3
            style={{
              fontSize: 16,
              fontWeight: 700,
              marginBottom: 16,
              color: 'var(--text)',
            }}
          >
            {hasReply ? '✏️ 답변 수정' : '💬 답변 등록'}
          </h3>

          <label className={styles.formLabel}>처리 완료 상태</label>
          <select
            className={styles.formSelect}
            value={replyStatus}
            onChange={(e) => setReplyStatus(e.target.value)}
            disabled={replySubmitting}
            style={{ maxWidth: 200 }}
          >
            <option value="in_progress">처리중</option>
            <option value="resolved">처리완료</option>
          </select>

          <label className={styles.formLabel}>답변 내용</label>
          <textarea
            className={styles.formTextarea}
            placeholder="입주민에게 전달할 답변 내용을 입력하세요."
            value={replyCtnt}
            onChange={(e) => setReplyCtnt(e.target.value)}
            disabled={replySubmitting}
            style={{ minHeight: 120 }}
          />

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              className={styles.buttonPrimary}
              onClick={handleCreateReply}
              disabled={replySubmitting}
            >
              {replySubmitting
                ? '등록 중...'
                : hasReply
                  ? '답변 수정'
                  : '답변 등록'}
            </button>
          </div>
        </div>
      )}

      <button
        className={styles.pageBtn}
        onClick={() => navigate(complainListPath)}
        style={{ marginTop: 8 }}
      >
        목록으로
      </button>
    </div>
  );
}
