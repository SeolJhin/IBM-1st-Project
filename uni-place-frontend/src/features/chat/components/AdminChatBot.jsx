/* eslint-disable react-hooks/exhaustive-deps */
// src/features/chat/components/AdminChatBot.jsx
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../app/http/axiosInstance';
import ErrorActionNotice from '../../../shared/components/ErrorActionNotice/ErrorActionNotice';
import styles from './AdminChatBot.module.css';
import { QUICK_QUESTIONS } from '../config/chatConfig';

const ADMIN_HISTORY_KEY = 'uniplace_admin_chat_history';
const HISTORY_WINDOW = 8;
const RETENTION_DAYS = 365;

// ── localStorage 유틸 ─────────────────────────────────────────────────────────
function loadAdminHistory(adminId) {
  try {
    const all = JSON.parse(localStorage.getItem(ADMIN_HISTORY_KEY) || '{}');
    const recs = Array.isArray(all[adminId]) ? all[adminId] : [];
    return recs.filter((m) => Date.now() - m.ts < RETENTION_DAYS * 86400000);
  } catch {
    return [];
  }
}
function saveAdminHistory(adminId, messages) {
  try {
    const all = JSON.parse(localStorage.getItem(ADMIN_HISTORY_KEY) || '{}');
    all[adminId] = messages;
    localStorage.setItem(ADMIN_HISTORY_KEY, JSON.stringify(all));
  } catch {}
}
function clearAdminHistory(adminId) {
  try {
    const all = JSON.parse(localStorage.getItem(ADMIN_HISTORY_KEY) || '{}');
    delete all[adminId];
    localStorage.setItem(ADMIN_HISTORY_KEY, JSON.stringify(all));
  } catch {}
}
function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ── Spring AI 호출 ────────────────────────────────────────────────────────────
async function callAdminChatbot(prompt, adminId, history, extraSlots = {}) {
  const recentHistory = (Array.isArray(history) ? history : [])
    .slice(-HISTORY_WINDOW)
    .map((m) => ({ role: m.role, content: m.content }));
  const res = await api.post('/ai/chat/admin-chatbot', {
    intent: 'ADMIN_CHATBOT',
    prompt,
    userId: adminId,
    userSegment: 'ADMIN',
    slots: { history: recentHistory, ...extraSlots },
  });
  const data = res?.data?.data ?? {};
  const metadata = data.metadata ?? {};
  const buttons = Array.isArray(metadata.action_buttons)
    ? metadata.action_buttons
    : Array.isArray(metadata.buttons)
      ? metadata.buttons
      : [];
  return {
    answer: data.answer || '응답을 받지 못했습니다.',
    metadata,
    buttons,
  };
}

// ── 마커 파서 ─────────────────────────────────────────────────────────────────
function extractMarker(text, tag) {
  const open = `__${tag}__`;
  const close = `__END_${tag}__`;
  const s = text.indexOf(open);
  const e = text.indexOf(close);
  if (s === -1 || e === -1) return { rest: text, data: null };
  try {
    const data = JSON.parse(text.slice(s + open.length, e));
    return { rest: text.slice(0, s).trim(), data };
  } catch {
    return { rest: text, data: null };
  }
}

// ── sendMessage 핵심 흐름 ─────────────────────────────────────────────────────
// Python 서버가 직방·다방·국토부를 직접 호출하므로 단 1회 왕복으로 완결
async function sendToAdminChatbot(prompt, adminId, history, onLabel) {
  onLabel?.('AI 분석 중…');
  const result = await callAdminChatbot(prompt, adminId, history);
  const answer = result.answer || '';
  return { answer, metadata: result.metadata, buttons: result.buttons };
}

