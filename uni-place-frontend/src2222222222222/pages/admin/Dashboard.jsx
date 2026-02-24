import { useState } from "react";
import {
  Home,
  CalendarCheck,
  Activity,
  History,
  Megaphone,
  ShieldCheck,
} from "lucide-react";

import { User, Shield, Bell } from "lucide-react";

const sidebarItems = [
  { id: "eleven", label: "홈", icon: <Home size={18} /> },
  { id: "twelve", label: "행사 관리", icon: <CalendarCheck size={18} /> },
  { id: "thirteen", label: "실시간 데이터", icon: <Activity size={18} /> },
  { id: "fourteen", label: "지난 포럼", icon: <History size={18} /> },
  { id: "fifteen", label: "플랫폼 공지", icon: <Megaphone size={18} /> },
  { id: "sixteen", label: "계정 권한 관리", icon: <ShieldCheck size={18} /> },
];

const topNavItems = [
  { id: "overview", label: "실시간 데이터" },
  { id: "tasks", label: "통계 요약", badge: 4 },
  { id: "documents", label: "접수된 행사 목록", badge: 2 },
];

const statuses = ["진행중", "예정", "종료", "취소"];

const generateRows = () =>
  Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    author: "홍길동",
    role: "부스 진행자",
    cells: [
      "2026년에 대충 열리는 대충 펫 엑스포인데 뭐 어쩔",
      "COEX",
      "2026-01-01",
      "2026-12-25",
    ],
    badge: statuses[i % statuses.length], // 여기 수정
  }));

function Avatar() {
  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        background: "#e8eaf0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#9ca3af"
        strokeWidth="1.5"
      >
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    </div>
  );
}

function Sidebar({ activeNav, setActiveNav }) {
  return (
    <aside
      style={{
        width: 220,
        minHeight: "100vh",
        background: "#fff",
        borderRight: "1px solid #e5e7eb",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "20px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src="/logo_gray.png"
          alt="Pupoo Logo"
          style={{
            height: 20,
            width: "auto",
            objectFit: "contain",
          }}
        />
      </div>

      {/* User controls */}
      <div
        style={{
          padding: "0",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 16,
        }}
      >
        {/* 공통 스타일 */}
        {[
          { icon: <User size={18} strokeWidth={1.8} /> },
          { icon: <Shield size={18} strokeWidth={1.8} /> },
        ].map((item, index) => (
          <button
            key={index}
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "#f3f4f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              cursor: "pointer",
              color: "#374151",
              transition: "all 0.2s",
              textAlign: "center",
              verticalAlign: "middle",
            }}
          >
            {item.icon}
          </button>
        ))}

        {/* 알림 */}
        <div style={{ position: "relative" }}>
          <button
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "#f3f4f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              cursor: "pointer",
              color: "#374151",
            }}
          >
            <Bell size={18} strokeWidth={1.8} />
          </button>

          <span
            style={{
              position: "absolute",
              top: -5,
              right: -2,
              background: "#ef4444",
              color: "#fff",
              fontSize: 10,
              borderRadius: "50%",
              width: 18,
              height: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 600,
            }}
          >
            9
          </span>
        </div>
      </div>

      {/* Search */}
      <div
        style={{
          padding: "18px 10px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 220,
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#f3f4f6",
            padding: "10px 10px",
            borderRadius: 6,
            transition: "all 0.2s",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#9ca3af"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>

          <input
            placeholder="검색어를 입력하세요."
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: 12,
              width: "100%",
              color: "#374151",
            }}
          />
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: "10px 10px" }}>
        {sidebarItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveNav(item.id)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 10px",
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
              background: activeNav === item.id ? "#eef2ff" : "transparent",
              color: activeNav === item.id ? "#4f46e5" : "#374151",
              fontSize: 13,
              fontWeight: activeNav === item.id ? 600 : 400,
              marginBottom: 2,
              transition: "background 0.15s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ display: "flex", alignItems: "center" }}>
                {item.icon}
              </span>

              <span>{item.label}</span>
            </div>
            {item.badge && (
              <span
                style={{
                  background: "#f3f4f6",
                  color: "#6b7280",
                  fontSize: 10,
                  padding: "1px 5px",
                  borderRadius: 99,
                  fontWeight: 500,
                }}
              >
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>
    </aside>
  );
}

function TopNav({ activeTab, setActiveTab }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid #e5e7eb",
        paddingBottom: 0,
        marginBottom: 20,
      }}
    >
      <div style={{ display: "flex", gap: 0 }}>
        {topNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "10px 16px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
              color:
                activeTab === item.id
                  ? "#111"
                  : item.muted
                    ? "#9ca3af"
                    : "#6b7280",
              borderBottom:
                activeTab === item.id
                  ? "2px solid #111"
                  : "2px solid transparent",
              marginBottom: -1,
              transition: "all 0.15s",
            }}
          >
            {item.label}
            {item.badge !== undefined && (
              <span
                style={{
                  background: activeTab === item.id ? "#111" : "#f3f4f6",
                  color: activeTab === item.id ? "#fff" : "#6b7280",
                  fontSize: 10,
                  padding: "1px 5px",
                  borderRadius: 99,
                  fontWeight: 600,
                }}
              >
                {item.badge}
              </span>
            )}
          </button>
        ))}
        {/* <button
          style={{
            padding: "10px 12px",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "#9ca3af",
            borderBottom: "2px solid transparent",
          }}
        >
          •••
        </button> */}
      </div>
      {/* <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          padding: "6px 12px",
          background: "#fff",
          minWidth: 180,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <span style={{ fontSize: 13, color: "#9ca3af" }}>Search</span>
      </div> */}
    </div>
  );
}

