import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supportApi } from '../api/supportApi';
import styles from './Support.module.css';

export default function ComplainEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    compTitle: '',
    compCtnt: '',
  });

  useEffect(() => {
    fetchDetail();
  }, []);

  const fetchDetail = async () => {
    const res = await supportApi.getComplainDetail(id);
    setForm({
      compTitle: res.compTitle,
      compCtnt: res.compCtnt,
    });
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await supportApi.updateComplain(id, form);
    alert('수정 완료');
    navigate(`/support/complain/${id}`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>민원 수정</h2>

        <form onSubmit={handleSubmit}>
          <input
            name="compTitle"
            value={form.compTitle}
            onChange={handleChange}
          />

          <textarea
            name="compCtnt"
            value={form.compCtnt}
            onChange={handleChange}
          />

          <button className={styles.buttonPrimary} type="submit">
            수정
          </button>
        </form>
      </div>
    </div>
  );
}
