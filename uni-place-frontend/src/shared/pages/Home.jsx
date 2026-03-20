import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../../app/layouts/components/Header';
import Footer from '../../app/layouts/components/Footer';
import BannerSlider from '../components/BannerSlider/BannerSlider';
import { propertyApi } from '../../features/property/api/propertyApi';
import { noticeApi } from '../../app/http/noticeApi';
import { communityApi } from '../../features/community/api/communityApi';
import { supportApi } from '../../features/support/api/supportApi';
import { AiTop3Section } from './AiTop3Section';
import styles from './Home.module.css';

/* ═══════════════════════════════════════════════════════════════
   useFadeIn  —  양방향 반복 스크롤 애니메이션
   · 뷰포트 진입 시 → visible=true (애니메이션 실행)
   · 뷰포트 이탈 시 → visible=false (숨김 상태로 리셋)
   · 매 스크롤마다 반복, 위로 올라갈 때도 동일하게 작동
   ═══════════════════════════════════════════════════════════════ */
function useFadeIn(threshold = 0.08, direction = 'up') {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        // 진입 시 true, 이탈 시 false → 매번 반복
        setVisible(entry.isIntersecting);
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  /* 방향별 CSS 클래스 매핑 */
  const animClass = {
    up:    styles.fadeInUp,
    left:  styles.fadeInLeft,
    right: styles.fadeInRight,
    scale: styles.fadeInScale,
  }[direction] ?? styles.fadeInUp;

  return [ref, visible, animClass];
}

/* ── IntroActionSection ──────────────────────────────────── */
function IntroActionSection() {
  const navigate = useNavigate();
  const [ref, visible, animClass] = useFadeIn(0.08, 'up');

  return (
    <section className={styles.introSection}>
      <div className={styles.contentWide}>
        <div
          ref={ref}
          className={`${styles.introCard} ${visible ? animClass : styles.fadeHidden}`}
        >
          {/* 좌측 하단 텍스트 */}
          <div className={styles.introCardLeft}>
            <p className={styles.introKicker}>UNI-PLACE</p>
            <h2 className={styles.introTitle}>
              공간을 넘어,<br />
              삶을 연결하는<br />
              주거 플랫폼
            </h2>
          </div>
          {/* 우측 하단 버튼 */}
          <button
            type="button"
            className={styles.introBtn}
            onClick={() => navigate('/company_info')}
          >
            UNI-PLACE 알아보기
          </button>
        </div>
      </div>
    </section>
  );
}

