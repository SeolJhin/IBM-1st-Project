import { useState } from "react";
import PageHeader from "../components/PageHeader";
import { ChevronLeft, ChevronRight, ChevronDown, Search } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const SERVICE_CATEGORIES = [
  { label: "자유게시판", path: "/community/freeboard" },
  { label: "공지사항", path: "/community/notice" },
  { label: "행사후기", path: "/community/review" },
  { label: "질문/답변", path: "/community/qna" },
];
const NOTICES = [
  {
    id: 1,
    category: "pupoo",
    type: "운영 안내",
    title: "2026 봄 반려동물 페스티벌 사전 신청 안내",
    date: "2026.02.12",
  },
  {
    id: 2,
    category: "pupoo",
    type: "운영 안내",
    title: "2월 플랫폼 점검 및 서버 안정화 작업 안내",
    date: "2025.10.30",
  },
  {
    id: 3,
    category: "pupoo",
    type: "운영 안내",
    title: "실시간 인기 반려견 투표 기능 업데이트 안내",
    date: "2025.10.29",
  },
];

const FILTER_OPTIONS = [
  "전체",
  "자유게시판",
  "공지사항",
  "행사후기",
  "질문답변",
];

export default function ServicePage() {
  const [currentPath, setCurrentPath] = useState("/");
  const [filter, setFilter] = useState("전체");
  const [search, setSearch] = useState("");

  const filtered = NOTICES.filter((n) => {
    const matchFilter =
      filter === "전체" || n.category === filter || n.type === filter;
    const matchSearch =
      search === "" ||
      n.title.includes(search) ||
      n.category.includes(search) ||
      n.type.includes(search);
    return matchFilter && matchSearch;
  });

  return (
    <>
      <PageHeader
        title="자유게시판"
        subtitle="누구나 편하게 소통할 수 있는 게시판입니다"
        categories={SERVICE_CATEGORIES}
        currentPath={currentPath}
        onNavigate={setCurrentPath}
      />
      <main
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "40px 20px",
          fontFamily: "'Noto Sans KR', sans-serif",
        }}
      >
        {/* 상단 필터/검색 바 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: "16px",
            borderBottom: "1px solid #e0e0e0",
            marginBottom: "8px",
          }}
        >
          <span style={{ fontSize: "15px", fontWeight: "600", color: "#222" }}>
            총 {filtered.length}개
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* 드롭다운 */}
            <div style={{ position: "relative" }}>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                style={{
                  appearance: "none",
                  WebkitAppearance: "none",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  padding: "7px 32px 7px 12px",
                  fontSize: "14px",
                  color: "#333",
                  background: "#fff",
                  cursor: "pointer",
                  outline: "none",
                  minWidth: "80px",
                }}
              >
                {FILTER_OPTIONS.map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
              <span
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <ChevronDown size={14} color="#666" />
              </span>
            </div>

            {/* 검색창 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                border: "1px solid #ccc",
                borderRadius: "6px",
                overflow: "hidden",
                background: "#fff",
                transition: "border 0.15s ease",
              }}
            >
              <input
                type="text"
                placeholder="검색어를 입력하세요."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  border: "none",
                  outline: "none",
                  padding: "8px 12px",
                  fontSize: "14px",
                  color: "#333",
                  width: "240px",
                  background: "transparent",
                }}
              />

              <button
                style={{
                  border: "none",
                  background: "#fff",
                  padding: "8px 12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#f5f5f5")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "#fff")
                }
              >
                <Search size={16} strokeWidth={2} color="#555" />
              </button>
            </div>
          </div>
        </div>

        {/* 공지 목록 */}
        <div>
          {filtered.map((notice) => (
            <div
              key={notice.id}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "18px 4px",
                borderBottom: "1px solid #e8e8e8",
                cursor: "pointer",
                transition: "background 0.15s",
                gap: "0",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#f9f9f9")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <span
                style={{
                  color: "#2d2d2d",
                  fontWeight: "600",
                  fontSize: "14px",
                  minWidth: "64px",
                }}
              >
                {notice.category}
              </span>
              <span
                style={{
                  color: "#565656",
                  fontWeight: "400",
                  fontSize: "14px",
                  minWidth: "80px",
                }}
              >
                {notice.type}
              </span>
              <span
                style={{
                  flex: 1,
                  fontSize: "15px",
                  color: "#222",
                  fontWeight: "400",
                }}
              >
                {notice.title}
              </span>
              <span
                style={{
                  fontSize: "13px",
                  color: "#999",
                  marginLeft: "16px",
                  whiteSpace: "nowrap",
                }}
              >
                {notice.date}
              </span>
            </div>
          ))}

          {filtered.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "60px 0",
                color: "#999",
                fontSize: "14px",
              }}
            >
              검색 결과가 없습니다.
            </div>
          )}
        </div>

        {/* 페이지네이션 */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "12px",
            marginTop: "36px",
          }}
        >
          <button
            style={{
              background: "none",
              border: "none",
              fontSize: "16px",
              color: "#bbb",
              cursor: "pointer",
              padding: "4px 8px",
            }}
          >
            ‹
          </button>
          <span
            style={{
              fontSize: "14px",
              color: "#333",
              fontWeight: "500",
              minWidth: "20px",
              textAlign: "center",
            }}
          >
            1
          </span>
          <button
            style={{
              background: "none",
              border: "none",
              fontSize: "16px",
              color: "#bbb",
              cursor: "pointer",
              padding: "4px 8px",
            }}
          >
            ›
          </button>
        </div>
      </main>
    </>
  );
}
