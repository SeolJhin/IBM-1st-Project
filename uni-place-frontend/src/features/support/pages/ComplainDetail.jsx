import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supportApi } from '../api/supportApi';
import styles from './Support.module.css';

export default function ComplainDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchDetail();
  }, []);

  const fetchDetail = async () => {
    const res = await supportApi.getComplainDetail(id);
    setData(res);
  };

  const statusMap = {
    in_progress: '처리중',
    resolved: '처리완료',
  };

  const handleDelete = async () => {
    try {
      await supportApi.deleteComplain(id);
      alert('삭제 완료');
      navigate('/support/complain');
    } catch (e) {
      alert(e.message);
    }
  };

  if (!data) return <div>로딩중...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>{data.compTitle}</h2>

        <p style={{ margin: '20px 0' }}>{data.compCtnt}</p>

        <div className={styles.cardMeta}>
          상태:
          <span className={styles.statusBadge}>{statusMap[data.compSt]}</span>
        </div>

        <div style={{ marginTop: '30px' }}>
          <button
            className={styles.buttonPrimary}
            onClick={() => navigate(`/support/complain/edit/${id}`)}
          >
            수정
          </button>
          &nbsp;&nbsp;
          <button onClick={handleDelete}>삭제</button>
        </div>
      </div>
    </div>
  );
}