// ── 가격 리포트 카드 ──────────────────────────────────────────────────────────
function PriceReportCard({ report }) {
  const [activeTab, setActiveTab] = useState('summary');
  const [imgErrors, setImgErrors] = useState({});
  if (!report || report.__type !== 'price_report') return null;

  const {
    target_room: tr,
    market: mkt,
    recommendation: rec,
    listings,
  } = report;
  const hasListings = Array.isArray(listings) && listings.length > 0;
  const withImg = hasListings ? listings.filter((l) => l.image_url) : [];
  const withoutImg = hasListings ? listings.filter((l) => !l.image_url) : [];

  const verdictMap = {
    underpriced: {
      label: '저평가',
      color: '#f59e0b',
      bg: 'rgba(245,158,11,.13)',
      icon: '📉',
    },
    overpriced: {
      label: '고평가',
      color: '#ef4444',
      bg: 'rgba(239,68,68,.13)',
      icon: '📈',
    },
    fair: {
      label: '시세 적정',
      color: '#22c55e',
      bg: 'rgba(34,197,94,.13)',
      icon: '✅',
    },
    unknown: {
      label: '미확인',
      color: '#64748b',
      bg: 'rgba(100,116,139,.13)',
      icon: '❓',
    },
  };
  const vInfo = verdictMap[rec?.verdict] || verdictMap.unknown;

  const barRange = mkt.max - mkt.min || 1;
  const pctOf = (v) =>
    Math.max(0, Math.min(100, ((v - mkt.min) / barRange) * 100));
  const recLowPct = pctOf(rec.low);
  const recHighPct = pctOf(rec.high);
  const curPct = tr.current_price_wan ? pctOf(tr.current_price_wan) : null;
  const avgPct = pctOf(mkt.avg);

  const confColor = { high: '#22c55e', medium: '#f59e0b', low: '#ef4444' };
  const confText = { high: '높음 ●●●', medium: '보통 ●●○', low: '낮음 ●○○' };
  const rtLabel = { monthly_rent: '월세', jeonse: '전세', all: '임대' };

  const tabs = [
    ['summary', '📊 요약'],
    ['table', '📋 근거표'],
    ['listings', `🏘 유사매물 ${listings?.length || 0}건`],
  ];

  return (
    <div className={styles.priceCard}>
      {/* 헤더 */}
      <div className={styles.priceCardHeader}>
        <span className={styles.priceCardIcon}>🏠</span>
        <div className={styles.priceCardTitle}>
          <span>주변 시세 분석 리포트</span>
          <span className={styles.priceCardSub}>
            {tr.address?.slice(0, 26)}
            {tr.address?.length > 26 ? '…' : ''}
            {tr.size_pyeong && ` · ${tr.size_pyeong}평`}
            {` · ${rtLabel[tr.rent_type] || '임대'}`}
          </span>
        </div>
        <div
          className={styles.priceVerdict}
          style={{ background: vInfo.bg, color: vInfo.color }}
        >
          {vInfo.icon} {vInfo.label}
          {rec.gap_pct != null &&
            rec.gap_pct !== 0 &&
            ` (${rec.gap_pct > 0 ? '+' : ''}${rec.gap_pct}%)`}
        </div>
      </div>

      {/* 탭 */}
      <div className={styles.priceTabs}>
        {tabs.map(([id, label]) => (
          <button
            key={id}
            className={`${styles.priceTab} ${activeTab === id ? styles.priceTabActive : ''}`}
            onClick={() => setActiveTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── 요약 탭 ── */}
      {activeTab === 'summary' && (
        <div className={styles.priceBody}>
          <div className={styles.recBanner}>
            <div className={styles.recBannerLabel}>추천 임대료</div>
            <div className={styles.recBannerPrice}>
              <span className={styles.recLow}>{rec.low}만</span>
              <span className={styles.recRange}> ~ </span>
              <span className={styles.recHigh}>{rec.high}만</span>
              <span className={styles.recUnit}>원</span>
            </div>
            <div className={styles.recOptimal}>
              최적 <strong>{rec.optimal}만원</strong>
            </div>
            <div
              className={styles.recConfidence}
              style={{ color: confColor[rec.confidence] }}
            >
              신뢰도 {confText[rec.confidence]} ({mkt.sample_count}건)
            </div>
          </div>

          <div className={styles.rangeBarWrap}>
            <div className={styles.rangeBarLabels}>
              <span>최저 {mkt.min}만</span>
              <span>최고 {mkt.max}만</span>
            </div>
            <div className={styles.rangeBar}>
              <div
                className={styles.rangeBarRec}
                style={{
                  left: `${recLowPct}%`,
                  width: `${recHighPct - recLowPct}%`,
                }}
              />
              {curPct !== null && (
                <div
                  className={styles.rangeBarCurrent}
                  style={{ left: `${curPct}%` }}
                >
                  <div className={styles.rangeBarCurrentPin} />
                  <div className={styles.rangeBarCurrentLabel}>
                    {tr.current_price_wan}만
                  </div>
                </div>
              )}
              <div
                className={styles.rangeBarAvg}
                style={{ left: `${avgPct}%` }}
              >
                <div className={styles.rangeBarAvgPin} />
                <div className={styles.rangeBarAvgLabel}>평균</div>
              </div>
            </div>
            <div className={styles.rangeBarLegend}>
              <span>
                <span className={styles.legendRec} />
                추천구간
              </span>
              <span>
                <span className={styles.legendCur} />
                현재가
              </span>
              <span>
                <span className={styles.legendAvg} />
                평균
              </span>
            </div>
          </div>

          {tr.current_price_wan && (
            <div className={styles.compareRow}>
              <div className={styles.compareBox}>
                <div className={styles.compareLabel}>현재 임대료</div>
                <div className={styles.compareValue}>
                  {tr.current_price_wan}
                  <span>만원</span>
                </div>
              </div>
              <div
                className={styles.compareArrow}
                style={{ color: vInfo.color }}
              >
                {rec.verdict === 'underpriced'
                  ? '▼'
                  : rec.verdict === 'overpriced'
                    ? '▲'
                    : '→'}
              </div>
              <div
                className={styles.compareBox}
                style={{ borderColor: vInfo.color }}
              >
                <div
                  className={styles.compareLabel}
                  style={{ color: vInfo.color }}
                >
                  추천 최적가
                </div>
                <div
                  className={styles.compareValue}
                  style={{ color: vInfo.color }}
                >
                  {rec.optimal}
                  <span>만원</span>
                </div>
              </div>
            </div>
          )}
          <div className={styles.sampleNote}>
            반경 {report.search_params?.radius_km}km · 총{' '}
            {report.total_collected}건 수집 (직방·다방)
          </div>
        </div>
      )}

      {/* ── 근거표 탭 ── */}
      {activeTab === 'table' && (
        <div className={styles.priceBody}>
          <table className={styles.statsTable}>
            <thead>
              <tr>
                <th>항목</th>
                <th>금액(만원)</th>
                <th>해석</th>
              </tr>
            </thead>
            <tbody>
              {[
                [mkt.min, '최저가', '하위 매물 기준', null],
                [mkt.p25, '25%ile', '하위 25% 분위', null],
                [mkt.median, '중위가', '전체 중간값', styles.trHighlight],
                [mkt.avg, '평균가', '단순 평균', styles.trHighlight],
                [mkt.p75, '75%ile', '상위 25% 분위', null],
                [mkt.max, '최고가', '상위 매물 기준', null],
                [
                  rec.low,
                  '추천 하한',
                  'IQR 기반 하한',
                  styles.trRec,
                  '#60a5fa',
                ],
                [
                  rec.optimal,
                  '추천 최적',
                  '이상치 제거 평균',
                  styles.trRec,
                  '#34d399',
                  true,
                ],
                [
                  rec.high,
                  '추천 상한',
                  'IQR 기반 상한',
                  styles.trRec,
                  '#60a5fa',
                ],
              ].map(([val, label, desc, cls, color, bold]) => (
                <tr key={label} className={cls || ''}>
                  <td>{label}</td>
                  <td
                    className={styles.tdNum}
                    style={color ? { color, fontWeight: bold ? 800 : 700 } : {}}
                  >
                    {val}
                  </td>
                  <td className={styles.tdDesc}>{desc}</td>
                </tr>
              ))}
              {tr.current_price_wan && (
                <tr style={{ background: 'rgba(245,158,11,.08)' }}>
                  <td>현재 설정가</td>
                  <td className={styles.tdNum} style={{ color: vInfo.color }}>
                    {tr.current_price_wan}
                  </td>
                  <td className={styles.tdDesc} style={{ color: vInfo.color }}>
                    {vInfo.label}
                    {rec.gap_pct
                      ? ` ${rec.gap_pct > 0 ? '+' : ''}${rec.gap_pct}%`
                      : ''}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {report.basis_text && (
            <div className={styles.basisText}>
              {report.basis_text.split('\n').map((line, i) => (
                <div key={i} className={styles.basisLine}>
                  {line}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 유사매물 탭 ── */}
      {activeTab === 'listings' && (
        <div className={styles.priceBody}>
          {!hasListings ? (
            <div className={styles.noListings}>수집된 매물이 없습니다.</div>
          ) : (
            <>
              {withImg.length > 0 && (
                <>
                  <div className={styles.listingsSectionLabel}>
                    📷 사진 매물
                  </div>
                  <div className={styles.listingsGrid}>
                    {withImg.map((item, idx) => (
                      <ListingCard
                        key={`img-${idx}`}
                        item={item}
                        imgError={imgErrors[`img-${idx}`]}
                        onImgError={() =>
                          setImgErrors((p) => ({ ...p, [`img-${idx}`]: true }))
                        }
                      />
                    ))}
                  </div>
                </>
              )}
              {withoutImg.length > 0 && (
                <>
                  <div
                    className={styles.listingsSectionLabel}
                    style={{ marginTop: 12 }}
                  >
                    📋 실거래가 데이터
                  </div>
                  <div className={styles.listingsGrid}>
                    {withoutImg.map((item, idx) => (
                      <ListingCard
                        key={`nimg-${idx}`}
                        item={item}
                        imgError={true}
                        onImgError={() => {}}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ListingCard({ item, imgError, onImgError }) {
  return (
    <div
      className={styles.listingCard}
      onClick={() =>
        item.listing_url && window.open(item.listing_url, '_blank')
      }
    >
      <div className={styles.listingImg}>
        {item.image_url && !imgError ? (
          <img
            src={item.image_url}
            alt="매물"
            onError={onImgError}
            loading="lazy"
          />
        ) : (
          <div className={styles.listingImgPlaceholder}>🏠</div>
        )}
        <span className={styles.listingSource}>{item.source}</span>
        {item.distance_m != null && (
          <span className={styles.listingDist}>
            {item.distance_m < 1000
              ? `${item.distance_m}m`
              : `${(item.distance_m / 1000).toFixed(1)}km`}
          </span>
        )}
      </div>
      <div className={styles.listingInfo}>
        <div className={styles.listingPrice}>
          {item.rent_type === 'jeonse'
            ? `전세 ${item.deposit_wan}만`
            : `월 ${item.monthly_rent_wan}만 / 보증 ${item.deposit_wan}만`}
        </div>
        <div className={styles.listingMeta}>
          {item.size_pyeong && `${item.size_pyeong}평`}
          {item.floor && ` · ${item.floor}층`}
        </div>
        {item.building_name && (
          <div className={styles.listingBldg}>{item.building_name}</div>
        )}
        {item.options?.length > 0 && (
          <div className={styles.listingOptions}>
            {item.options.slice(0, 3).map((o, i) => (
              <span key={i} className={styles.listingOption}>
                {o}
              </span>
            ))}
            {item.options.length > 3 && (
              <span className={styles.listingOption}>
                +{item.options.length - 3}
              </span>
            )}
          </div>
        )}
        <div className={styles.listingMonth}>
          {item.is_realtime
            ? '현재 매물'
            : `${item.deal_month?.slice(0, 4)}.${item.deal_month?.slice(4)} 실거래`}
        </div>
      </div>
    </div>
  );
}

// ── 메시지 버블 ───────────────────────────────────────────────────────────────
function AdminActionButtons({ buttons }) {
  const navigate = useNavigate();
  if (!buttons?.length) return null;
  return (
    <div className={styles.actionButtons}>
      {buttons.map((btn, i) => (
        <button
          key={i}
          className={styles.actionBtn}
          onClick={() => {
            const url = btn.url || '';
            if (
              url.startsWith('http') ||
              url.startsWith('/ai/') ||
              url.startsWith('/api/ai/') ||
              url.startsWith('/api/')
            ) {
              const openUrl = url.startsWith('/ai/') ? `/api${url}` : url;
              window.open(openUrl, '_blank');
              return;
            }
            navigate(url);
          }}
        >
          {btn.icon && <span className={styles.actionBtnIcon}>{btn.icon}</span>}
          {btn.label}
        </button>
      ))}
    </div>
  );
}

function AdminMessageBubble({ msg }) {
  if (msg.role === 'user') {
    return (
      <div className={styles.rowUser}>
        <div className={styles.bubbleUser}>{msg.content}</div>
      </div>
    );
  }
  const { rest: cleanText, data: report } = extractMarker(
    msg.content,
    'PRICE_REPORT'
  );
  return (
    <div className={styles.rowAssistant}>
      <div className={styles.bubbleAvatar}>⚙️</div>
      <div style={{ maxWidth: '92%', minWidth: 0 }}>
        {cleanText && (
          <div className={styles.bubbleAssistant}>
            {cleanText.split('\n').map((line, i, arr) => (
              <React.Fragment key={i}>
                {line}
                {i < arr.length - 1 && <br />}
              </React.Fragment>
            ))}
          </div>
        )}
        {report && <PriceReportCard report={report} />}
        {msg.buttons?.length > 0 && (
          <AdminActionButtons buttons={msg.buttons} />
        )}
        <div className={styles.bubbleTime}>{formatTime(msg.ts)}</div>
      </div>
    </div>
  );
}

function TypingIndicator({ label }) {
  return (
    <div className={styles.typingRow}>
      <div className={styles.bubbleAvatar}>⚙️</div>
      <div className={styles.typingBubble}>
        <div className={styles.dot} />
        <div className={styles.dot} />
        <div className={styles.dot} />
        {label && <span className={styles.typingLabel}>{label}</span>}
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
export default function AdminChatBot({ user }) {
  const adminId = user?.userId || user?.id || 'admin';
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(() => loadAdminHistory(adminId));
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState('');
  const [error, setError] = useState(null);
  const [retryPrompt, setRetryPrompt] = useState('');
  const [hasUnread, setHasUnread] = useState(false);

  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const messagesRef = useRef(messages);
  const isSendingRef = useRef(false);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  useEffect(() => {
    if (messages.length > 0) saveAdminHistory(adminId, messages);
  }, [messages, adminId]);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);
  useEffect(() => {
    if (!open && messages.at(-1)?.role === 'assistant') setHasUnread(true);
  }, [messages, open]);

  const STOCK_ALERT_KEY = `uniplace_stock_alert_seen_${adminId}`;
  async function fetchStockAlert() {
    try {
      const res = await api.get(`/ai/admin/stock-alerts?adminId=${adminId}`);
      const message = res?.data?.alert;
      if (!message) return;
      const today = new Date().toISOString().slice(0, 10);
      if (localStorage.getItem(STOCK_ALERT_KEY) === today) return;
      setMessages((p) => [
        ...p,
        {
          role: 'assistant',
          content: message,
          buttons: [
            {
              label: '룸서비스 상품 관리',
              url: '/admin/roomservice/room_products',
              icon: '📦',
            },
          ],
          ts: Date.now(),
          isAlert: true,
        },
      ]);
      setHasUnread(true);
      localStorage.setItem(STOCK_ALERT_KEY, today);
    } catch {}
  }

  function onOpen() {
    setOpen(true);
    setHasUnread(false);
    fetchStockAlert();
    setTimeout(() => {
      textareaRef.current?.focus();
      bottomRef.current?.scrollIntoView({ behavior: 'auto' });
    }, 80);
  }
  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const sendMessage = useCallback(
    async function (text) {
      const trimmed = (text != null ? text : input).trim();
      if (!trimmed || isSendingRef.current) return;
      isSendingRef.current = true;
      setInput('');
      setError(null);
      setRetryPrompt(trimmed);
      setMessages((p) => [
        ...p,
        { role: 'user', content: trimmed, ts: Date.now() },
      ]);
      setLoading(true);
      setLoadingLabel('AI 분석 중…');
      try {
        const result = await sendToAdminChatbot(
          trimmed,
          adminId,
          messagesRef.current,
          (label) => setLoadingLabel(label) // ← 단계별 레이블 실시간 업데이트
        );
        setMessages((p) => [
          ...p,
          {
            role: 'assistant',
            content: result.answer,
            buttons: result.buttons,
            ts: Date.now(),
            metadata: result.metadata,
          },
        ]);
        setRetryPrompt('');
      } catch (e) {
        setError(e);
      } finally {
        setLoading(false);
        setLoadingLabel('');
        isSendingRef.current = false;
      }
    },
    [input, adminId]
  );

  const clear = useCallback(() => {
    clearAdminHistory(adminId);
    setMessages([]);
    setError(null);
  }, [adminId]);

  const quickQuestions = QUICK_QUESTIONS?.admin || [
    '미납 현황 요약해줘',
    '민원 처리 현황 알려줘',
    '계약 이상 감지 결과',
    '룸서비스 재고 현황은?',
    '각 건물 이번달 결제 내역 문서 만들어줘',
    'C건물 120호 적정 월세 추천해줘',
  ];

  return (
    <>
      {/* 플로팅 버튼 */}
      <button
        className={styles.fab}
        onClick={open ? () => setOpen(false) : onOpen}
        aria-label="관리자 AI"
        title="관리자 AI 어시스턴트"
      >
        {open ? (
          <svg
            className={styles.fabIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg
            className={styles.fabIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <path d="M12 2l1.5 3.5L17 4l-1 3.5 3.5 1-2.5 2.5 1.5 3.5-3.5-1L12 17l-3-3.5-3.5 1 1.5-3.5L4.5 8.5l3.5-1L7 4l3.5 1.5z" />
            <circle cx="12" cy="10" r="2" />
          </svg>
        )}
        {hasUnread && !open && <span className={styles.badge} />}
        {!open && <span className={styles.fabLabel}>AI</span>}
      </button>

      {open && (
        <div
          className={styles.panel}
          role="dialog"
          aria-label="관리자 AI 어시스턴트"
        >
          {/* 헤더 */}
          <div className={styles.header}>
            <div className={styles.headerAvatar}>⚙️</div>
            <div className={styles.headerInfo}>
              <p className={styles.headerTitle}>관리자 AI 어시스턴트</p>
              <p className={styles.headerSub}>
                {user?.userName || user?.name || '관리자'}님
                <span className={styles.featureBadge}>웹검색</span>
                <span className={styles.featureBadge}>DB조회</span>
                <span className={styles.featureBadge}>시세분석</span>
              </p>
            </div>
            <div className={styles.statusDot} />
            <div className={styles.headerActions}>
              <button className={styles.iconBtn} onClick={clear} title="초기화">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                >
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 .49-3.51" />
                </svg>
              </button>
              <button
                className={styles.iconBtn}
                onClick={() => setOpen(false)}
                title="닫기"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* 메시지 */}
          <div className={styles.body}>
            {messages.length === 0 ? (
              <div className={styles.welcome}>
                <span className={styles.welcomeEmoji}>⚙️</span>
                <p className={styles.welcomeTitle}>관리자 AI 어시스턴트</p>
                <p className={styles.welcomeText}>
                  DB 조회, 운영 통계, 주변 시세 분석까지
                  <br />
                  무엇이든 물어보세요.
                </p>
                <div className={styles.featureList}>
                  <span>🔍 웹 검색</span>
                  <span>🗄️ 전체 DB 조회</span>
                  <span>📊 운영 통계</span>
                  <span>🏠 주변 시세 분석</span>
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <AdminMessageBubble key={`${msg.ts}-${i}`} msg={msg} />
              ))
            )}
            {loading && <TypingIndicator label={loadingLabel} />}
            {error && (
              <ErrorActionNotice
                error={error}
                fallback="관리자 AI 요청 처리 중 오류가 발생했습니다."
                onRetry={
                  retryPrompt
                    ? () => {
                        setError(null);
                        sendMessage(retryPrompt);
                      }
                    : undefined
                }
                compact
                variant="dark"
                className={styles.errorNotice}
              />
            )}
            <div ref={bottomRef} />
          </div>

          {/* 빠른 질문 */}
          {messages.length === 0 && (
            <div className={styles.quickChips}>
              {quickQuestions.map((q) => (
                <button
                  key={q}
                  className={styles.chip}
                  onClick={() => sendMessage(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* 입력 */}
          <div className={styles.footer}>
            <div className={styles.inputRow}>
              <textarea
                ref={textareaRef}
                className={styles.textarea}
                placeholder="예: C건물 120호 월세 적정한지 분석해줘"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
              />
              <button
                className={styles.sendBtn}
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                aria-label="전송"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
            <div className={styles.bottomBtns}>
              <button
                className={styles.bottomBtn}
                onClick={() => {
                  setInput('결제 내역 문서 만들어줘');
                  setTimeout(() => textareaRef.current?.focus(), 50);
                }}
                disabled={loading}
              >
                💰 결제 문서 생성
              </button>
              <button
                className={styles.bottomBtn}
                onClick={() => {
                  setInput('  월세 적정한지 분석해줘');
                  setTimeout(() => textareaRef.current?.focus(), 50);
                }}
                disabled={loading}
              >
                🏷️ 방 가격 추천
              </button>
            </div>
            <p className={styles.footerNote}>
              🔒 관리자 전용 · DB 전체 접근 · 직방·다방 시세 분석
            </p>
          </div>
        </div>
      )}
    </>
  );
}
