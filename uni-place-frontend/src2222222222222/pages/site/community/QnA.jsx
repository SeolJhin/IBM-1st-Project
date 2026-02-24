import { useState } from "react";
import PageHeader from "../components/PageHeader";
import { ChevronDown, Search } from "lucide-react";

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
    type: "질문해요",
    title: "페스티벌 사전 신청은 어디에서 진행하나요?",
    date: "2026.02.12",
    reply: {
      author: "관리자",
      content:
        "페스티벌 사전 신청은 메인 페이지 상단 배너 또는 '이벤트' 메뉴에서 진행하실 수 있습니다.",
      date: "2026.02.13",
    },
  },
  {
    id: 2,
    category: "pupoo",
    type: "질문해요",
    title: "행사 참여 시 반려견 등록증이 필요한가요?",
    date: "2025.10.30",
    reply: null,
  },
  {
    id: 3,
    category: "pupoo",
    type: "질문해요",
    title: "실시간 인기 반려견 투표는 하루 몇 번까지 가능한가요?",
    date: "2025.10.29",
    reply: {
      author: "관리자",
      content:
        "실시간 인기 반려견 투표는 계정당 하루 최대 3회까지 참여하실 수 있습니다.",
      date: "2025.10.30",
    },
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
  const [openReplies, setOpenReplies] = useState({});

  const toggleReply = (id) => {
    setOpenReplies((prev) => ({ ...prev, [id]: !prev[id] }));
  };

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
        title="질문 답변"
        subtitle="서비스 이용과 관련된 문의사항을 등록하고 답변을 확인할 수 있습니다."
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

            <div
              style={{
                display: "flex",
                alignItems: "center",
                border: "1px solid #ccc",
                borderRadius: "6px",
                overflow: "hidden",
                background: "#fff",
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
            <div key={notice.id} style={{ borderBottom: "1px solid #e8e8e8" }}>
              {/* 질문 행 */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "18px 4px",
                  cursor: notice.reply ? "pointer" : "default",
                  transition: "background 0.15s",
                  gap: "0",
                }}
                onClick={() => notice.reply && toggleReply(notice.id)}
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

                {/* 답변완료 뱃지 (답변 있을 때만) */}
                {notice.reply && (
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: "600",
                      color: "#4a7cf7",
                      border: "1px solid #4a7cf7",
                      borderRadius: "20px",
                      padding: "2px 9px",
                      marginRight: "12px",
                      whiteSpace: "nowrap",
                      letterSpacing: "0.01em",
                      display: "flex",
                      alignItems: "center",
                      gap: "3px",
                    }}
                  >
                    답변완료
                    <span
                      style={{
                        display: "inline-flex",
                        transition: "transform 0.2s ease",
                        transform: openReplies[notice.id]
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                      }}
                    >
                      <ChevronDown size={11} strokeWidth={2.5} />
                    </span>
                  </span>
                )}

                {/* 미답변 뱃지 */}
                {!notice.reply && (
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: "600",
                      color: "#999",
                      border: "1px solid #ccc",
                      borderRadius: "20px",
                      padding: "2px 9px",
                      marginRight: "12px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    미답변
                  </span>
                )}

                <span
                  style={{
                    fontSize: "13px",
                    color: "#999",
                    whiteSpace: "nowrap",
                  }}
                >
                  {notice.date}
                </span>
              </div>

              {/* 답변 행 (토글) */}
              {notice.reply && openReplies[notice.id] && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    padding: "14px 4px 16px 4px",
                    background: "#f7f9ff",
                    borderTop: "1px dashed #dde6ff",
                    gap: "0",
                  }}
                >
                  {/* re: 아이콘 영역 */}
                  <span
                    style={{
                      minWidth: "64px",
                      fontSize: "13px",
                      fontWeight: "700",
                      color: "#4a7cf7",
                      paddingTop: "1px",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    re:
                  </span>

                  {/* 답변자 */}
                  <span
                    style={{
                      color: "#4a7cf7",
                      fontWeight: "600",
                      fontSize: "13px",
                      minWidth: "80px",
                      paddingTop: "1px",
                    }}
                  >
                    {notice.reply.author}
                  </span>

                  {/* 답변 내용 */}
                  <span
                    style={{
                      flex: 1,
                      fontSize: "14px",
                      color: "#444",
                      fontWeight: "400",
                      lineHeight: "1.5",
                    }}
                  >
                    {notice.reply.content}
                  </span>

                  {/* 답변 날짜 */}
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#aaa",
                      marginLeft: "16px",
                      whiteSpace: "nowrap",
                      paddingTop: "2px",
                    }}
                  >
                    {notice.reply.date}
                  </span>
                </div>
              )}
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