function Table({
  rows,
  allChecked,
  setAllChecked,
  checkedRows,
  setCheckedRows,
}) {
  function CustomCheckbox({ checked, onChange }) {
    return (
      <div
        onClick={onChange}
        style={{
          width: 18,
          height: 18,
          borderRadius: 6,
          border: "1px solid",
          borderColor: checked ? "#3b82f6" : "#d1d5db",
          background: checked ? "#3b82f6" : "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
      >
        {checked && (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
    );
  }

  const badgeStyleMap = {
    진행중: {
      light: "#DBEAFE",
      strong: "#2563EB",
      text: "#1E3A8A",
    },
    예정: {
      light: "#E0F2FE",
      strong: "#0284C7",
      text: "#075985",
    },
    종료: {
      light: "#F3F4F6",
      strong: "#6B7280",
      text: "#374151",
    },
    취소: {
      light: "#FEE2E2",
      strong: "#DC2626",
      text: "#7F1D1D",
    },
  };

  const toggleAll = () => {
    if (allChecked) {
      setCheckedRows([]);
      setAllChecked(false);
    } else {
      setCheckedRows(rows.map((r) => r.id));
      setAllChecked(true);
    }
  };

  const toggleRow = (id) => {
    setCheckedRows((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id],
    );
  };

  const headers = [
    "담당자",
    "행사명",
    "장소",
    "시작일",
    "종료일",
    "상태",
    "관리",
  ];

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        overflow: "hidden",
        background: "#fff",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 13,
          tableLayout: "fixed",
        }}
      >
        <colgroup>
          <col style={{ width: "44px" }} />
          <col style={{ width: "15%" }} />
          <col style={{ width: "30%" }} />
          <col style={{ width: "15%" }} />
          <col style={{ width: "15%" }} />
          <col style={{ width: "15%" }} />
          <col style={{ width: "15%" }} />
          <col style={{ width: "15%" }} />
        </colgroup>

        <thead>
          <tr
            style={{
              background: "#F2F4F8",
              borderBottom: "1px solid #d9dee7",
            }}
          >
            <th
              style={{
                width: 44,
                padding: "10px 12px",
                textAlign: "center",
                verticalAlign: "middle",
              }}
            >
              <div style={{ display: "flex", justifyContent: "center" }}>
                <CustomCheckbox checked={allChecked} onChange={toggleAll} />
              </div>
            </th>

            {headers.map((h, i) => (
              <th
                key={i}
                style={{
                  padding: "10px 12px",
                  textAlign: "center",
                  fontWeight: 500,
                  color: "#374151",
                  fontSize: 13,
                  verticalAlign: "middle",
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                  }}
                >
                  {h}
                  {i === 0 && (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#9ca3af"
                      strokeWidth="2"
                    >
                      <path d="M12 5v14M5 12l7 7 7-7" />
                    </svg>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={row.id}
              style={{
                borderBottom:
                  idx < rows.length - 1 ? "1px solid #f3f4f6" : "none",
                background: checkedRows.includes(row.id) ? "#fafafa" : "#fff",
                transition: "background 0.1s",
              }}
            >
              <td
                style={{
                  padding: "10px 12px",
                  textAlign: "center",
                  verticalAlign: "middle",
                }}
              >
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <CustomCheckbox
                    checked={checkedRows.includes(row.id)}
                    onChange={() => toggleRow(row.id)}
                  />
                </div>
              </td>

              <td
                style={{
                  padding: "10px 12px",
                  textAlign: "center",
                  verticalAlign: "middle",
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Avatar />
                  <div>
                    <div
                      style={{ fontWeight: 500, color: "#111", fontSize: 13 }}
                    >
                      {row.author}
                    </div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>
                      {row.role}
                    </div>
                  </div>
                </div>
              </td>
              {row.cells.map((cell, ci) => (
                <td
                  key={ci}
                  style={{
                    padding: "10px 12px",
                    color: "#374151",
                    textAlign: "center",
                    verticalAlign: "middle",
                  }}
                >
                  {cell}
                </td>
              ))}
              <td
                style={{
                  padding: "10px 12px",
                  textAlign: "center",
                  verticalAlign: "middle",
                }}
              >
                <div
                  style={{
                    margin: "0 auto",
                    width: 90,
                    height: 28,
                    borderRadius: 999,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    color: badgeStyleMap[row.badge].text,
                  }}
                >
                  {/* 연한 원 */}
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      background: badgeStyleMap[row.badge].light,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {/* 진한 원 */}
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: badgeStyleMap[row.badge].strong,
                      }}
                    />
                  </div>

                  {row.badge}
                </div>
              </td>
              <td
                style={{
                  padding: "10px 12px",
                  textAlign: "center",
                  verticalAlign: "middle",
                }}
              >
                <div
                  style={{ display: "flex", justifyContent: "center", gap: 8 }}
                >
                  {/* 수정 버튼 */}
                  <button
                    style={{
                      padding: "6px 12px",
                      fontSize: 12,
                      borderRadius: 8,
                      border: "none",
                      background: "#1F6FDB",
                      color: "#fff",
                      cursor: "pointer",
                      fontWeight: 600,
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.target.style.background = "#195EC0")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.background = "#1F6FDB")
                    }
                    onClick={() => console.log("수정", row.id)}
                  >
                    수정
                  </button>

                  {/* 삭제 버튼 */}
                  <button
                    style={{
                      padding: "6px 12px",
                      fontSize: 12,
                      borderRadius: 8,
                      border: "none",
                      background: "linear-gradient(90deg, #FF2D55, #FF3B5C)",
                      color: "#fff",
                      cursor: "pointer",
                      fontWeight: 600,
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.target.style.background =
                        "linear-gradient(90deg, #E0264C, #E02F52)")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.background =
                        "linear-gradient(90deg, #FF2D55, #FF3B5C)")
                    }
                    onClick={() => console.log("삭제", row.id)}
                  >
                    삭제
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function Pagination({ current, total, onChange }) {
  const pages = [1, 2, 3, 4, 5, "...", total];

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        marginTop: 24,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "#f3f4f6",
          padding: "8px 12px",
          borderRadius: 6,
        }}
      >
        {/* Previous */}
        <button
          onClick={() => onChange(Math.max(1, current - 1))}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: 13,
            color: "#6b7280",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          이전
        </button>

        {/* Page numbers */}
        {pages.map((p, i) => (
          <button
            key={i}
            onClick={() => typeof p === "number" && onChange(p)}
            style={{
              minWidth: 32,
              height: 32,
              borderRadius: 4,
              border: "none",
              cursor: typeof p === "number" ? "pointer" : "default",
              background: p === current ? "#3b82f6" : "transparent",
              color: p === current ? "#fff" : "#374151",
              fontSize: 13,
              fontWeight: p === current ? 600 : 400,
            }}
          >
            {p}
          </button>
        ))}

        {/* Next */}
        <button
          onClick={() => onChange(Math.min(total, current + 1))}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: 13,
            color: "#3b82f6",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          다음
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function ContentArea({ activeTab }) {
  const [allChecked, setAllChecked] = useState(false);
  const [checkedRows, setCheckedRows] = useState([]);
  const [page, setPage] = useState(2);
  const rows = generateRows();

  const tabContent = {
    overview: (
      <div style={{ padding: "40px 0", color: "#9ca3af", fontSize: 14 }}>
        Overview content goes here.
      </div>
    ),
    tasks: (
      <div style={{ padding: "40px 0", color: "#9ca3af", fontSize: 14 }}>
        Tasks content goes here.
      </div>
    ),
    reports: (
      <div style={{ padding: "40px 0", color: "#9ca3af", fontSize: 14 }}>
        Reports content goes here.
      </div>
    ),
    admin: (
      <div style={{ padding: "40px 0", color: "#9ca3af", fontSize: 14 }}>
        Admin content goes here.
      </div>
    ),
  };

  return (
    <div>
      {activeTab === "documents" || !tabContent[activeTab] ? (
        <>
          <Table
            rows={rows}
            allChecked={allChecked}
            setAllChecked={setAllChecked}
            checkedRows={checkedRows}
            setCheckedRows={setCheckedRows}
          />
          <Pagination current={page} total={11} onChange={setPage} />
        </>
      ) : (
        tabContent[activeTab]
      )}
    </div>
  );
}

export default function Dashboard() {
  const tabTitleMap = {
    overview: "실시간 데이터",
    tasks: "통계 요약",
    documents: "접수된 행사 목록",
  };

  const [activeNav, setActiveNav] = useState("eleven");

  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        width: "100%",
        background: "#F2F4F8",
      }}
    >
      <Sidebar activeNav={activeNav} setActiveNav={setActiveNav} />

      {/* Main content */}
      <div
        style={{
          marginLeft: 220,
          flex: 1,
          padding: "28px 32px",
          minHeight: "100vh",
        }}
      >
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "#111",
            marginBottom: 20,
            letterSpacing: -0.5,
          }}
        >
          홈<span style={{ color: "#9ca3af", margin: "0 8px" }}>·</span>
          {tabTitleMap[activeTab]}
        </h1>

        <TopNav activeTab={activeTab} setActiveTab={setActiveTab} />
        <ContentArea activeTab={activeTab} />
      </div>
    </div>
  );
}
