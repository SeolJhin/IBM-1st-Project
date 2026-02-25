import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const styles = {
  pageHeader: {
    backgroundColor: "#fff",
    borderBottom: "1px solid #e9ecef",
    paddingTop: 100,
  },
  inner: {
    maxWidth: 1400,
    margin: "0 auto",
    padding: "0 24px",
  },
  title: {
    fontSize: 22,
    fontWeight: 800,
    color: "#111827",
    margin: "0 0 4px",
  },
  subtitle: {
    fontSize: 13.5,
    color: "#6b7280",
    fontWeight: 400,
    margin: "0 0 20px",
  },
  tabs: {
    display: "flex",
    gap: 0,
  },
  tabBase: {
    padding: "10px 20px",
    fontSize: 13.5,
    fontWeight: 600,
    background: "none",
    border: "none",
    cursor: "pointer",
    borderBottom: "2.5px solid transparent",
    transition: "all 0.15s",
    fontFamily: "inherit",
  },
  tabDefault: {
    color: "#6b7280",
  },
  tabActive: {
    color: "#1a4fd6",
    borderBottomColor: "#1a4fd6",
  },
  tabHover: {
    color: "#1a4fd6",
  },
};

export default function PageHeader({ title, subtitle, categories }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div style={styles.pageHeader}>
      <div style={styles.inner}>
        <h1 style={styles.title}>{title}</h1>
        {subtitle && <p style={styles.subtitle}>{subtitle}</p>}

        {categories && categories.length > 0 && (
          <div style={styles.tabs}>
            {categories.map((cat, i) => {
              const isActive = location.pathname === cat.path;
              const isHovered = hoveredIdx === i;

              let btnStyle = { ...styles.tabBase };
              if (isActive) {
                btnStyle = { ...btnStyle, ...styles.tabActive };
              } else if (isHovered) {
                btnStyle = { ...btnStyle, ...styles.tabHover };
              } else {
                btnStyle = { ...btnStyle, ...styles.tabDefault };
              }

              return (
                <button
                  key={cat.path}
                  style={btnStyle}
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
        )}
      </div>
    </div>
  );
}
