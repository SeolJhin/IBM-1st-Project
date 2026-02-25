export default function PupooBrandIdentity() {
  const imgBase = "http://kgj.dothome.co.kr/pupoo";
  const img = (n) => `${imgBase}/info${n}.png`;

  const handleDownloadPSD = async () => {
    try {
      const res = await fetch(`${imgBase}/pupoo_logo.psd`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "pupoo_logo.psd";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(`${imgBase}/pupoo_logo.psd`, "_blank");
    }
  };

  return (
    <div className="pt-36 pb-32 bg-white min-h-screen">
      <div className="max-w-[820px] mx-auto px-6 text-gray-900">
        {/* ================= 타이틀 ================= */}
        <div style={{ marginBottom: 72 }}>
          <h1 className="text-5xl font-bold tracking-tight">회사소개</h1>
        </div>

        {/* ================= BI 카드 섹션 ================= */}
        <section
          style={{
            marginBottom: 80,
            borderRadius: 12,
            overflow: "hidden",
            background: "linear-gradient(135deg, #f0f4ff 0%, #e8faf5 100%)",
            border: "1px solid rgba(47,85,255,0.08)",
          }}
        >
          {/* 카드 내부 */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 48,
              padding: "48px 44px",
            }}
          >
            {/* 좌: 로고 */}
            <div style={{ flexShrink: 0, width: 200, textAlign: "center" }}>
              <img
                src={img(1)}
                alt="Pupoo 로고"
                style={{
                  width: "100%",
                  height: "auto",
                  objectFit: "contain",
                  display: "block",
                }}
              />
            </div>

            {/* 우: 설명 */}
            <div style={{ flex: 1, textAlign: "left" }}>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  color: "#2F55FF",
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                Brand Identity
              </p>
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  marginBottom: 16,
                  color: "#111827",
                }}
              >
                반려동물 문화의 연결과 확장
              </h2>
              <div style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.85 }}>
                <p style={{ marginBottom: 10 }}>
                  Pupoo는 반려동물과 보호자를 위한 행사 통합 운영 플랫폼입니다.{" "}
                  <br />
                  행사 기획, 참가 신청, 결제, 현장 운영, 커뮤니티까지 하나의{" "}
                  <br />
                  시스템 안에서 연결되는 통합 경험을 제공합니다.
                </p>
              </div>

              <div style={{ marginTop: 28 }}>
                <button
                  onClick={handleDownloadPSD}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 22px",
                    border: "none",
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#fff",
                    backgroundColor: "#2F55FF",
                    cursor: "pointer",
                  }}
                >
                  로고 파일 다운로드 (.psd)
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 국문형 / 영문형 ================= */}
        <section style={{ marginBottom: 80 }}>
          <h2 className="text-2xl font-bold mb-10 text-center">로고 타입</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {/* 국문형 */}
            <div className="text-center">
              <div
                style={{
                  height: 200,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#f8f9fb",
                  borderRadius: 8,
                  border: "1px solid #eef0f4",
                  marginBottom: 12,
                }}
              >
                <img
                  src={img(2)}
                  alt="Pupoo 국문 로고"
                  style={{
                    maxHeight: "70%",
                    maxWidth: "80%",
                    objectFit: "contain",
                  }}
                />
              </div>
              <p style={{ fontSize: 13, color: "#9ca3af" }}>국문형</p>
            </div>

            {/* 영문형 */}
            <div className="text-center">
              <div
                style={{
                  height: 200,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#f8f9fb",
                  borderRadius: 8,
                  border: "1px solid #eef0f4",
                  marginBottom: 12,
                }}
              >
                <img
                  src={img(3)}
                  alt="Pupoo 영문 로고"
                  style={{
                    maxHeight: "70%",
                    maxWidth: "80%",
                    objectFit: "contain",
                  }}
                />
              </div>
              <p style={{ fontSize: 13, color: "#9ca3af" }}>영문형</p>
            </div>
          </div>
        </section>

        {/* ================= 브랜드 컬러 시스템 ================= */}
        <section style={{ marginBottom: 80 }}>
          <h2 className="text-2xl font-bold mb-10 text-center">
            브랜드 컬러 시스템
          </h2>

          <div className="grid grid-cols-2 gap-5">
            {[
              {
                bg: "#2F55FF",
                name: "Pupoo Blue",
                pantone: "2728 C",
                cmyk: "C80 M64 Y0 K0",
                rgb: "R47 G85 B255",
              },
              {
                bg: "#00B894",
                name: "Pupoo Mint",
                pantone: "7465 C",
                cmyk: "C67 M0 Y40 K0",
                rgb: "R0 G184 B148",
              },
            ].map((color, i) => (
              <div
                key={i}
                style={{
                  borderRadius: 8,
                  overflow: "hidden",
                  border: "1px solid #eef0f4",
                  backgroundColor: "#fff",
                }}
              >
                <div style={{ backgroundColor: color.bg, height: 110 }} />
                <div style={{ padding: "16px 20px", fontSize: 13 }}>
                  <p
                    style={{
                      fontWeight: 700,
                      color: "#1f2937",
                      marginBottom: 14,
                    }}
                  >
                    {color.name}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 8,
                      color: "#9ca3af",
                    }}
                  >
                    <span>PANTONE</span>
                    <span style={{ color: "#374151", fontWeight: 600 }}>
                      {color.pantone}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 8,
                      color: "#9ca3af",
                    }}
                  >
                    <span>CMYK</span>
                    <span style={{ color: "#374151", fontWeight: 600 }}>
                      {color.cmyk}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      color: "#9ca3af",
                    }}
                  >
                    <span>RGB</span>
                    <span style={{ color: "#374151", fontWeight: 600 }}>
                      {color.rgb}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ================= White / Black Version ================= */}
        <section style={{ marginBottom: 80 }}>
          <h2 className="text-2xl font-bold mb-10 text-center">활용 버전</h2>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <div
                style={{
                  height: 200,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#fff",
                  borderRadius: 8,
                  border: "1px solid #eef0f4",
                  marginBottom: 12,
                }}
              >
                <img
                  src={img(4)}
                  alt="Pupoo White Version"
                  style={{
                    maxHeight: 150,
                    maxWidth: "80%",
                    objectFit: "contain",
                  }}
                />
              </div>
              <p
                style={{ fontSize: 13, color: "#9ca3af", textAlign: "center" }}
              >
                White Version
              </p>
            </div>

            <div>
              <div
                style={{
                  height: 200,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#0a0a0a",
                  borderRadius: 8,
                  marginBottom: 12,
                }}
              >
                <img
                  src={img(5)}
                  alt="Pupoo Black Version"
                  style={{
                    maxHeight: 150,
                    maxWidth: "80%",
                    objectFit: "contain",
                  }}
                />
              </div>
              <p
                style={{ fontSize: 13, color: "#9ca3af", textAlign: "center" }}
              >
                Black Version
              </p>
            </div>
          </div>
        </section>

        {/* ================= 부칙 ================= */}
        <div className="border-t pt-10 text-sm text-gray-400">
          최초 시행일자 : 2026년 2월 18일
        </div>
      </div>
    </div>
  );
}
