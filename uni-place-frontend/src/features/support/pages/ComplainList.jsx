import { useEffect, useState } from 'react';
import { supportApi } from '../api/supportApi';
import { Link } from 'react-router-dom';
import styles from './Support.module.css';

export default function ComplainList() {
  const [complains, setComplains] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await supportApi.getMyComplains();
      console.log('🔥 응답:', res);

      // res가 이미 data를 반환하므로
      setComplains(res?.content ?? []);
    } catch (e) {
      console.error(e);
      setComplains([]);
    }
  };

  const statusMap = {
    in_progress: '처리중',
    resolved: '처리완료',
  };
  console.log('🔥 complains 상태:', complains);
  return (
    <div className={styles.container}>
      <Link to="/support/complain/write">
        <button className={styles.buttonPrimary}>민원 작성</button>
      </Link>

      <table className={styles.table}>
        {' '}
        <thead>
          <tr>
            <th>ID</th>
            <th>제목</th>
            <th>상태</th>
          </tr>
        </thead>
        <tbody>
          {complains.map((item) => (
            <tr key={item.compId}>
              <td>{item.compId}</td>
              <td>
                <Link to={`/support/complain/${item.compId}`}>
                  {item.compTitle}
                </Link>
              </td>
              <td>
                <span className={styles.statusBadge}>
                  {statusMap[item.compSt]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
