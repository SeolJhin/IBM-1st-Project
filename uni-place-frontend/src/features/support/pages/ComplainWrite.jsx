import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supportApi } from '../api/supportApi';
import styles from './Support.module.css';

export default function ComplainWrite() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    compTitle: '',
    compCtnt: '',
    code: '',
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await supportApi.createComplain(form);
    alert('등록 완료');
    navigate('/support/complain');
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles.container}>
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>민원 작성</h2>

          <input
            name="compTitle"
            placeholder="제목"
            value={form.compTitle}
            onChange={handleChange}
          />

          <textarea
            name="compCtnt"
            placeholder="내용"
            value={form.compCtnt}
            onChange={handleChange}
          />

          <input
            name="code"
            placeholder="민원 유형 코드"
            value={form.code}
            onChange={handleChange}
          />

          <button type="submit">등록</button>
        </div>
      </div>
    </form>
  );
}
