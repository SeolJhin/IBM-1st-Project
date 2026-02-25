import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./PageHeader.module.css";

export default function PageHeader({ title, subtitle, categories = [] }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className={styles.pageHeader}>
      <div className={styles.inner}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}

        {categories.length > 0 ? (
          <div className={styles.tabs}>
            {categories.map((cat, i) => {
              const isActive = location.pathname === cat.path;
              const isHovered = hoveredIdx === i;

              const classNames = [
                styles.tabBase,
                isActive ? styles.tabActive : styles.tabDefault,
                isHovered && !isActive ? styles.tabHover : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <button
                  key={cat.path}
                  type="button"
                  className={classNames}
                  onClick={() => navigate(cat.path)}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  aria-current={isActive ? "page" : undefined}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
