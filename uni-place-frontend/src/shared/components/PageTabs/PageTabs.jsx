import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./PageTabs.module.css";

export default function PageTabs({ categories = [], activeTab, onTabChange }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  if (!categories.length) return null;

  return (
    <div className={styles.tabBar}>
      <div className={styles.tabInner}>
        {categories.map((cat, i) => {
          const isActive = cat.tab
            ? activeTab === cat.tab
            : location.pathname === cat.path;

          return (
            <button
              key={cat.tab || cat.path}
              type="button"
              className={[styles.tabBtn, isActive ? styles.tabActive : ""].filter(Boolean).join(" ")}
              onClick={() => {
                if (cat.tab && onTabChange) onTabChange(cat.tab);
                else navigate(cat.path);
              }}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              aria-current={isActive ? "page" : undefined}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
