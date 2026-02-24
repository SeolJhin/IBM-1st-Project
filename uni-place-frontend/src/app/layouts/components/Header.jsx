import React from "react";
import styles from "./Header.module.css";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div
          className={styles.brand}
          onClick={() => navigate("/")}
          role="button"
          tabIndex={0}
        >
          <div className={styles.logoMark} />
          <div className={styles.brandText}>
            <div className={styles.brandName}>UNI PLACE</div>
            <div className={styles.brandSub}>Co-living Platform</div>
          </div>
        </div>

        <nav className={styles.nav}>
          <button
            className={styles.linkBtn}
            type="button"
            onClick={() => navigate("/company_info")}
          >
            회사소개
          </button>
          <button
            className={styles.linkBtn}
            type="button"
            onClick={() => navigate("/community")}
          >
            커뮤니티
          </button>
          <button
            className={styles.linkBtn}
            type="button"
            onClick={() => navigate("/membership")}
          >
            방찾기
          </button>
        </nav>

        <div className={styles.icons}>
          <button
            className={styles.iconBtn}
            type="button"
            aria-label="search"
            onClick={() => navigate("/search")}
          >
            검색
          </button>
          <button
            className={styles.iconBtn}
            type="button"
            aria-label="login"
            onClick={() => navigate("/login")}
          >
            로그인
          </button>
        </div>
      </div>
    </header>
  );
}
