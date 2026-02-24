import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { LogIn, UserPlus, UserCircle } from "lucide-react";

/* ─────────────────────────────────────────────
   ICONS
───────────────────────────────────────────── */
const IconButtonWithTooltip = ({ children, tooltip, to }) => {
  const [hovered, setHovered] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);

  const handleMouseEnter = () => {
    setHovered(true);
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setTooltipPos({
        top: rect.bottom + 10,
        left: rect.left + rect.width / 2,
      });
    }
  };

  return (
    <div
      ref={btnRef}
      style={{ position: "relative", display: "inline-block" }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setHovered(false)}
    >
      <Link to={to} style={{ display: "inline-block" }}>
        <button
          className="pupoo-icon-btn"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px",
          }}
        >
          {children}
        </button>
      </Link>

      {/* Tooltip — createPortal로 body에 직접 렌더링 (header stacking context 밖) */}
      {hovered &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: tooltipPos.top + "px",
              left: tooltipPos.left + "px",
              transform: "translateX(-50%)",
              backgroundColor: "#262626",
              color: "#ffffff",
              fontSize: "12px",
              padding: "6px 10px",
              borderRadius: "6px",
              whiteSpace: "nowrap",
              pointerEvents: "none",
              zIndex: 99999,
            }}
          >
            {tooltip}

            {/* 말풍선 꼬리 */}
            <div
              style={{
                position: "absolute",
                bottom: "100%",
                left: "50%",
                transform: "translateX(-50%)",
                width: 0,
                height: 0,
                borderLeft: "6px solid transparent",
                borderRight: "6px solid transparent",
                borderBottom: "6px solid #262626",
              }}
            />
          </div>,
          document.body,
        )}
    </div>
  );
};

const ChevronIcon = ({ isOpen }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{
      marginLeft: "4px",
      transition: "transform 0.2s ease",
      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
      display: "inline-block",
      verticalAlign: "middle",
    }}
  >
    <path
      d="M2 4L6 8L10 4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ArrowRight = ({ color = "#1c69d4" }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{
      display: "inline-block",
      verticalAlign: "middle",
      marginLeft: "4px",
    }}
  >
    <path
      d="M3 8H13M13 8L9 4M13 8L9 12"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/* ─────────────────────────────────────────────
   NAV DATA  (categories & routes from Code 1)
───────────────────────────────────────────── */
const megaMenuData = {
  행사: {
    columns: [
      {
        title: "행사 안내",
        items: [
          { label: "현재 진행 행사", href: "/event/current" },
          { label: "예정 행사", href: "/event/upcoming" },
          { label: "종료 행사", href: "/event/closed" },
          { label: "행사 사전 등록", href: "/event/preregister" },
          { label: "행사 일정 안내", href: "/event/eventSchedule" },
        ],
      },
      {
        title: "프로그램/참여",
        items: [
          { label: "체험존 안내", href: "/program/experience" },
          { label: "세션 · 강연", href: "/program/session" },
          { label: "프로그램 안내", href: "/program/schedule" },
          { label: "콘테스트 · 투표", href: "/program/contest" },
          { label: "부스 안내", href: "/program/booth" },
        ],
      },
    ],
    promo: {
      image: "https://picsum.photos/600/400",
      description: "오직 온라인에서만 만나볼 수 있는 pupoo를 경험해보세요.",
      ctaLabel: "pupoo 샵 온라인 바로가기",
      ctaHref: "#shop-online",
    },
  },
  커뮤니티: {
    columns: [
      {
        title: "소통공간",
        items: [
          { label: "자유 게시판", href: "/community/freeboard" },
          { label: "공지사항", href: "/community/notice" },
          { label: "행사 후기", href: "/community/review" },
          { label: "질문 · 답변", href: "/community/qna" },
        ],
      },
      {
        title: "미디어",
        items: [
          { label: "참가자 갤러리", href: "/gallery/eventgallery" },
          { label: "현장 스케치", href: "/gallery/eventsketch" },
        ],
      },
    ],
    promo: {
      image: "https://picsum.photos/600/400",
      description: "오직 온라인에서만 만나볼 수 있는 pupoo를 경험해보세요.",
      ctaLabel: "pupoo 샵 온라인 바로가기",
      ctaHref: "#shop-online",
    },
  },

  참가신청: {
    columns: [
      {
        title: "참가신청",
        items: [
          { label: "행사 참가 신청", href: "/registration/apply" },
          { label: "신청 내역 조회", href: "/registration/applyhistory" },
          { label: "결제 내역", href: "/registration/paymenthistory" },
          { label: "QR 체크인", href: "/registration/qrcheckin" },
        ],
      },
      {
        title: "참여 안내",
        items: [
          { label: "현장 운영 안내", href: "/guide/operation" },
          { label: "장소/오시는길", href: "/guide/location" },
        ],
      },
    ],
    promo: {
      image: "https://picsum.photos/600/400",
      description: "오직 온라인에서만 만나볼 수 있는 pupoo를 경험해보세요.",
      ctaLabel: "pupoo 샵 온라인 바로가기",
      ctaHref: "#shop-online",
    },
  },
  실시간현황: {
    columns: [
      {
        title: "실시간 현황",
        items: [
          { label: "통합 현황", href: "/realtime/dashboard" },
          { label: "대기 현황", href: "/realtime/waitingstatus" },
          { label: "체크인 현황", href: "/realtime/checkinstatus" },
          { label: "투표 현황", href: "/realtime/votestatus" },
        ],
      },
    ],
    promo: {
      image: "https://picsum.photos/600/400",
      description: "오직 온라인에서만 만나볼 수 있는 pupoo를 경험해보세요.",
      ctaLabel: "pupoo 샵 온라인 바로가기",
      ctaHref: "#shop-online",
    },
  },
};

