import { useState } from "react";
import { useNavigate } from "react-router-dom";

/* ───────────────── ICONS ───────────────── */

const KakaoIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.748 1.67 5.16 4.2 6.624L5.1 21l4.62-2.4A11.4 11.4 0 0 0 12 18.6c5.523 0 10-3.477 10-7.8S17.523 3 12 3z" />
  </svg>
);

const NaverIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z" />
  </svg>
);

const AppleIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83" />
  </svg>
);

const PenIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

/* ───────────────── PROVIDERS ───────────────── */

const socialProviders = [
  {
    id: "kakao",
    label: "카카오로 계속하기",
    bg: "#FEE500",
    color: "#191919",
    hoverBg: "#e6cf00",
    icon: KakaoIcon,
  },
  {
    id: "naver",
    label: "네이버로 계속하기",
    bg: "#03C75A",
    color: "#ffffff",
    hoverBg: "#02b04d",
    icon: NaverIcon,
  },
  {
    id: "apple",
    label: "애플로 계속하기",
    bg: "#000000",
    color: "#ffffff",
    hoverBg: "#222222",
    icon: AppleIcon,
  },
];

/* ───────────────── MAIN ───────────────── */

export default function JoinSelect() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(null);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f6fa",
        padding: 20,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 24,
          padding: 40,
          width: "100%",
          maxWidth: 440,
          boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
          textAlign: "center",
        }}
      >
        {/* 로고 정확히 중앙 */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <img
            src="/logo_blue.png"
            alt="logo"
            style={{
              width: 120,
              display: "block",
            }}
          />
        </div>

        <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 24 }}>
          이메일로 회원가입하거나
          <br />
          기존 소셜 계정으로 빠르게 가입하세요.
        </p>

        {/* 일반 회원가입 */}
        <button
          onClick={() => navigate("/auth/join/joinnormal")}
          style={{
            width: "100%",
            height: 52,
            borderRadius: 12,
            border: "1.5px solid #dde1e9",
            background: "#fff",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <PenIcon />
          일반 회원가입
        </button>

        <div style={{ height: 1, background: "#e8eaed", margin: "16px 0" }} />

        {/* 소셜 버튼들 */}
        {socialProviders.map((p) => {
          const Icon = p.icon;
          return (
            <button
              key={p.id}
              onClick={() => alert("준비 중")}
              onMouseEnter={() => setHovered(p.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                width: "100%",
                height: 52,
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
                fontSize: 15,
                fontWeight: 600,
                marginBottom: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                background: hovered === p.id ? p.hoverBg : p.bg,
                color: p.color,
              }}
            >
              <Icon />
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
