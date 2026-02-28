// features/support/pages/ComplainDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supportApi } from '../api/supportApi';
import styles from './Support.module.css';

const STATUS_MAP = {
  in_progress: '처리중',
  resolved: '처리완료',
};

export default function ComplainDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    supportApi
      .getComplainDetail(id)
      .then((res) => setData(res))
      .catch((err) => setError(err.message || '민원 정보를 불러오는 데 실패했습니다.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('민원을 삭제하시겠습니까?')) return;
    try {
      await supportApi.deleteComplain(id);
      navigate('/support/complain');
    } catch (e) {
      alert(e.message || '삭제에 실패했습니다.');
    }
  };

  if (loading) return <div style={{ padding: 24 }}>로딩중...</div>;
  if (error) return <div style={{ padding: 24, color: 'red' }}>{error}</div>;
  if (!data) return null;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <h2 className={styles.cardTitle} style={{ margin: 0 }}>{data.compTitle}</h2>
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

        {/* 처리중일 때만 수정/삭제 가능 */}
        {data.compSt === 'in_progress' && (
          <div style={{ marginTop: 24, display: 'flex', gap: 8 }}>
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
        )}
      </div>

      <button className={styles.pageBtn} onClick={() => navigate('/support/complain')} style={{ marginTop: 16 }}>
        ← 목록으로
      </button>
    </div>
  );
}
