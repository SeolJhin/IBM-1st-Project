import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { programApi } from "../../../../app/http/programApi";
import { useLocation } from "react-router-dom";

export default function ContestDetail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const programId = searchParams.get("programId");

  const [loading, setLoading] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");
  const [program, setProgram] = useState(null);
  const location = useLocation();

  // ✅ C안: 내 신청(해당 programId의 active 1건)
  const [myApply, setMyApply] = useState(null);

  const applyBtnLabel = useMemo(
    () => (myApply ? "신청정보 보기" : "참가신청"),
    [myApply],
  );

  const handle401 = () => {
    alert("로그인이 필요합니다.");
    const from = `${location.pathname}${location.search}`;
    navigate("/auth/login", { state: { from } });
  };

  const extractList = (res) => {
    // ApiResponse/PageResponse/배열 케이스 모두 대응
    const data = res?.data?.data ?? res?.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.content)) return data.content;
    if (Array.isArray(data?.items)) return data.items;
    return [];
  };

  const pickActiveApply = (applies, pid) => {
    const programIdNum = Number(pid);
    if (!Array.isArray(applies)) return null;

    // programId 매칭
    const matched = applies.filter((a) => Number(a.programId) === programIdNum);
    if (matched.length === 0) return null;

    // active 기준: status !== CANCELLED (C안 요구)
    const active = matched.find(
      (a) => String(a?.status ?? "").toUpperCase() !== "CANCELLED",
    );

    return active ?? null;
  };

  useEffect(() => {
    if (!programId) {
      setErrorMsg("programId가 없습니다.");
      setProgram(null);
      setMyApply(null);
      return;
    }

    // 1) 상세 조회
    (async () => {
      setLoading(true);
      setErrorMsg("");
      try {
        const res = await programApi.getProgramDetail(programId);
        setProgram(res.data.data);
      } catch (e) {
        const statusCode = e?.response?.status;
        if (statusCode === 401) return handle401();

        const msg =
          e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "콘테스트 상세 조회 실패";
        setErrorMsg(statusCode ? `[${statusCode}] ${msg}` : msg);
        setProgram(null);
      } finally {
        setLoading(false);
      }
    })();

    // 2) ✅ C안: 내 신청 목록 1회 호출 후 programId로 필터링
    (async () => {
      setApplyLoading(true);
      try {
        const res = await programApi.getMyProgramApplies({ size: 200 });
        const list = extractList(res);
        const active = pickActiveApply(list, programId);
        setMyApply(active);
      } catch (e) {
        const statusCode = e?.response?.status;

        // ✅ 핵심: 상세 페이지에서는 로그인 강제하면 안 됨
        // 401이면 "미신청"으로만 처리하고 화면 유지
        if (statusCode === 401) {
          setMyApply(null);
          return;
        }

        // 기타 오류도 치명적이지 않게: 미신청으로 처리
        setMyApply(null);
      } finally {
        setApplyLoading(false);
      }
    })();
  }, [programId]);

  if (loading) return <div style={{ padding: 16 }}>로딩중...</div>;

  if (errorMsg) {
    return (
      <div style={{ padding: 16 }}>
        <div style={{ color: "red", marginBottom: 12 }}>에러: {errorMsg}</div>
        <button onClick={() => navigate(-1)}>뒤로</button>
      </div>
    );
  }

  if (!program) return <div style={{ padding: 16 }}>데이터 없음</div>;

  return (
    <div style={{ padding: 16 }}>
      <button onClick={() => navigate(-1)}>뒤로</button>

      <h2 style={{ marginTop: 12 }}>{program.programTitle}</h2>

      <div style={{ opacity: 0.8 }}>
        {String(program.startAt ?? "")} ~ {String(program.endAt ?? "")}
      </div>

      {program.description && (
        <div style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>
          {program.description}
        </div>
      )}

      {/* 기능 버튼 영역 */}
      <div style={styles.actionWrap}>
        <button
          type="button"
          onClick={() =>
            navigate(`/program/contest/apply?programId=${program.programId}`)
          }
          style={{ ...styles.actionBtn, ...styles.primaryBtn }}
          disabled={applyLoading}
          title={applyLoading ? "신청 상태 확인 중" : ""}
        >
          {applyLoading ? "확인 중..." : applyBtnLabel}
        </button>

        <button
          type="button"
          onClick={() =>
            navigate(`/program/contest/vote?programId=${program.programId}`)
          }
          style={{ ...styles.actionBtn, ...styles.secondaryBtn }}
        >
          실시간 투표
        </button>

        <button
          type="button"
          onClick={() =>
            navigate(`/program/contest/result?programId=${program.programId}`)
          }
          style={{ ...styles.actionBtn, ...styles.ghostBtn }}
        >
          결과발표
        </button>
      </div>

      {/* (선택) 디버깅용: 현재 신청 상태 */}
      {myApply && (
        <div style={{ marginTop: 12, color: "#666" }}>
          현재 신청 상태: <b>{myApply.status ?? "UNKNOWN"}</b>
        </div>
      )}
    </div>
  );
}

/* ===== 스타일 ===== */
const styles = {
  actionWrap: {
    marginTop: 20,
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  actionBtn: {
    padding: "10px 18px",
    borderRadius: 8,
    fontSize: 14,
    cursor: "pointer",
    border: "1px solid #ccc",
    whiteSpace: "nowrap",
  },
  primaryBtn: {
    backgroundColor: "#222",
    color: "#fff",
    borderColor: "#222",
  },
  secondaryBtn: {
    backgroundColor: "#fff",
    color: "#222",
  },
  ghostBtn: {
    backgroundColor: "#f5f5f5",
    color: "#333",
  },
};
