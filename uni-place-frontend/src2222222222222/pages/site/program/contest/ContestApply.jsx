import { useEffect, useMemo, useRef, useState } from "react"; // ✅ useRef 추가
import { useNavigate, useSearchParams } from "react-router-dom";
import { programApi } from "../../../../app/http/programApi";

export default function ContestApply() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const programId = searchParams.get("programId");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");
  const [myApply, setMyApply] = useState(null);

  const mode = useMemo(() => (myApply ? "VIEW" : "EDIT"), [myApply]);

  // ✅ 401 처리 중복 방지(팝업 2번 뜨는 것 방지)
  const didHandle401Ref = useRef(false);

  const handle401 = () => {
    if (didHandle401Ref.current) return; // ✅ 한번만
    didHandle401Ref.current = true;

    alert("로그인이 필요합니다.");
    navigate("/auth/login");
  };

  const extractList = (res) => {
    const data = res?.data?.data ?? res?.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.content)) return data.content;
    if (Array.isArray(data?.items)) return data.items;
    return [];
  };

  const pickActiveApply = (applies, pid) => {
    const programIdNum = Number(pid);
    if (!Array.isArray(applies)) return null;

    const matched = applies.filter((a) => Number(a.programId) === programIdNum);
    if (matched.length === 0) return null;

    const active = matched.find(
      (a) => String(a?.status ?? "").toUpperCase() !== "CANCELLED",
    );

    return active ?? null;
  };

  const normalizeApplyId = (apply) =>
    apply?.programApplyId ?? apply?.applyId ?? apply?.id ?? null;

  const loadMyApply = async () => {
    const res = await programApi.getMyProgramApplies({ size: 200 });
    const list = extractList(res);
    const active = pickActiveApply(list, programId);
    setMyApply(active);
  };

  useEffect(() => {
    if (!programId) {
      setErrorMsg("programId가 없습니다.");
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setErrorMsg("");
        await loadMyApply();
      } catch (e) {
        const statusCode = e?.response?.status;
        if (statusCode === 401) return handle401();

        const msg =
          e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "신청 정보 조회 실패";

        setErrorMsg(statusCode ? `[${statusCode}] ${msg}` : msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [programId]);

  const onCreate = async () => {
    try {
      setSaving(true);
      setErrorMsg("");

      await programApi.createProgramApply({
        programId: Number(programId),
      });

      alert("참가 신청이 완료되었습니다.");
      await loadMyApply(); // 조회 모드 전환
    } catch (e) {
      const statusCode = e?.response?.status;
      if (statusCode === 401) return handle401();

      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "신청 실패";

      setErrorMsg(statusCode ? `[${statusCode}] ${msg}` : msg);
    } finally {
      setSaving(false);
    }
  };

  const onCancel = async () => {
    const applyId = normalizeApplyId(myApply);
    if (!applyId) {
      setErrorMsg("신청 ID를 찾지 못했습니다.");
      return;
    }

    try {
      setCancelling(true);
      setErrorMsg("");

      await programApi.cancelProgramApply(applyId);

      alert("신청이 취소되었습니다.");
      await loadMyApply(); // EDIT 모드 전환
    } catch (e) {
      const statusCode = e?.response?.status;
      if (statusCode === 401) return handle401();

      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "취소 실패";

      setErrorMsg(statusCode ? `[${statusCode}] ${msg}` : msg);
    } finally {
      setCancelling(false);
    }
  };

  if (!programId) {
    return (
      <div style={{ padding: 16 }}>
        <h2>콘테스트 참가신청</h2>
        <div style={{ color: "red" }}>programId가 없습니다.</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>콘테스트 참가신청</h2>

      <div style={{ marginBottom: 12, opacity: 0.6 }}>
        programId: {programId}
      </div>

      {errorMsg && (
        <div style={{ color: "red", marginBottom: 12 }}>{errorMsg}</div>
      )}

      {loading ? (
        <div>불러오는 중...</div>
      ) : mode === "VIEW" ? (
        <div>
          <h3>신청 정보</h3>
          <div>상태: {myApply?.status}</div>
          <div>
            신청일: {String(myApply?.createdAt ?? myApply?.created_at ?? "")}
          </div>

          <div style={{ marginTop: 16 }}>
            <button onClick={() => navigate(-1)} style={styles.secondaryBtn}>
              상세로 돌아가기
            </button>

            <button
              onClick={onCancel}
              disabled={cancelling}
              style={{ ...styles.dangerBtn, marginLeft: 8 }}
            >
              {cancelling ? "취소 중..." : "신청 취소"}
            </button>
          </div>
        </div>
      ) : (
        <div>
          <h3>참가 신청</h3>
          <p>신청하시겠습니까?</p>

          <div style={{ marginTop: 16 }}>
            <button
              onClick={onCreate}
              disabled={saving}
              style={styles.primaryBtn}
            >
              {saving ? "저장 중..." : "신청하기"}
            </button>

            <button
              onClick={() => navigate(-1)}
              style={{ ...styles.secondaryBtn, marginLeft: 8 }}
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== 스타일 ===== */
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
  dangerBtn: {
    padding: "10px 16px",
    borderRadius: 8,
    backgroundColor: "#c62828",
    color: "#fff",
    border: "none",
    cursor: "pointer",
  },
};
