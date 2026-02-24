import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { programApi } from "../../../../app/http/programApi";

export default function ContestVote() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const programId = searchParams.get("programId");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [resultRaw, setResultRaw] = useState(null);
  const [candidates, setCandidates] = useState([]); // 화면 표시용 후보 리스트
  const [selectedApplyId, setSelectedApplyId] = useState(null);

  const [voting, setVoting] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // ✅ 401 팝업 2번 방지
  const didHandle401Ref = useRef(false);

  const handle401 = () => {
    if (didHandle401Ref.current) return;
    didHandle401Ref.current = true;

    alert("로그인이 필요합니다.");
    const from = `${location.pathname}${location.search}`;
    navigate("/auth/login", { state: { from } });
  };

  const normalizeData = (res) => res?.data?.data ?? res?.data;

  const extractCandidates = (data) => {
    // 백엔드 응답 형태가 달라도 최대한 유연하게 후보 배열을 뽑는다.
    // 1) data 자체가 배열인 경우
    if (Array.isArray(data)) return data;

    // 2) 흔한 케이스들: { results: [] } / { items: [] } / { content: [] }
    if (Array.isArray(data?.results)) return data.results;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.content)) return data.content;

    // 3) { candidates: [] }
    if (Array.isArray(data?.candidates)) return data.candidates;

    return [];
  };

  const getCandidateKey = (c) =>
    c?.programApplyId ?? c?.applyId ?? c?.id ?? c?.program_apply_id ?? null;

  const getCandidateTitle = (c) => {
    // 후보 표시 이름(응답 필드에 맞춰 최대한 대응)
    // 예: petName/userName/nickname/title 등
    return (
      c?.petName ||
      c?.pet_name ||
      c?.userName ||
      c?.user_name ||
      c?.nickname ||
      c?.name ||
      `후보 ${getCandidateKey(c)}`
    );
  };

  const getVoteCount = (c) =>
    c?.voteCount ?? c?.vote_count ?? c?.count ?? c?.totalVotes ?? 0;

  const fetchResult = async () => {
    const res = await programApi.getContestVoteResult(programId);
    const data = normalizeData(res);
    setResultRaw(data);

    const list = extractCandidates(data);
    setCandidates(list);

    // 후보가 바뀌어도 선택값이 유효하면 유지, 아니면 해제
    if (selectedApplyId != null) {
      const exists = list.some(
        (x) => String(getCandidateKey(x)) === String(selectedApplyId),
      );
      if (!exists) setSelectedApplyId(null);
    }
  };

  useEffect(() => {
    if (!programId) {
      setErrorMsg("programId가 없습니다.");
      return;
    }

    let timerId = null;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setErrorMsg("");
        await fetchResult();

        // ✅ 3초 폴링(실시간)
        timerId = setInterval(async () => {
          if (cancelled) return;
          try {
            await fetchResult();
          } catch (e) {
            // 폴링 실패는 조용히 무시(네트워크 순간 이슈)
          }
        }, 3000);
      } catch (e) {
        const status = e?.response?.status;
        if (status === 401) return handle401();

        const msg =
          e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "투표 현황 조회 실패";
        setErrorMsg(status ? `[${status}] ${msg}` : msg);
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (timerId) clearInterval(timerId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programId]);

  const onVote = async () => {
    if (!selectedApplyId) {
      alert("투표할 후보를 선택하세요.");
      return;
    }

    try {
      setVoting(true);
      setErrorMsg("");

      await programApi.voteContest(programId, Number(selectedApplyId));
      alert("투표가 완료되었습니다.");

      await fetchResult(); // 즉시 반영
    } catch (e) {
      const status = e?.response?.status;
      if (status === 401) return handle401();

      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "투표 실패";
      setErrorMsg(status ? `[${status}] ${msg}` : msg);
    } finally {
      setVoting(false);
    }
  };

  const onCancelVote = async () => {
    try {
      setCancelling(true);
      setErrorMsg("");

      await programApi.cancelContestVote(programId);
      alert("투표가 취소되었습니다.");

      await fetchResult();
    } catch (e) {
      const status = e?.response?.status;
      if (status === 401) return handle401();

      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "투표 취소 실패";
      setErrorMsg(status ? `[${status}] ${msg}` : msg);
    } finally {
      setCancelling(false);
    }
  };

  const pageTitle = useMemo(() => "실시간 투표", []);

  if (!programId) {
    return (
      <div style={{ padding: 16 }}>
        <h2>{pageTitle}</h2>
        <div style={{ color: "red" }}>programId가 없습니다.</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <button onClick={() => navigate(-1)}>뒤로</button>
      <h2 style={{ marginTop: 12 }}>{pageTitle}</h2>
      <div style={{ opacity: 0.6, marginBottom: 12 }}>
        programId: {programId}
      </div>

      {errorMsg && (
        <div style={{ color: "red", marginBottom: 12 }}>{errorMsg}</div>
      )}

      {loading ? (
        <div>불러오는 중...</div>
      ) : candidates.length === 0 ? (
        <div>
          <div style={{ marginBottom: 8 }}>현재 투표 후보가 없습니다.</div>
          <div style={{ opacity: 0.6, fontSize: 13 }}>
            (백엔드 result 응답에 후보 리스트가 포함되어야 표시됩니다)
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gap: 10 }}>
            {candidates.map((c) => {
              const key = getCandidateKey(c);
              const checked = String(selectedApplyId) === String(key);

              return (
                <label
                  key={String(key)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    border: "1px solid #ddd",
                    borderRadius: 10,
                    padding: "10px 12px",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <input
                      type="radio"
                      name="candidate"
                      checked={checked}
                      onChange={() => setSelectedApplyId(key)}
                    />
                    <div>
                      <div style={{ fontWeight: 700 }}>
                        {getCandidateTitle(c)}
                      </div>
                      <div style={{ opacity: 0.7, fontSize: 13 }}>
                        후보ID: {String(key)}
                      </div>
                    </div>
                  </div>

                  <div style={{ fontWeight: 700 }}>
                    {getVoteCount(c)}
                    <span style={{ fontWeight: 400, opacity: 0.7 }}> 표</span>
                  </div>
                </label>
              );
            })}
          </div>

          <div
            style={{
              marginTop: 16,
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={onVote}
              disabled={voting}
              style={styles.primaryBtn}
              title={!selectedApplyId ? "후보를 선택하세요" : ""}
            >
              {voting ? "투표 중..." : "투표하기"}
            </button>

            <button
              onClick={onCancelVote}
              disabled={cancelling}
              style={styles.secondaryBtn}
            >
              {cancelling ? "취소 중..." : "투표 취소"}
            </button>

            <button onClick={fetchResult} style={styles.ghostBtn}>
              새로고침
            </button>
          </div>
        </>
      )}

      {/* 디버깅용(필요 없으면 지워도 됨) */}
      {resultRaw && (
        <div style={{ marginTop: 18, opacity: 0.5, fontSize: 12 }}>
          {/* eslint-disable-next-line react/no-unescaped-entities */}
          resultRaw: (응답 형태 확인용) 콘솔로 확인하는 걸 권장
        </div>
      )}
    </div>
  );
}

const styles = {
  primaryBtn: {
    padding: "10px 16px",
    borderRadius: 8,
    backgroundColor: "#222",
    color: "#fff",
    border: "none",
    cursor: "pointer",
  },
  secondaryBtn: {
    padding: "10px 16px",
    borderRadius: 8,
    backgroundColor: "#eee",
    border: "1px solid #ccc",
    cursor: "pointer",
  },
  ghostBtn: {
    padding: "10px 16px",
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    border: "1px solid #ddd",
    cursor: "pointer",
  },
};