/* Top-level nav items (from Code 1) */
const navItems = [
  { label: "행사", hasDropdown: true, menuKey: "행사" },
  { label: "커뮤니티", hasDropdown: true, menuKey: "커뮤니티" },
  { label: "참가신청", hasDropdown: true, menuKey: "참가신청" },
  { label: "실시간현황", hasDropdown: true, menuKey: "실시간현황" },
];
/* ─────────────────────────────────────────────
   MEGA MENU ITEM
───────────────────────────────────────────── */
const MegaMenuItem = ({ item }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href={item.href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "block",
        color: hovered ? "#1c69d4" : "#262626",
        fontSize: "14px",
        fontFamily: "'Noto Sans KR', 'Helvetica Neue', Arial, sans-serif",
        fontWeight: "400",
        lineHeight: "1.4",
        padding: "8px 0",
        textDecoration: "none",
        transition: "color 0.15s ease",
        letterSpacing: "0.01em",
      }}
    >
      {item.label}
    </a>
  );
};

/* ─────────────────────────────────────────────
   MEGA MENU PANEL
───────────────────────────────────────────── */
const MegaMenu = ({ menuData }) => {
  if (!menuData) return null;
  const { columns, promo } = menuData;

  return (
    <div
      style={{
        position: "absolute",
        top: "100%",
        left: 0,
        right: 0,
        backgroundColor: "rgba(255,255,255,0.97)",
        backdropFilter: "blur(12px)",
        borderTop: "1px solid #e0e0e0",
        boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
        zIndex: 1000,
        padding: "40px 0 48px",
      }}
    >
      <div
        style={{
          maxWidth: "1440px",
          margin: "0 auto",
          padding: "0 80px",
          display: "flex",
          gap: "0",
          alignItems: "flex-start",
        }}
      >
        {/* Left columns */}
        <div style={{ display: "flex", gap: "80px", flex: "1" }}>
          {columns.map((col, i) => (
            <div key={i} style={{ minWidth: "200px" }}>
              <div
                style={{
                  fontSize: "22px",
                  fontFamily:
                    "'Noto Sans KR', 'Helvetica Neue', Arial, sans-serif",
                  fontWeight: "700",
                  color: "#262626",
                  marginBottom: "20px",
                  letterSpacing: "-0.01em",
                  lineHeight: "1.2",
                }}
              >
                {col.title}
              </div>
              <div>
                {col.items.map((item, j) => (
                  <MegaMenuItem key={j} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Right promo area */}
        {promo && (
          <div style={{ width: "380px", flexShrink: 0, marginLeft: "40px" }}>
            <div
              style={{
                width: "100%",
                aspectRatio: "380/240",
                overflow: "hidden",
                backgroundColor: "#1a1a1a",
              }}
            >
              <img
                src={promo.image}
                alt="pupoo promo"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.parentElement.innerHTML = `
                    <div style="width:100%;height:100%;background:linear-gradient(135deg,#0a0a0a 0%,#1a1a2e 30%,#16213e 60%,#0f3460 100%);display:flex;align-items:center;justify-content:center;">
                      <svg width="120" height="60" viewBox="0 0 120 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <ellipse cx="60" cy="50" rx="55" ry="6" fill="rgba(255,255,255,0.05)"/>
                        <path d="M15 42 Q30 28 60 30 Q90 28 105 42 L100 44 Q85 35 60 36 Q35 35 20 44 Z" fill="rgba(255,255,255,0.15)"/>
                        <path d="M25 36 Q35 24 60 26 Q85 24 95 36 L92 38 Q82 28 60 30 Q38 28 28 38 Z" fill="rgba(255,255,255,0.1)"/>
                        <circle cx="35" cy="44" r="5" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>
                        <circle cx="85" cy="44" r="5" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>
                      </svg>
                    </div>
                  `;
                }}
              />
            </div>
            <p
              style={{
                margin: "16px 0 12px",
                fontSize: "15px",
                fontFamily:
                  "'Noto Sans KR', 'Helvetica Neue', Arial, sans-serif",
                fontWeight: "400",
                color: "#262626",
                lineHeight: "1.5",
                letterSpacing: "0.01em",
              }}
            >
              {promo.description}
            </p>
            <a
              href={promo.ctaHref}
              style={{
                display: "inline-flex",
                alignItems: "center",
                color: "#1c69d4",
                fontSize: "14px",
                fontFamily:
                  "'Noto Sans KR', 'Helvetica Neue', Arial, sans-serif",
                fontWeight: "700",
                textDecoration: "none",
                letterSpacing: "0.01em",
              }}
            >
              {promo.ctaLabel}
              <ArrowRight color="#1c69d4" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   INDIVIDUAL NAV BUTTON / LINK
───────────────────────────────────────────── */
const NavItem = ({
  label,
  hasDropdown,
  isActive,
  onClick,
  href,
  isScrolled,
  isMenuOpen,
  isHome,
}) => {
  const [hovered, setHovered] = useState(false);

  /* Decide text colour:
     - When header is transparent (top + no open menu): white
     - When header has background (scrolled OR menu open): dark, active → blue */
  const isLight = isHome && !isScrolled && !isMenuOpen;

  const baseColor = isLight ? "#ffffff" : "#262626";
  const activeColor = "rgb(47, 85, 255)";
  const computedColor = isActive || hovered ? activeColor : baseColor;

  if (!hasDropdown) {
    return (
      <a
        href={href || "#"}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: "relative",
          display: "inline-flex",
          alignItems: "center",
          height: "100%",
          padding: "0 4px",
          color: computedColor,
          fontSize: "14px",
          fontFamily: "'Noto Sans KR', 'Helvetica Neue', Arial, sans-serif",
          fontWeight: "400",
          textDecoration: "none",
          whiteSpace: "nowrap",
          letterSpacing: "0.01em",
          transition: "color 0.2s ease",
          cursor: "pointer",
        }}
      >
        {label}
        <span
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "2px",
            backgroundColor: "#1c69d4",
            transform: hovered ? "scaleX(1)" : "scaleX(0)",
            transition: "transform 0.2s ease",
            transformOrigin: "center",
          }}
        />
      </a>
    );
  }

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        height: "100%",
        padding: "0 4px",
        background: "none",
        border: "none",
        color: computedColor,
        fontSize: "14px",
        fontFamily: "'Noto Sans KR', 'Helvetica Neue', Arial, sans-serif",
        fontWeight: "400",
        whiteSpace: "nowrap",
        letterSpacing: "0.01em",
        cursor: "pointer",
        transition: "color 0.2s ease",
        outline: "none",
      }}
    >
      {label}
      <ChevronIcon isOpen={isActive} />
      <span
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "3px",
          backgroundColor: "#1c69d4",
          transform: isActive ? "scaleX(1)" : "scaleX(0)",
          transition: "transform 0.2s ease",
          transformOrigin: "center",
        }}
      />
    </button>
  );
};

