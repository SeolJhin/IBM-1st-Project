import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supportApi } from '../api/supportApi';
import { useAuth } from '../../user/hooks/useAuth';
import styles from './Support.module.css';

const STATUS_MAP = {
  in_progress: '처리중',
  resolved: '처리완료',
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
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusValue, setStatusValue] = useState('in_progress');
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  const isAdmin = normalizeRole(user) === 'admin';

  useEffect(() => {
    setLoading(true);
    supportApi
      .getComplainDetail(id)
      .then((res) => {
        setData(res);
        setStatusValue(res?.compSt ?? 'in_progress');
      })
      .catch((err) =>
        setError(err.message || '민원 정보를 불러오는 데 실패했습니다.')
      )
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ padding: 24 }}>로딩중...</div>;
  if (error) return <div style={{ padding: 24, color: 'red' }}>{error}</div>;
  if (!data) return null;

  const handleDelete = async () => {
    if (!window.confirm('민원을 삭제하시겠습니까?')) return;
    try {
      await supportApi.deleteComplain(id);
      navigate('/support/complain');
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

  return (
    <div className={styles.container}>
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
            style={data.compSt === 'resolved' ? { background: 'var(--highlight)' } : {}}
          >
            {STATUS_MAP[data.compSt] ?? data.compSt}
          </span>
        </div>

        <div className={styles.cardMeta} style={{ marginBottom: 24 }}>
          {data.createdAt ? data.createdAt.slice(0, 10) : '-'}
        </div>

        <div style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{data.compCtnt}</div>

        {isAdmin && (
          <>
            <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <select
                className={styles.formSelect}
                value={statusValue}
                onChange={(e) => setStatusValue(e.target.value)}
                disabled={statusSubmitting}
                style={{ maxWidth: 180 }}
              >
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
            </div>

            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <button
                className={styles.buttonPrimary}
                onClick={() => navigate(`/support/complain/edit/${id}`)}
              >
                수정
              </button>
              <button className={styles.pageBtn} onClick={handleDelete}>
                삭제
              </button>
            </div>
          </>
        )}
      </div>

      <button
        className={styles.pageBtn}
        onClick={() => navigate('/support/complain')}
        style={{ marginTop: 16 }}
      >
        목록으로
      </button>
    </div>
  );
}

