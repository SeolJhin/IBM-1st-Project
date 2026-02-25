// src/pages/site/program/_components/ProgramList.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { programApi } from "../../../../app/http/programApi";

export default function ProgramList({
  title,
  category, // "CONTEST" | "SESSION" | "EXPERIENCE" | undefined(전체)
  pageSize = 10,

  // ✅ 상세 이동 경로를 페이지에서 주입 가능
  // 예: Session.jsx에서는 "/program/session-detail"
  detailPath = "/program/detail",

  // 버튼/노출 정책을 페이지에서 바꿀 수 있게 (EventList 패턴 그대로)
  buttonConfig,
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get("eventId");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [programs, setPrograms] = useState([]);

  const categoryKey = useMemo(
    () => (category ? String(category) : ""),
    [category],
  );

  // ✅ 기본 버튼 정책(상세로 이동)
  const defaultButtonConfig = useMemo(
    () => ({
      showWhen: () => true,
      primaryText: "상세보기", // 기존 "신청"보단 지금 단계에선 상세가 자연스러움(원하면 다시 "신청")
      secondaryText: null,
      onPrimary: (p, nav) => nav(`${detailPath}?programId=${p.programId}`),
      onSecondary: null,
    }),
    [detailPath],
  );

  const cfg = {
    ...defaultButtonConfig,
    ...(buttonConfig || {}),
  };

  useEffect(() => {
    if (!eventId) {
      setPrograms([]);
      setErrorMsg("eventId가 필요합니다. 예) ?eventId=1");
      return;
    }

    const controller = new AbortController();

    (async () => {
      setLoading(true);
      setErrorMsg("");
      try {
        const res = await programApi.getPrograms({
          eventId: Number(eventId),
          category: categoryKey || undefined,
          page: 0,
          size: pageSize,
          // sort: "startAt,asc"
        });

        const data = res?.data?.data ?? res?.data;
        setPrograms(
          (Array.isArray(data) && data) ||
          data?.content ||
          data?.items ||
          []
        );
      } catch (e) {
        const statusCode = e?.response?.status;
        const msg =
          e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "프로그램 조회 실패";
        setErrorMsg(statusCode ? `[${statusCode}] ${msg}` : msg);
        setPrograms([]);
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [eventId, categoryKey, pageSize]);

  const goDetail = (programId) => {
    navigate(`${detailPath}?programId=${programId}`);
  };

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 24 }}>{title}</h2>

      {loading && <div>로딩중...</div>}

      {errorMsg && (
        <div style={{ color: "red", marginBottom: 12 }}>에러: {errorMsg}</div>
      )}

      {!loading && !errorMsg && programs.length === 0 && (
        <div style={{ opacity: 0.7 }}>조회 결과가 없습니다.</div>
      )}

      <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
        {programs.map((p) => {
          const showButtons = !!cfg.showWhen?.(p);

          return (
            <div
              key={p.programId}
              onClick={() => goDetail(p.programId)}
              style={{
                border: "1px solid #ddd",
                borderRadius: 10,
                padding: "16px 20px",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{p.programTitle}</div>
                <div style={{ opacity: 0.7 }}>
                  {String(p.startAt ?? "")} ~ {String(p.endAt ?? "")}
                </div>
                {p.description && (
                  <div style={{ opacity: 0.7 }}>{p.description}</div>
                )}
              </div>

              {showButtons && (cfg.primaryText || cfg.secondaryText) && (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  {cfg.primaryText && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        cfg.onPrimary?.(p, navigate);
                      }}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 8,
                        border: "1px solid #dcdcdc",
                        backgroundColor: "#f8f8f8",
                        fontSize: 14,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {cfg.primaryText}
                    </button>
                  )}

                  {cfg.secondaryText && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        cfg.onSecondary?.(p, navigate);
                      }}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 8,
                        border: "1px solid #dcdcdc",
                        backgroundColor: "#f8f8f8",
                        fontSize: 14,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {cfg.secondaryText}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