/* ─────────────────────────────────────────────
   MAIN HEADER
───────────────────────────────────────────── */
export default function pupooHeader() {
  const [activeMenu, setActiveMenu] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef(null);
  const location = useLocation();
  const isHome = location.pathname === "/";

  /* Scroll detection */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Close mega menu on outside click */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNavClick = (menuKey) => {
    setActiveMenu((prev) => (prev === menuKey ? null : menuKey));
  };

  /* Header is "white mode" when scrolled OR a mega menu is open */
  const isWhiteMode = !isHome || scrolled || activeMenu !== null;

  /* Icon colour follows header mode */
  const iconColor = isWhiteMode ? "#262626" : "#ffffff";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap');
      
        body { font-family: 'Noto Sans KR', 'Helvetica Neue', Arial, sans-serif; }

        .pupoo-header-root {
          font-family: 'Noto Sans KR', 'Helvetica Neue', Arial, sans-serif;
        }

      `}</style>

      <div
        className="pupoo-header-root"
        ref={headerRef}
        style={{ position: "relative", zIndex: 3000 }}
      >
        {/* ── Header bar ── */}
        <header
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "70px",
            display: "flex",
            alignItems: "stretch",
            zIndex: 1000,
            /* Smooth background + shadow transition */
            backgroundColor: isWhiteMode
              ? "rgba(255,255,255,0.97)"
              : "transparent",
            backdropFilter: isWhiteMode ? "blur(12px)" : "none",
            borderBottom:
              isWhiteMode && !activeMenu ? "1px solid #e0e0e0" : "none",
            transition:
              "background-color 0.3s ease, border-bottom 0.3s ease, backdrop-filter 0.3s ease",
          }}
        >
          <div
            style={{
              maxWidth: "1400px",
              width: "100%",
              margin: "0 auto",
              padding: "0 25px",
              display: "flex",
              alignItems: "stretch",
              justifyContent: "space-between",
            }}
          >
            {/* Left: Logo + Nav */}
            <div
              style={{ display: "flex", alignItems: "stretch", gap: "32px" }}
            >
              {/* 로고 */}
              <Link
                to="/"
                style={{
                  display: "flex",
                  alignItems: "center",
                  textDecoration: "none",
                  marginRight: "8px",
                  flexShrink: 0,
                }}
              >
                <img
                  src={
                    isHome && !scrolled && activeMenu === null
                      ? "/logo_white.png"
                      : "/logo_blue.png"
                  }
                  alt="Pupoo Logo"
                  style={{
                    height: "25px",
                    width: "auto",
                    display: "block",
                    objectFit: "contain",
                  }}
                />
              </Link>

              {/* Nav items */}
              <nav
                style={{ display: "flex", alignItems: "stretch", gap: "28px" }}
              >
                {navItems.map((item) => (
                  <NavItem
                    key={item.label}
                    label={item.label}
                    hasDropdown={item.hasDropdown}
                    isActive={activeMenu === item.menuKey}
                    onClick={() =>
                      item.hasDropdown && handleNavClick(item.menuKey)
                    }
                    href={item.href}
                    isScrolled={scrolled}
                    isMenuOpen={activeMenu !== null}
                    isHome={isHome}
                  />
                ))}
              </nav>
            </div>

            {/* Right: Icons */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <IconButtonWithTooltip to="/auth/login" tooltip="로그인">
                <LogIn size={23} color={iconColor} strokeWidth={1.5} />
              </IconButtonWithTooltip>

              <IconButtonWithTooltip
                to="/auth/join/joinselect"
                tooltip="회원가입"
              >
                <UserPlus size={23} color={iconColor} strokeWidth={1.5} />
              </IconButtonWithTooltip>

              <IconButtonWithTooltip to="/mypage" tooltip="마이페이지">
                <UserCircle size={23} color={iconColor} strokeWidth={1.5} />
              </IconButtonWithTooltip>
            </div>
          </div>
        </header>

        {/* ── Mega menu panel ── */}
        {activeMenu && megaMenuData[activeMenu] && (
          <div
            style={{
              position: "fixed",
              top: "70px",
              left: 0,
              right: 0,
              zIndex: 1000,
            }}
          >
            <MegaMenu menuData={megaMenuData[activeMenu]} />
          </div>
        )}
      </div>
    </>
  );
}
