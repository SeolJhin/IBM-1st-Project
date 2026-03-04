// features/contract/pages/ContractApply.jsx
import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from '../../../app/layouts/components/Header';
import Footer from '../../../app/layouts/components/Footer';
import { propertyApi } from '../../property/api/propertyApi';
import { contractApi } from '../api/contractApi';
import { useAuth } from '../../user/hooks/useAuth';
import styles from './ContractApply.module.css';

/* ─── 유틸 ─── */
const formatKRW = (v) =>
  v != null ? Number(v).toLocaleString('ko-KR') + '원' : '-';

const toDateStr = (d) => d.toISOString().slice(0, 10);
const todayStr = () => toDateStr(new Date());

const addMonths = (base, m) => {
  if (!base) return '';
  const d = new Date(base);
  if (isNaN(d.getTime())) return '';
  d.setMonth(d.getMonth() + m);
  d.setDate(d.getDate() - 1);
  return toDateStr(d);
};
const addDays = (base, days) => {
  if (!base) return '';
  const d = new Date(base);
  if (isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + days);
  return toDateStr(d);
};
const MIN_CONTRACT_DAYS = 7;

const sunLabel = { s: '남향', n: '북향', e: '동향', w: '서향' };

/* ═══════════════════════════════════════════════════════════ */
export default function ContractApply() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const roomId = Number(searchParams.get('roomId'));

  /* 방 데이터 */
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  /* 같은 방·같은 건물의 기존 계약 기간 (blocked ranges) */
  const [blockedRanges, setBlockedRanges] = useState([]); // [{start, end}]

  /* 계약 유형 */
  const [rentType, setRentType] = useState('monthly_rent');

  /* 폼 */
  const [form, setForm] = useState({
    contractStart: toDateStr(new Date()),
    contractEnd: '',
    paymentDay: '',
    // 임대인 (입주자가 계약서 폼에 기입)
    lessorNm: '',
    lessorTel: '',
    lessorAddr: '',
    lessorRrn: '',
  });

  /* 서명 파일 */
  const [signFile, setSignFile] = useState(null);
  const [signPreview, setSignPreview] = useState(null);
  const signInputRef = useRef(null);

  /* 제출 */
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitOk, setSubmitOk] = useState(false);
  const minContractEnd = form.contractStart
    ? addDays(form.contractStart, MIN_CONTRACT_DAYS)
    : '';

  /* 계약 종료일 자동계산 */
  useEffect(() => {
    if (!form.contractStart) return;
    const months = rentType === 'monthly_rent' ? room?.rentMin || 12 : 1;
    setForm((f) => ({ ...f, contractEnd: addMonths(f.contractStart, months) }));
    // eslint-disable-next-line
  }, [room, rentType, form.contractStart]);

  /* 방 정보 로드 */
  useEffect(() => {
    if (!roomId) {
      setLoadError('방 정보가 없습니다.');
      setLoading(false);
      return;
    }
    propertyApi
      .getRoomDetail(roomId)
      .then((data) => {
        setRoom(data);
      })
      .catch((err) =>
        setLoadError(err?.message || '방 정보를 불러올 수 없습니다.')
      )
      .finally(() => setLoading(false));
  }, [roomId]);

  /* 내 계약 목록 → 같은 방의 active/requested 기간 추출 */
  useEffect(() => {
    if (!roomId) return;
    contractApi
      .myContracts()
      .then((list) => {
        const ranges = (list ?? [])
          .filter(
            (c) =>
              c.roomId === roomId &&
              ['active', 'requested'].includes(
                String(c.contractStatus ?? '').toLowerCase()
              )
          )
          .map((c) => ({ start: c.contractStart, end: c.contractEnd }));
        setBlockedRanges(ranges);
      })
      .catch(() => {});
  }, [roomId]);

  /* 로그인 체크 */
  useEffect(() => {
    if (!loading && !authLoading && !user) {
      navigate('/login', {
        state: { from: window.location.pathname + window.location.search },
      });
    }
  }, [loading, authLoading, user, navigate]);

  /* 특정 날짜가 차단 범위에 포함되는지 */
  const isDateBlocked = (dateStr) => {
    return blockedRanges.some((r) => dateStr >= r.start && dateStr <= r.end);
  };

  /* 선택한 기간이 기존 계약과 겹치는지 */
  const hasOverlap = (start, end) => {
    return blockedRanges.some((r) => start <= r.end && end >= r.start);
  };

  /* ── 핸들러 ── */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => {
      const next = { ...f, [name]: value };
      if (name === 'contractStart') {
        if (!value) {
          // 시작일 삭제 시 종료일도 초기화
          next.contractEnd = '';
        } else if (
          next.contractEnd &&
          next.contractEnd < addDays(value, MIN_CONTRACT_DAYS)
        ) {
          next.contractEnd = addDays(value, MIN_CONTRACT_DAYS);
        }
      }
      return next;
    });
  };

  const handleSignFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSignFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setSignPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleRemoveSign = () => {
    setSignFile(null);
    setSignPreview(null);
    if (signInputRef.current) signInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const pd = Number(form.paymentDay);
    const today = todayStr();
    if (!form.contractStart || form.contractStart < today) {
      setSubmitError('계약 시작일은 오늘 이후 날짜여야 합니다.');
      return;
    }
    if (!form.contractEnd || form.contractEnd < minContractEnd) {
      setSubmitError('계약 종료일은 시작일로부터 최소 7일 이후여야 합니다.');
      return;
    }
    if (hasOverlap(form.contractStart, form.contractEnd)) {
      setSubmitError(
        '선택한 기간이 이미 진행 중인 계약 기간과 겹칩니다. 다른 날짜를 선택해주세요.'
      );
      return;
    }
    if (!pd || pd < 1 || pd > 31) {
      setSubmitError('납부일은 1~31 사이의 숫자를 입력해주세요.');
      return;
    }
    if (!signFile) {
      setSubmitError('서명 이미지를 첨부해주세요.');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await contractApi.createContract({
        roomId,
        contractStart: form.contractStart,
        contractEnd: form.contractEnd,
        paymentDay: pd,
        // 임차인: 사용자가 직접 입력한 값
        lessorNm: form.lessorNm,
        lessorTel: form.lessorTel,
        lessorAddr: form.lessorAddr,
        lessorRrn: form.lessorRrn,
        signFile,
      });
      setSubmitOk(true);
    } catch (err) {
      setSubmitError(
        err?.response?.data?.message ||
          err?.message ||
          '계약 신청 중 오류가 발생했습니다.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* ── 로딩 / 에러 ── */
  if (loading || authLoading) {
    return (
      <div className={styles.page}>
        <Header />
        <div className={styles.center}>
          <div className={styles.spinner} />
          <p>방 정보를 불러오는 중...</p>
        </div>
        <Footer />
      </div>
    );
  }
  if (loadError || !room) {
    return (
      <div className={styles.page}>
        <Header />
        <div className={styles.center}>
          <p>⚠️ {loadError || '방 정보를 찾을 수 없습니다.'}</p>
          <button className={styles.backBtn} onClick={() => navigate('/rooms')}>
            목록으로
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  /* ── 신청 완료 ── */
  if (submitOk) {
    return (
      <div className={styles.page}>
        <Header />
        <div className={styles.center}>
          <div className={styles.successIcon}>🎉</div>
          <h2 className={styles.successTitle}>계약 신청이 완료되었습니다!</h2>
          <p className={styles.successDesc}>
            관리자 검토 후 계약이 확정됩니다.
            <br />
            마이페이지에서 계약 상태를 확인하세요.
          </p>
          <div className={styles.successActions}>
            <button
              className={styles.primaryBtn}
              onClick={() => navigate('/rooms')}
            >
              방 목록으로
            </button>
            <button className={styles.ghostBtn} onClick={() => navigate('/')}>
              홈으로
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const depositVal = rentType === 'stay' ? 0 : (room.deposit ?? 0);

  return (
    <div className={styles.page}>
      <Header />

      {/* 브레드크럼 */}
      <div className={styles.breadcrumb}>
        <div className={styles.breadcrumbInner}>
          <button className={styles.bcBtn} onClick={() => navigate('/')}>
            홈
          </button>
          <span className={styles.bcSep}>›</span>
          <button className={styles.bcBtn} onClick={() => navigate('/rooms')}>
            방 찾기
          </button>
          <span className={styles.bcSep}>›</span>
          <button
            className={styles.bcBtn}
            onClick={() => navigate(`/rooms/${roomId}`)}
          >
            {room.buildingNm} {room.roomNo}호
          </button>
          <span className={styles.bcSep}>›</span>
          <span className={styles.bcCurrent}>계약 신청</span>
        </div>
      </div>

      <div className={styles.container}>
        <h1 className={styles.pageTitle}>📋 전자 월세 계약서</h1>
        <p className={styles.pageSubtitle}>
          아래 부동산에 대하여 임대인과 임차인은 합의하여 다음과 같이
          임대차계약을 체결한다.
        </p>

        <form onSubmit={handleSubmit}>
          <div className={styles.contractWrap}>
            {/* ══ 1. 계약 유형 ══ */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>계약 유형 선택</h2>
              <div className={styles.typeCards}>
                {[
                  {
                    val: 'monthly_rent',
                    icon: '🏠',
                    label: '월세',
                    desc: '매월 차임 지급 방식',
                  },
                  {
                    val: 'stay',
                    icon: '📅',
                    label: '단기',
                    desc: '단기 체류 방식',
                  },
                ].map(({ val, icon, label, desc }) => (
                  <button
                    key={val}
                    type="button"
                    className={`${styles.typeCard} ${rentType === val ? styles.typeCardActive : ''}`}
                    onClick={() => setRentType(val)}
                  >
                    <span className={styles.typeIcon}>{icon}</span>
                    <strong>{label}</strong>
                    <span className={styles.typeDesc}>{desc}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* ══ 2. 부동산의 표시 (A-1 자동) ══ */}
            <section className={styles.section}>
              <div className={styles.contractDocHeader}>
                <span className={styles.autoFillBadge}>A-1 · 자동 입력</span>
              </div>
              <h2 className={styles.sectionTitle}>1. 부동산의 표시</h2>
              <div className={styles.docTable}>
                <div className={styles.docRow}>
                  <div className={styles.docCell}>
                    <span className={styles.docLabel}>소재지</span>
                    <span className={styles.docValue}>
                      {room.buildingAddr || '-'}
                    </span>
                  </div>
                </div>
                <div className={styles.docRowGrid3}>
                  <div className={styles.docCell}>
                    <span className={styles.docLabel}>건물명</span>
                    <span className={styles.docValue}>{room.buildingNm}</span>
                  </div>
                  <div className={styles.docCell}>
                    <span className={styles.docLabel}>구조·용도</span>
                    <span className={styles.docValue}>
                      {room.buildingUsage || '주거용'}
                    </span>
                  </div>
                  <div className={styles.docCell}>
                    <span className={styles.docLabel}>면적</span>
                    <span className={styles.docValue}>{room.roomSize} ㎡</span>
                  </div>
                </div>
                <div className={styles.docRowGrid4}>
                  <div className={styles.docCell}>
                    <span className={styles.docLabel}>호수</span>
                    <span className={styles.docValue}>{room.roomNo}호</span>
                  </div>
                  <div className={styles.docCell}>
                    <span className={styles.docLabel}>층</span>
                    <span className={styles.docValue}>{room.floor}층</span>
                  </div>
                  <div className={styles.docCell}>
                    <span className={styles.docLabel}>수용 인원</span>
                    <span className={styles.docValue}>
                      {room.roomCapacity}인
                    </span>
                  </div>
                  <div className={styles.docCell}>
                    <span className={styles.docLabel}>채광</span>
                    <span className={styles.docValue}>
                      {sunLabel[room.sunDirection] || room.sunDirection || '-'}
                    </span>
                  </div>
                </div>
                {room.roomOptions && (
                  <div className={styles.docRow}>
                    <div className={styles.docCell}>
                      <span className={styles.docLabel}>포함 옵션</span>
                      <span className={styles.docValue}>
                        {room.roomOptions}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* ══ 3. 계약 내용 (A-1 자동 + 날짜 입력) ══ */}
            <section className={styles.section}>
              <div className={styles.contractDocHeader}>
                <span className={styles.autoFillBadge}>A-1 · 자동 입력</span>
              </div>
              <h2 className={styles.sectionTitle}>2. 계약 내용</h2>
              <p className={styles.articleText}>
                <strong>제1조 (보증금 및 지급시기)</strong> 임대인과 임차인은
                임대차 보증금과 지불시기를 다음과 같이 약정한다.
              </p>
              <div className={styles.docTable}>
                <div className={styles.docRowGrid2}>
                  <div className={styles.docCell}>
                    <span className={styles.docLabel}>보증금</span>
                    <span className={`${styles.docValue} ${styles.moneyVal}`}>
                      {formatKRW(depositVal)}
                    </span>
                  </div>
                  <div className={styles.docCell}>
                    <span className={styles.docLabel}>월 차임 (월세)</span>
                    <span className={`${styles.docValue} ${styles.moneyVal}`}>
                      {formatKRW(room.rentPrice)}
                    </span>
                  </div>
                </div>
                <div className={styles.docRowGrid2}>
                  <div className={styles.docCell}>
                    <span className={styles.docLabel}>관리비</span>
                    <span className={`${styles.docValue} ${styles.moneyVal}`}>
                      {formatKRW(room.manageFee)}
                    </span>
                  </div>
                  <div className={styles.docCell}>
                    <span className={styles.docLabel}>계약 유형</span>
                    <span className={styles.docValue}>
                      {rentType === 'monthly_rent' ? '월세' : '단기 (stay)'}
                    </span>
                  </div>
                </div>
              </div>

              <p className={styles.articleText} style={{ marginTop: 18 }}>
                <strong>제2조 (존속기간)</strong> 임대차 기간은 인도일로부터
                아래와 같이 한다.
              </p>
              <div className={styles.docTable}>
                <div className={styles.docRowGrid2}>
                  <div className={styles.docCell}>
                    <span className={styles.docLabel}>
                      계약 시작일 <span className={styles.required}>*</span>
                    </span>
                    <input
                      type="date"
                      name="contractStart"
                      value={form.contractStart}
                      onChange={handleChange}
                      className={`${styles.docInput} ${isDateBlocked(form.contractStart) ? styles.docInputBlocked : ''}`}
                      min={todayStr()}
                      required
                    />
                    {isDateBlocked(form.contractStart) && (
                      <span className={styles.dateBlockedMsg}>
                        ⚠ 기존 계약 기간과 겹칩니다
                      </span>
                    )}
                  </div>
                  <div className={styles.docCell}>
                    <span className={styles.docLabel}>
                      계약 종료일 <span className={styles.required}>*</span>
                    </span>
                    <input
                      type="date"
                      name="contractEnd"
                      value={form.contractEnd}
                      onChange={handleChange}
                      className={`${styles.docInput} ${isDateBlocked(form.contractEnd) ? styles.docInputBlocked : ''}`}
                      min={minContractEnd}
                      required
                    />
                    {isDateBlocked(form.contractEnd) && (
                      <span className={styles.dateBlockedMsg}>
                        ⚠ 기존 계약 기간과 겹칩니다
                      </span>
                    )}
                  </div>
                </div>
                {/* 기존 계약 기간 안내 */}
                {blockedRanges.length > 0 && (
                  <div className={styles.blockedRangesNotice}>
                    <span className={styles.blockedRangesIcon}>🔒</span>
                    <span>
                      이 방의 진행 중인 계약 기간:&nbsp;
                      {blockedRanges.map((r, i) => (
                        <strong key={i}>
                          {r.start} ~ {r.end}
                          {i < blockedRanges.length - 1 ? ', ' : ''}
                        </strong>
                      ))}
                    </span>
                  </div>
                )}
                <div className={styles.docRow}>
                  <div className={styles.docCell}>
                    <span className={styles.docLabel}>
                      월 납부일 <span className={styles.required}>*</span>
                    </span>
                    <input
                      type="number"
                      name="paymentDay"
                      value={form.paymentDay}
                      onChange={handleChange}
                      className={styles.docInput}
                      placeholder="매월 납부일 (1~31)"
                      min={1}
                      max={31}
                      required
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* ══ 4. 계약 당사자 ══ */}
            <section className={styles.section}>
              <div className={styles.contractDocHeader}>
                <span className={styles.inputBadge}>B-1 · 직접 입력</span>
              </div>
              <h2 className={styles.sectionTitle}>3. 계약 당사자</h2>

              {/* 임대인 - Building에서 자동 표시 */}
              <div className={styles.partyBlock}>
                <div className={styles.partyTitle}>
                  <span className={styles.partyLabel}>임대인</span>
                  <span className={styles.autoFillBadge}>자동 입력</span>
                </div>
                <div className={styles.docTable}>
                  <div className={styles.docRowGrid2}>
                    <div className={styles.docCell}>
                      <span className={styles.docLabel}>성명</span>
                      <input
                        type="text"
                        value={room?.buildingLessorNm || '-'}
                        className={`${styles.docInput} ${styles.readOnly}`}
                        readOnly
                      />
                    </div>
                    <div className={styles.docCell}>
                      <span className={styles.docLabel}>전화번호</span>
                      <input
                        type="text"
                        value={room?.buildingLessorTel || '-'}
                        className={`${styles.docInput} ${styles.readOnly}`}
                        readOnly
                      />
                    </div>
                  </div>
                  <div className={styles.docRow}>
                    <div className={styles.docCell}>
                      <span className={styles.docLabel}>주소</span>
                      <input
                        type="text"
                        value={room?.buildingLessorAddr || '-'}
                        className={`${styles.docInput} ${styles.readOnly}`}
                        readOnly
                      />
                    </div>
                  </div>
                  <div className={styles.docRow}>
                    <div className={styles.docCell}>
                      <span className={styles.docLabel}>주민등록번호</span>
                      <input
                        type="text"
                        value={
                          room?.buildingLessorRrn
                            ? room.buildingLessorRrn.replace(
                                /(\d{6})-?(\d{7})/,
                                '$1-*******'
                              )
                            : '-'
                        }
                        className={`${styles.docInput} ${styles.readOnly}`}
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 임차인 - 직접 입력 */}
              <div className={styles.partyBlock}>
                <div className={styles.partyTitle}>
                  <span className={styles.partyLabel}>임차인</span>
                  <span className={styles.inputBadge}>직접 기입</span>
                </div>
                <div className={styles.docTable}>
                  <div className={styles.docRowGrid2}>
                    <div className={styles.docCell}>
                      <span className={styles.docLabel}>
                        성명 <span className={styles.required}>*</span>
                      </span>
                      <input
                        type="text"
                        name="lessorNm"
                        value={form.lessorNm}
                        onChange={handleChange}
                        className={styles.docInput}
                        placeholder="임차인 성명"
                        required
                      />
                    </div>
                    <div className={styles.docCell}>
                      <span className={styles.docLabel}>
                        전화번호 <span className={styles.required}>*</span>
                      </span>
                      <input
                        type="tel"
                        name="lessorTel"
                        value={form.lessorTel}
                        onChange={handleChange}
                        className={styles.docInput}
                        placeholder="010-0000-0000"
                        required
                      />
                    </div>
                  </div>
                  <div className={styles.docRow}>
                    <div className={styles.docCell}>
                      <span className={styles.docLabel}>
                        주소 <span className={styles.required}>*</span>
                      </span>
                      <input
                        type="text"
                        name="lessorAddr"
                        value={form.lessorAddr}
                        onChange={handleChange}
                        className={styles.docInput}
                        placeholder="임차인 주소"
                        required
                      />
                    </div>
                  </div>
                  <div className={styles.docRow}>
                    <div className={styles.docCell}>
                      <span className={styles.docLabel}>
                        주민등록번호 <span className={styles.required}>*</span>
                      </span>
                      <input
                        type="text"
                        name="lessorRrn"
                        value={form.lessorRrn}
                        onChange={handleChange}
                        className={styles.docInput}
                        placeholder="000000-0000000"
                        maxLength={14}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ══ 5. 서명·날인 ══ */}
            <section className={styles.section}>
              <div className={styles.contractDocHeader}>
                <span className={styles.inputBadge}>B-1 · 서명·날인</span>
              </div>
              <h2 className={styles.sectionTitle}>4. 서명 및 날인</h2>
              <p className={styles.articleText}>
                본 계약을 증명하기 위하여 계약 당사자가 이의 없음을 확인하고
                각각 서명·날인한다.
              </p>
              <div className={styles.signBlock}>
                <div className={styles.signHint}>
                  서명 또는 날인 이미지를 첨부해주세요. <strong>(필수)</strong>
                </div>
                <label className={styles.signUploadLabel}>
                  <input
                    ref={signInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleSignFile}
                    className={styles.signFileInput}
                  />
                  <span className={styles.signUploadBtn}>
                    📎 서명 이미지 첨부
                  </span>
                </label>
                {signPreview ? (
                  <div className={styles.signPreviewWrap}>
                    <img
                      src={signPreview}
                      alt="서명 미리보기"
                      className={styles.signPreview}
                    />
                    <button
                      type="button"
                      className={styles.signRemoveBtn}
                      onClick={handleRemoveSign}
                    >
                      ✕ 제거
                    </button>
                  </div>
                ) : (
                  <div className={styles.signEmpty}>
                    서명 이미지를 첨부해주세요
                  </div>
                )}
              </div>
            </section>

            {/* ══ 6. 약관 ══ */}
            <section className={styles.section}>
              <div className={styles.clauseBox}>
                <p>
                  <strong>제3조 (용도변경 및 전대 등)</strong> 임차인은 임대인의
                  동의없이 위 부동산의 용도나 구조를 변경하거나 전대·임차권 양도
                  또는 담보제공을 하지 못하며 임대차 목적 이외의 용도로 사용할
                  수 없다.
                </p>
                <p>
                  <strong>제4조 (계약의 해지)</strong> 임차인이 제3조를
                  위반하였을 때 임대인은 즉시 본 계약을 해지할 수 있다.
                </p>
                <p>
                  <strong>제5조 (계약의 종료)</strong> 임대차계약이 종료된
                  경우에 임차인은 위 부동산을 원상으로 회복하여 임대인에게
                  반환한다.
                </p>
                <p>
                  <strong>제7조 (채무불이행과 손해배상)</strong> 임대인 또는
                  임차인이 본 계약상의 내용에 대하여 불이행이 있을 경우 계약을
                  해제할 수 있으며, 손해배상의 기준은 계약금으로 본다.
                </p>
                <p className={styles.clauseWarning}>
                  ⚠️ 임차인은 위 부동산에 존재하는 선순위 권리(근저당권, 임차권
                  등)로 인하여 경매 등이 실행될 경우 임차보증금의 전부 또는
                  일부를 반환받지 못할 수 있음을 확인한다.
                </p>
              </div>
            </section>

            {/* 에러 */}
            {submitError && (
              <div className={styles.errorBox}>⚠️ {submitError}</div>
            )}

            {/* 제출 */}
            <div className={styles.submitRow}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => navigate(`/rooms/${roomId}`)}
              >
                취소
              </button>
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={submitting}
              >
                {submitting ? '신청 중...' : '📝 계약 신청하기'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  );
}