/* ── NoticeAndPopularSection ─────────────────────────────── */
function NoticeAndPopularSection() {
  const navigate = useNavigate();
  const [notices, setNotices] = useState([]);
  const [popular, setPopular] = useState([]);
  const [noticeLoading, setNoticeLoading] = useState(true);
  const [popularLoading, setPopularLoading] = useState(true);
  const [ref, visible, animClass] = useFadeIn(0.08, 'up');

  useEffect(() => {
    noticeApi
      .getList({ page: 1, size: 3, sort: 'noticeId,desc', importance: 'Y' })
      .then((res) => {
        const content = res?.data?.data?.content ?? res?.data?.content ?? res?.content ?? [];
        setNotices(content.slice(0, 3));
      })
      .catch(() => setNotices([]))
      .finally(() => setNoticeLoading(false));

    communityApi
      .getBoards({ page: 1, size: 20, auth: false })
      .then((res) => {
        const content = res?.content ?? [];
        const sorted = [...content].sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0));
        setPopular(sorted.slice(0, 4));
      })
      .catch(() => setPopular([]))
      .finally(() => setPopularLoading(false));
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return String(dateStr).slice(0, 10).replace(/-/g, '.');
  };

  return (
    <section className={styles.eventSectionInner}>
      <div className={styles.contentWide}>
        <div className={`${styles.sectionHeadCenter} ${styles.fadeInUp}`} style={{ animationDelay: '0.05s' }}>
          <p className={styles.sectionEyebrow}>UNI-PLACE 커뮤니티</p>
          <h2 className={styles.sectionTitle}>공지사항 · 인기 게시글</h2>
        </div>

        <div
          ref={ref}
          className={`${styles.eventGrid} ${visible ? animClass : styles.fadeHidden}`}
          style={{ animationDelay: '0.1s' }}
        >
          {/* 왼쪽: 공지 */}
          <div className={styles.eventCol}>
            <div className={`${styles.eventDate} ${styles.eventDateLeft}`}>중요 공지사항</div>
            <div className={styles.eventList}>
              {[0, 1, 2].map((i) => {
                const n = notices[i];
                if (noticeLoading) return (
                  <div key={i} className={styles.eventCard} style={{ opacity: 0.3 }}>
                    <div className={styles.noticeCardBody}>
                      <div className={styles.skeletonBar} style={{ width: '65%' }} />
                      <div className={styles.skeletonBar} style={{ width: '35%', marginTop: 8 }} />
                    </div>
                  </div>
                );
                if (!n) return (
                  <div key={i} className={`${styles.eventCard} ${styles.emptyCard}`}>
                    <div className={styles.noticeCardBody}>
                      {i === 0 && <span className={styles.emptyMsg}>등록된 중요 공지가 없습니다.</span>}
                    </div>
                  </div>
                );
                return (
                  <div
                    key={n.noticeId}
                    className={`${styles.eventCard} ${styles.noticeCard}`}
                    onClick={() => navigate(`/support/notice/${n.noticeId}`)}
                  >
                    <div className={styles.noticeCardBody}>
                      <span className={styles.noticeBadge}>공지</span>
                      <p className={styles.noticeCardTitle}>{n.noticeTitle}</p>
                      <div className={styles.noticeCardMeta}>
                        <span>{formatDate(n.createdAt)}</span>
                        <span>조회 {n.readCount ?? 0}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <button
                className={styles.primaryPill}
                style={{ marginTop: '0.5rem' }}
                type="button"
                onClick={() => navigate('/support/notice')}
              >
                공지 전체보기
              </button>
            </div>
          </div>

          <div className={styles.eventDivider} aria-hidden="true" />

          {/* 오른쪽: 인기 */}
          <div className={styles.eventCol}>
            <div className={`${styles.eventDate} ${styles.eventDateRight}`}>인기 게시글</div>
            <div className={styles.eventList}>
              {[0, 1, 2, 3].map((i) => {
                const b = popular[i];
                if (popularLoading) return (
                  <div key={i} className={styles.eventCard} style={{ opacity: 0.3 }}>
                    <div className={styles.popularCardBody}>
                      <div className={styles.skeletonBar} style={{ width: '55%' }} />
                      <div className={styles.skeletonBar} style={{ width: '30%', marginTop: 8 }} />
                    </div>
                  </div>
                );
                if (!b) return (
                  <div key={i} className={`${styles.eventCard} ${styles.emptyCard}`}>
                    <div className={styles.popularCardBody}>
                      {i === 0 && <span className={styles.emptyMsg}>등록된 게시글이 없습니다.</span>}
                    </div>
                  </div>
                );
                return (
                  <div
                    key={b.boardId}
                    className={`${styles.eventCard} ${styles.popularCard}`}
                    onClick={() => navigate(`/community/${b.boardId}`)}
                  >
                    <div className={styles.popularCardBody}>
                      <div className={styles.popularContent}>
                        <p className={styles.popularTitle}>{b.boardTitle}</p>
                        <div className={styles.popularMeta}>
                          <span className={styles.popularLike}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{display:'inline',verticalAlign:'middle',marginRight:2}}>
                              <path d="M12 21C12 21 3 14 3 8a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6-9 13-9 13z"/>
                            </svg>
                            {b.likeCount ?? 0}
                          </span>
                          <span className={styles.popularDot}>·</span>
                          <span>조회 {b.readCount ?? 0}</span>
                          <span className={styles.popularDot}>·</span>
                          <span className={styles.popularAuthor}>{b.userId}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <button
                className={styles.primaryPill}
                style={{ marginTop: '0.5rem' }}
                type="button"
                onClick={() => navigate('/community')}
              >
                커뮤니티 전체보기
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── RecommendCarousel ───────────────────────────────────── */
function RecommendCarousel() {
  const items = [
    { title: '강남역 10분 프리미엄 코리빙', desc: '프라이빗 룸과 라운지, 피트니스가 결합된 시그니처 하우스', tag: '서울시 강남구', img: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80' },
    { title: '여성 전용 하우스', desc: '보안 강화 출입 시스템과 조용한 스터디 라운지 제공', tag: '서울시 마포구', img: 'https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1200&q=80' },
    { title: '성수 반려동물 가능 하우스', desc: '산책 동선과 펫케어존이 갖춰진 코리빙 공간', tag: '서울시 성동구', img: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80' },
    { title: '장기거주 특화 하우스', desc: '장기 계약 입주자를 위한 업무/휴식 동선 최적화', tag: '서울시 송파구', img: 'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?auto=format&fit=crop&w=1200&q=80' },
  ];

  const cardWidth = 320;
  const gap = 24;
  const slideSize = cardWidth + gap;
  const extended = [...items, ...items, ...items];

  const [index, setIndex] = useState(items.length);
  const [transition, setTransition] = useState(true);
  const [ref, visible, animClass] = useFadeIn(0.1, 'up');

  const next = () => setIndex((p) => p + 1);
  const prev = () => setIndex((p) => p - 1);

  const handleTransitionEnd = () => {
    if (index >= items.length * 2) {
      setTransition(false);
      requestAnimationFrame(() => requestAnimationFrame(() => setIndex(items.length)));
      return;
    }
    if (index < items.length) {
      setTransition(false);
      requestAnimationFrame(() => requestAnimationFrame(() => setIndex(items.length * 2 - 1)));
    }
  };

  useEffect(() => {
    if (!transition) {
      const t = requestAnimationFrame(() => requestAnimationFrame(() => setTransition(true)));
      return () => cancelAnimationFrame(t);
    }
    return undefined;
  }, [transition]);

  const realIndex = ((index % items.length) + items.length) % items.length;

  return (
    <div
      ref={ref}
      className={`${styles.recoWrap} ${visible ? animClass : styles.fadeHidden}`}
    >
      <div className={styles.contentWide} style={{ marginBottom: 24 }}>
        <p className={styles.sectionEyebrow}>추천 공간</p>
        <h2 className={styles.sectionTitle} style={{ marginTop: 8 }}>UNI-PLACE 하우스</h2>
      </div>

      <div
        className={styles.recoTrack}
        style={{
          gap: `${gap}px`,
          transform: `translate3d(-${index * slideSize}px, 0, 0)`,
          transition: transition ? 'transform 500ms cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        {extended.map((item, i) => (
          <article key={i} className={styles.recoCard}>
            <div className={styles.recoImageWrap}>
              <img src={item.img} alt={item.title} className={styles.recoImage} />
            </div>
            <div className={styles.recoBody}>
              <div className={styles.recoTitle}>{item.title}</div>
              <div className={styles.recoDesc}>{item.desc}</div>
              <div className={styles.recoTag}>{item.tag}</div>
            </div>
          </article>
        ))}
      </div>

      <div className={styles.recoBottomUi}>
        <div className={styles.recoProgressWrap}>
          <div className={styles.recoIndex}>{realIndex + 1} / {items.length}</div>
          <div className={styles.recoProgressBar}>
            <div className={styles.recoProgressFill} style={{ width: `${((realIndex + 1) / items.length) * 100}%` }} />
          </div>
        </div>
        <div className={styles.recoNavWrap}>
          <button onClick={prev} className={styles.circleBtn} type="button" aria-label="prev">&#8249;</button>
          <button onClick={next} className={styles.circleBtn} type="button" aria-label="next">&#8250;</button>
        </div>
      </div>
    </div>
  );
}

/* ── NoticeSection ───────────────────────────────────────────
   왼쪽  : 민원·Q&A 바로가기 두 CTA 카드
   오른쪽 : DB에서 가져온 FAQ 아코디언 (클릭 시 답변 펼침)
──────────────────────────────────────────────────────────── */
function NoticeSection() {
  const navigate = useNavigate();
  const [ref, visible, animClass] = useFadeIn(0.08, 'scale');

  /* ── FAQ 실데이터 로드 ── */
  const [faqs, setFaqs]           = useState([]);
  const [faqLoading, setFaqLoading] = useState(true);
  const [openFaqId, setOpenFaqId]   = useState(null); // 현재 펼쳐진 FAQ id

  useEffect(() => {
    supportApi
      .getFaqs({ page: 1, size: 5, sort: 'faqId', direct: 'DESC' })
      .then((data) => setFaqs(data?.content ?? []))
      .catch(() => setFaqs([]))
      .finally(() => setFaqLoading(false));
  }, []);

  /* 같은 항목 클릭하면 닫히고, 다른 항목 클릭하면 열림 */
  const toggleFaq = (id) =>
    setOpenFaqId((prev) => (prev === id ? null : id));

  /* FAQ 카테고리 코드 → 한글 라벨 */
  const CODE_LABEL = {
    SUP_GENERAL:    '일반',
    SUP_BILLING:    '요금/정산',
    FAQ_CONTRACT:   '계약',
    FAQ_FACILITY:   '시설 이용',
    FAQ_MOVEINOUT:  '입주/퇴실',
    FAQ_ROOMSERVICE:'룸서비스',
    FAQ_COMMUNITY:  '커뮤니티',
    FAQ_ETC:        '기타',
  };

  return (
    <section className={styles.noticeSection}>
      <div
        ref={ref}
        className={`${styles.nfWrap} ${visible ? animClass : styles.fadeHidden}`}
      >

        {/* ── 왼쪽: 민원·Q&A CTA 카드 ── */}
        <div className={styles.nfCtaCol}>
          <div className={styles.nfCtaHeader}>
            <span className={styles.nfNoticeTag}>고객센터</span>
            <h3 className={styles.nfNoticeTitle}>문의 바로가기</h3>
          </div>

          <div className={styles.nfCtaCards}>
            {/* 민원 카드 — 아이콘 제거, 텍스트 + 화살표만 */}
            <button
              type="button"
              className={styles.nfCtaCard}
              onClick={() => navigate('/support/complain')}
            >
              <div className={styles.nfCtaCardText}>
                <strong>민원 접수</strong>
                <span>불편사항을 접수합니다</span>
              </div>
              <span className={styles.nfCtaArrow}>→</span>
            </button>

            {/* Q&A 카드 — 아이콘 제거 */}
            <button
              type="button"
              className={styles.nfCtaCard}
              onClick={() => navigate('/support/qna')}
            >
              <div className={styles.nfCtaCardText}>
                <strong>Q&A 문의</strong>
                <span>궁금한 점을 1:1로 문의합니다</span>
              </div>
              <span className={styles.nfCtaArrow}>→</span>
            </button>
          </div>
        </div>

        {/* ── 오른쪽: FAQ 아코디언 ── */}
        <article className={styles.nfFaqPanel}>
          <div className={styles.nfFaqHeader}>
            <span className={styles.nfNoticeTag}>FAQ</span>
            <h3 className={styles.nfNoticeTitle}>자주 묻는 질문</h3>
            <p className={styles.nfFaqSubtitle}>입주 전후 궁금한 점을 한 번에 해결해보세요.</p>
          </div>

          <div className={styles.nfAccordion}>
            {faqLoading ? (
              /* 로딩 스켈레톤 3개 */
              [0, 1, 2].map((i) => (
                <div key={i} className={styles.nfAccordionItem}>
                  <div className={styles.nfAccordionSkeleton}>
                    <div className={styles.skeletonBar} style={{ width: '65%' }} />
                  </div>
                </div>
              ))
            ) : faqs.length === 0 ? (
              <p className={styles.nfEmpty}>등록된 FAQ가 없습니다.</p>
            ) : (
              faqs.map((faq) => {
                const isOpen = openFaqId === faq.faqId;
                const codeLabel = CODE_LABEL[faq.code] ?? faq.code ?? '';
                return (
                  <div
                    key={faq.faqId}
                    className={`${styles.nfAccordionItem} ${isOpen ? styles.nfAccordionItemOpen : ''}`}
                  >
                    {/* 질문 행 — 클릭 시 토글 */}
                    <button
                      type="button"
                      className={styles.nfAccordionQ}
                      onClick={() => toggleFaq(faq.faqId)}
                      aria-expanded={isOpen}
                    >
                      <span className={styles.nfQBadge}>Q</span>
                      {codeLabel && (
                        <span className={styles.nfCodeBadge}>{codeLabel}</span>
                      )}
                      <span className={styles.nfQTitle}>{faq.faqTitle}</span>
                      <span
                        className={`${styles.nfAccordionChevron} ${isOpen ? styles.nfChevronOpen : ''}`}
                        aria-hidden="true"
                      >›</span>
                    </button>

                    {/* 답변 — isOpen 일 때만 표시 */}
                    {isOpen && (
                      <div className={styles.nfAccordionA}>
                        <span className={styles.nfABadge}>A</span>
                        <p className={styles.nfAText}>{faq.faqCtnt}</p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <button
            type="button"
            className={styles.nfNoticeCta}
            onClick={() => navigate('/support/faq')}
          >
            <span>FAQ 전체보기</span>
            <span className={styles.nfArrow}>→</span>
          </button>
        </article>

      </div>
    </section>
  );
}

/* ── NewsGuideSection — 뉴스·입주가이드 패널 (인트로 바로 아래) ── */
function NewsGuideSection() {
  const navigate = useNavigate();
  const [refL, visibleL, animL] = useFadeIn(0.1, 'left');
  const [refR, visibleR, animR] = useFadeIn(0.1, 'right');

  return (
    <section className={styles.livingSection} style={{ paddingBottom: 48 }}>
      <div className={styles.contentWide}>
        <div className={styles.livingGrid}>
          {/* 뉴스 패널 — 어두운 도시 사진 배경 */}
          <article
            ref={refL}
            className={`${styles.livingPanel} ${styles.livingPanelNews} ${visibleL ? animL : styles.fadeHidden}`}
          >
            <span className={styles.livingEyebrow}>NEWSROOM</span>
            <h3 className={styles.livingTitleLight}>최근 소식</h3>
            <p className={styles.livingDescLight}>신규 하우스 오픈, 서비스 업데이트 등 UNI-PLACE의 새로운 소식을 확인해보세요.</p>
            <button type="button" className={styles.livingBtnLight} onClick={() => navigate('/news')}>뉴스 보기 →</button>
          </article>
          {/* 가이드 패널 — 따뜻한 앰버 인테리어 배경 */}
          <article
            ref={refR}
            className={`${styles.livingPanel} ${styles.livingPanelGuide} ${visibleR ? animR : styles.fadeHidden}`}
            style={{ animationDelay: '0.12s' }}
          >
            <span className={styles.livingEyebrow}>MOVE-IN GUIDE</span>
            <h3 className={styles.livingTitleLight}>입주 가이드</h3>
            <p className={styles.livingDescLight}>계약부터 입주까지 필요한 절차를 단계별로 안내합니다.</p>
            <button type="button" className={styles.livingBtnLight} onClick={() => navigate('/guide')}>가이드 보기 →</button>
          </article>
        </div>
      </div>
    </section>
  );
}

/* ── LivingTypeSection — 주거유형 살피기만 ───────────────────── */
function LivingTypeSection() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [roomType, setRoomType]       = useState(() => searchParams.get('roomType') || '');
  const [petAllowedYn, setPetAllowedYn] = useState(() => searchParams.get('petAllowedYn') || '');
  const [sunDirection, setSunDirection] = useState(() => searchParams.get('sunDirection') || '');
  const [rooms, setRooms]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [ref, visible, animClass] = useFadeIn(0.08, 'up');

  useEffect(() => {
    const fetchRooms = async () => {
      setLoading(true); setError('');
      try {
        const data = await propertyApi.getRoomsAll({
          page: 1, size: 6, sort: 'roomId', direct: 'DESC',
          roomType: roomType || undefined,
          petAllowedYn: petAllowedYn || undefined,
          sunDirection: sunDirection || undefined,
          roomSt: 'available',
        });
        setRooms(data?.content || []);
      } catch (e) {
        setError(e?.message || '방 목록을 불러오지 못했습니다.'); setRooms([]);
      } finally { setLoading(false); }
    };
    fetchRooms();
  }, [roomType, petAllowedYn, sunDirection]);

  useEffect(() => {
    const p = {};
    if (roomType)    p.roomType    = roomType;
    if (petAllowedYn) p.petAllowedYn = petAllowedYn;
    if (sunDirection) p.sunDirection = sunDirection;
    setSearchParams(p, { replace: true });
  }, [roomType, petAllowedYn, sunDirection, setSearchParams]);

  const roomTypeOptions = [
    { label: '전체', value: '' }, { label: '원룸형', value: 'one_room' },
    { label: '투룸형', value: 'two_room' }, { label: '쓰리룸형', value: 'three_room' },
    { label: '복층', value: 'loft' }, { label: '쉐어', value: 'share' },
  ];
  const petOptions = [
    { label: '반려동물 무관', value: '' }, { label: '반려동물 가능', value: 'Y' }, { label: '반려동물 불가', value: 'N' },
  ];
  const sunOptions = [
    { label: '채광 무관', value: '' }, { label: '남향', value: 's' },
    { label: '동향', value: 'e' }, { label: '서향', value: 'w' }, { label: '북향', value: 'n' },
  ];
  const roomTypeLabelMap = { one_room: '원룸형', two_room: '투룸형', three_room: '쓰리룸형', loft: '복층', share: '쉐어' };
  const sunDirectionLabelMap = { n: '북향', s: '남향', e: '동향', w: '서향' };

  return (
    <section className={styles.sectionSoft}>
      <div className={styles.contentWide}>
        <div
          ref={ref}
          className={visible ? animClass : styles.fadeHidden}
        >
          <div className={styles.typeWrap}>
            <h3 className={styles.typeTitle}>주거유형 살피기</h3>
            <div className={styles.typeList}>
              {roomTypeOptions.map((o) => (
                <button
                  key={o.value || 'all'}
                  type="button"
                  className={`${styles.typeChip} ${roomType === o.value ? styles.typeChipActive : ''}`}
                  onClick={() => setRoomType(o.value)}
                >{o.label}</button>
              ))}
            </div>
            <div className={styles.typeSelectRow}>
              <select className={styles.typeSelect} value={petAllowedYn} onChange={(e) => setPetAllowedYn(e.target.value)}>
                {petOptions.map((o) => <option key={o.value || 'all'} value={o.value}>{o.label}</option>)}
              </select>
              <select className={styles.typeSelect} value={sunDirection} onChange={(e) => setSunDirection(e.target.value)}>
                {sunOptions.map((o) => <option key={o.value || 'all'} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {loading ? (
              <p className={styles.typeHint}>조건에 맞는 방을 불러오는 중입니다...</p>
            ) : error ? (
              <p className={styles.typeHintError}>{error}</p>
            ) : (
              <>
                <div className={styles.quickRoomGrid}>
                  {rooms.map((room) => (
                    <button
                      key={room.roomId}
                      type="button"
                      className={styles.quickRoomCard}
                      onClick={() => navigate(`/rooms/${room.roomId}`)}
                    >
                      <p className={styles.quickRoomName}>{room.buildingNm} {room.roomNo}호</p>
                      <p className={styles.quickRoomMeta}>
                        {roomTypeLabelMap[room.roomType] || '-'} · {sunDirectionLabelMap[room.sunDirection] || '-'} · {room.petAllowedYn === 'Y' ? '반려 가능' : '반려 불가'}
                      </p>
                      <p className={styles.quickRoomPrice}>월 {Number(room.rentPrice || 0).toLocaleString()}원</p>
                    </button>
                  ))}
                </div>
                {!rooms.length && <p className={styles.typeHint}>조건에 맞는 방이 없습니다.</p>}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Home (메인)
   ═══════════════════════════════════════════════════════════════ */
export default function Home() {
  const heroVideos = ['videos/city.mp4', 'videos/building.mp4', 'videos/room.mp4'];

  const [slotA, setSlotA] = useState({ src: heroVideos[0], visible: true });
  const [slotB, setSlotB] = useState({ src: heroVideos[1], visible: false });
  const [activeSlot, setActiveSlot] = useState('A');
  const [vidIndex, setVidIndex]     = useState(0);
  const [progress, setProgress]     = useState(0);
  const [isPlaying, setIsPlaying]   = useState(true);

  const refA = useRef(null);
  const refB = useRef(null);

  const activeRef  = activeSlot === 'A' ? refA : refB;
  const standbyRef = activeSlot === 'A' ? refB : refA;

  useEffect(() => {
    const video = activeRef.current;
    if (!video) return undefined;

    const updateProgress = () => {
      if (!video.duration) return;
      setProgress((video.currentTime / video.duration) * 100);
    };

    const handleEnded = () => {
      const nextIdx = vidIndex === heroVideos.length - 1 ? 0 : vidIndex + 1;
      const nextSrc = heroVideos[nextIdx];
      if (activeSlot === 'A') {
        setSlotB({ src: nextSrc, visible: true });
        if (standbyRef.current) { standbyRef.current.load(); standbyRef.current.play().catch(() => {}); }
        setSlotA((p) => ({ ...p, visible: false }));
        setActiveSlot('B');
      } else {
        setSlotA({ src: nextSrc, visible: true });
        if (standbyRef.current) { standbyRef.current.load(); standbyRef.current.play().catch(() => {}); }
        setSlotB((p) => ({ ...p, visible: false }));
        setActiveSlot('A');
      }
      setVidIndex(nextIdx);
      setProgress(0);
    };

    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('ended', handleEnded);
    return () => {
      video.removeEventListener('timeupdate', updateProgress);
      video.removeEventListener('ended', handleEnded);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSlot, vidIndex]);

  const togglePlay = () => {
    const video = activeRef.current;
    if (!video) return;
    if (isPlaying) video.pause(); else video.play();
    setIsPlaying(!isPlaying);
  };

  return (
    <div className={styles.page}>
      <Header />

      {/* ── HERO ── */}
      <section className={styles.heroSection}>
        <video
          ref={refA}
          src={slotA.src}
          autoPlay={activeSlot === 'A'}
          muted playsInline
          className={styles.heroVideo}
          style={{ opacity: slotA.visible ? 1 : 0, transition: 'opacity 1200ms ease', zIndex: slotA.visible ? 2 : 1 }}
        />
        <video
          ref={refB}
          src={slotB.src}
          autoPlay={activeSlot === 'B'}
          muted playsInline
          className={styles.heroVideo}
          style={{ opacity: slotB.visible ? 1 : 0, transition: 'opacity 1200ms ease', zIndex: slotB.visible ? 2 : 1 }}
        />
        <div className={styles.heroOverlay} style={{ zIndex: 3 }} />

        <div className={styles.heroContentWrap} style={{ zIndex: 4 }}>
          <div className={styles.heroInner}>
            {/* 골드 라인 애니메이션 */}
            <div className={styles.heroLine} aria-hidden="true" />
            <h1 className={styles.heroMainTitle}>
              생활하는 공유주거를<br />한 번에 찾는 방법
            </h1>
            <p className={styles.heroSubTitle}>
              지역과 예산, 라이프스타일에 맞춘 코리빙 탐색 UNI-PLACE
            </p>
            <div className={styles.heroCta}>
              <a href="/rooms" className={styles.heroCtaBtn}>방 둘러보기</a>
            </div>
          </div>
        </div>

        {/* 비디오 컨트롤 */}
        <div className={styles.heroControlWrap} style={{ zIndex: 4 }}>
          <div className={styles.heroProgressRail}>
            <div className={styles.heroProgressFill} style={{ width: `${progress}%` }} />
          </div>
          <div className={styles.heroControlRow}>
            <span>{String(vidIndex + 1).padStart(2, '0')} / {String(heroVideos.length).padStart(2, '0')}</span>
            <button type="button" onClick={togglePlay} className={styles.heroPlayBtn}>
              {isPlaying ? '일시정지' : '재생'}
            </button>
          </div>
        </div>

        {/* 아래 스크롤 유도 */}
        <div className={styles.heroScroll} style={{ zIndex: 4 }} aria-hidden="true">
          <div className={styles.heroScrollDot} />
        </div>
      </section>

      {/* ══ ZONE 1 — 회사소개 구역 (아이보리 크림) ══════════════ */}
      <div className={styles.zoneIntro}>
        <IntroActionSection />
        <NewsGuideSection />
      </div>

      <div className={styles.zoneDivider} aria-hidden="true" />

      {/* ══ ZONE 2 — 방찾기 구역 (화이트 + 골드 글로우) ══════════ */}
      <div className={styles.zone2}>
        <AiTop3Section />
        <LivingTypeSection />
      </div>

      <div className={styles.zoneDivider} aria-hidden="true" />

      {/* ══ ZONE 3 — 커뮤니티·고객센터 구역 (스모크 그레이) ══════ */}
      <div className={styles.zone3}>
        <NoticeAndPopularSection />
        <NoticeSection />
      </div>

      <BannerSlider intervalMs={5000} />
      <Footer />
    </div>
  );
}
