import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../../app/layouts/components/Header';
import Footer from '../../app/layouts/components/Footer';
import BannerSlider from '../components/BannerSlider/BannerSlider';
import { propertyApi } from '../../features/property/api/propertyApi';
import { noticeApi } from '../../app/http/noticeApi';
import { communityApi } from '../../features/community/api/communityApi';
import { AiTop3Section } from './AiTop3Section';
import styles from './Home.module.css';

function IntroActionSection() {
  const navigate = useNavigate();

  return (
    <section className={styles.introSection}>
      <div className={styles.contentWide}>
        <div className={styles.introCard}>
          <p className={styles.introKicker}>UNI-PLACE</p>
          <h2 className={styles.introTitle}>
            공간을 넘어,
            <br />
            삶을 연결하는 주거 플랫폼
          </h2>
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

function NoticeAndPopularSection() {
  const navigate = useNavigate();
  const [notices, setNotices] = useState([]);
  const [popular, setPopular] = useState([]);
  const [noticeLoading, setNoticeLoading] = useState(true);
  const [popularLoading, setPopularLoading] = useState(true);

  useEffect(() => {
    // 중요 공지 최신순 3개
    noticeApi
      .getList({ page: 1, size: 3, sort: 'noticeId,desc', importance: 'Y' })
      .then((res) => {
        // axios: res.data = ApiResponse { success, data: PageResponse }
        // PageResponse: { content, ... }
        const content =
          res?.data?.data?.content ?? res?.data?.content ?? res?.content ?? [];
        setNotices(content.slice(0, 3));
      })
      .catch(() => setNotices([]))
      .finally(() => setNoticeLoading(false));

    // 인기 게시글: likeCount 내림차순 상위 3개
    communityApi
      .getBoards({ page: 1, size: 20, auth: false })
      .then((res) => {
        const content = res?.content ?? [];
        const sorted = [...content].sort(
          (a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0)
        );
        setPopular(sorted.slice(0, 3));
      })
      .catch(() => setPopular([]))
      .finally(() => setPopularLoading(false));
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return String(dateStr).slice(0, 10).replace(/-/g, '.');
  };

  return (
    <section className={styles.sectionSoft}>
      <div className={styles.contentWide}>
        <div className={styles.sectionHeadCenter}>
          <p className={styles.sectionEyebrow}>UNI-PLACE 커뮤니티</p>
          <h2 className={styles.sectionTitle}>공지사항 &amp; 인기 게시글</h2>
        </div>

        <div className={styles.eventGrid}>
          {/* ── 왼쪽: 중요 공지 최신순 3개 ── */}
          {/* ── 왼쪽: 중요 공지 최신순 3개 ── */}
          <div className={styles.eventCol}>
            <div className={`${styles.eventDate} ${styles.eventDateLeft}`}>
              📢 중요 공지사항
            </div>
            <div className={styles.eventList}>
              {[0, 1, 2].map((i) => {
                const n = notices[i];
                if (noticeLoading) {
                  return (
                    <div
                      key={i}
                      className={styles.eventCard}
                      style={{ opacity: 0.35 }}
                    >
                      <div className={styles.noticeCardBody}>
                        <div
                          className={styles.skeletonBar}
                          style={{ width: '65%' }}
                        />
                        <div
                          className={styles.skeletonBar}
                          style={{ width: '35%', marginTop: 8 }}
                        />
                      </div>
                    </div>
                  );
                }
                if (!n) {
                  return (
                    <div
                      key={i}
                      className={`${styles.eventCard} ${styles.emptyCard}`}
                    >
                      <div className={styles.noticeCardBody}>
                        {i === 0 && (
                          <span className={styles.emptyMsg}>
                            등록된 중요 공지가 없습니다.
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }
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

          {/* ── 오른쪽: 인기 게시글 3개 ── */}
          <div className={styles.eventCol}>
            <div className={`${styles.eventDate} ${styles.eventDateRight}`}>
              🔥 인기 게시글
            </div>
            <div className={styles.eventList}>
              {[0, 1, 2].map((i) => {
                const b = popular[i];
                if (popularLoading) {
                  return (
                    <div
                      key={i}
                      className={styles.eventCard}
                      style={{ opacity: 0.35 }}
                    >
                      <div className={styles.popularCardBody}>
                        <div
                          className={styles.skeletonBar}
                          style={{ width: '55%' }}
                        />
                        <div
                          className={styles.skeletonBar}
                          style={{ width: '30%', marginTop: 8 }}
                        />
                      </div>
                    </div>
                  );
                }
                if (!b) {
                  return (
                    <div
                      key={i}
                      className={`${styles.eventCard} ${styles.emptyCard}`}
                    >
                      <div className={styles.popularCardBody}>
                        {i === 0 && (
                          <span className={styles.emptyMsg}>
                            등록된 게시글이 없습니다.
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }
                return (
                  <div
                    key={b.boardId}
                    className={`${styles.eventCard} ${styles.popularCard}`}
                    onClick={() => navigate(`/community/${b.boardId}`)}
                  >
                    <div className={styles.popularCardBody}>
                      <div className={styles.popularRank}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                      </div>
                      <div className={styles.popularContent}>
                        <p className={styles.popularTitle}>{b.boardTitle}</p>
                        <div className={styles.popularMeta}>
                          <span className={styles.popularLike}>
                            ❤️ {b.likeCount ?? 0}
                          </span>
                          <span className={styles.popularDot}>·</span>
                          <span>조회 {b.readCount ?? 0}</span>
                          <span className={styles.popularDot}>·</span>
                          <span className={styles.popularAuthor}>
                            {b.userId}
                          </span>
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

function RecommendCarousel() {
  const items = [
    {
      title: '강남역 10분 프리미엄 코리빙',
      desc: '프라이빗 룸과 라운지, 피트니스가 결합된 시그니처 하우스',
      tag: '서울시 강남구',
      img: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80',
    },
    {
      title: '여성 전용 하우스',
      desc: '보안 강화 출입 시스템과 조용한 스터디 라운지 제공',
      tag: '서울시 마포구',
      img: 'https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1200&q=80',
    },
    {
      title: '성수 반려동물 가능 하우스',
      desc: '산책 동선과 펫케어존이 갖춰진 코리빙 공간',
      tag: '서울시 성동구',
      img: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
    },
    {
      title: '장기거주 특화 하우스',
      desc: '장기 계약 입주자를 위한 업무/휴식 동선 최적화',
      tag: '서울시 송파구',
      img: 'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?auto=format&fit=crop&w=1200&q=80',
    },
  ];

  const cardWidth = 320;
  const gap = 24;
  const slideSize = cardWidth + gap;
  const extended = [...items, ...items, ...items];

  const [index, setIndex] = useState(items.length);
  const [transition, setTransition] = useState(true);

  const next = () => setIndex((p) => p + 1);
  const prev = () => setIndex((p) => p - 1);

  const handleTransitionEnd = () => {
    if (index >= items.length * 2) {
      setTransition(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIndex(items.length));
      });
      return;
    }

    if (index < items.length) {
      setTransition(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIndex(items.length * 2 - 1));
      });
    }
  };

  useEffect(() => {
    if (!transition) {
      const timer = requestAnimationFrame(() => {
        requestAnimationFrame(() => setTransition(true));
      });
      return () => cancelAnimationFrame(timer);
    }
    return undefined;
  }, [transition]);

  const realIndex = ((index % items.length) + items.length) % items.length;

  return (
    <div className={styles.recoWrap}>
      <div
        className={styles.recoTrack}
        style={{
          gap: `${gap}px`,
          transform: `translate3d(-${index * slideSize}px, 0, 0)`,
          transition: transition
            ? 'transform 500ms cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            : 'none',
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        {extended.map((item, i) => (
          <article key={i} className={styles.recoCard}>
            <img src={item.img} alt={item.title} className={styles.recoImage} />
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
          <div className={styles.recoIndex}>
            {realIndex + 1} / {items.length}
          </div>
          <div className={styles.recoProgressBar}>
            <div
              className={styles.recoProgressFill}
              style={{ width: `${((realIndex + 1) / items.length) * 100}%` }}
            />
          </div>
        </div>

        <div className={styles.recoNavWrap}>
          <button
            onClick={prev}
            className={styles.circleBtn}
            type="button"
            aria-label="prev"
          >
            &#8249;
          </button>
          <button
            onClick={next}
            className={styles.circleBtn}
            type="button"
            aria-label="next"
          >
            &#8250;
          </button>
        </div>
      </div>
    </div>
  );
}

function NoticeSection() {
  const navigate = useNavigate();
  const [notices, setNotices] = useState([]);

  useEffect(() => {
    noticeApi
      .getList({ page: 1, size: 5, sort: 'noticeId,desc' })
      .then((res) => {
        const content =
          res?.data?.data?.content ?? res?.data?.content ?? res?.content ?? [];
        setNotices(content.slice(0, 5));
      })
      .catch(() => setNotices([]));
  }, []);

  const faqs = [
    {
      id: 'FAQ01',
      q: '계약 기간은 어떻게 선택하나요?',
      a: '단기/중기/장기 옵션 중에서 선택할 수 있습니다.',
    },
    {
      id: 'FAQ02',
      q: '관리비에는 어떤 항목이 포함되나요?',
      a: '공용시설, 청소, 인터넷 항목이 기본 포함됩니다.',
    },
    {
      id: 'FAQ03',
      q: '반려동물 동반 입주가 가능한가요?',
      a: '반려동물 가능 하우스에서만 신청 가능합니다.',
    },
    {
      id: 'FAQ04',
      q: '입주 전 투어 예약은 필수인가요?',
      a: '온라인 상담 후 현장 투어 예약을 권장합니다.',
    },
  ];

  return (
    <section className={styles.noticeSection}>
      <div className={styles.nfWrap}>
        <article className={styles.nfNoticeCard}>
          <div className={styles.nfNoticeHeader}>
            <span className={styles.nfNoticeTag}>공지사항</span>
            <h3 className={styles.nfNoticeTitle}>미리안내</h3>
          </div>

          <ul className={styles.nfNoticeList}>
            {notices.length === 0 ? (
              <li className={styles.nfNoticeItem} style={{ opacity: 0.5 }}>
                등록된 공지가 없습니다.
              </li>
            ) : (
              notices.map((n) => (
                <li
                  key={n.noticeId}
                  className={styles.nfNoticeItem}
                  onClick={() => navigate(`/support/notice/${n.noticeId}`)}
                >
                  {n.noticeTitle}
                </li>
              ))
            )}
          </ul>

          <button
            type="button"
            className={styles.nfNoticeCta}
            onClick={() => navigate('/support/notice')}
          >
            <span>공지사항 바로가기</span>
            <span className={styles.nfArrow}>→</span>
          </button>
        </article>

        <article className={styles.nfFaqPanel}>
          <div className={styles.nfGrid}>
            {faqs.map((f) => (
              <article
                key={f.id}
                className={styles.nfFaqCard}
                onClick={() => navigate('/support/faq')}
              >
                <div className={styles.nfFaqId}>{f.id}</div>

                <div className={styles.nfFaqLine}>
                  <span className={styles.nfFaqLabel}>Q.</span>
                  <span className={styles.nfFaqText}>{f.q}</span>
                </div>

                <div className={styles.nfFaqLine}>
                  <span className={styles.nfFaqLabel}>A.</span>
                  <span className={styles.nfFaqText}>{f.a}</span>
                </div>
              </article>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}

function LivingTypeSection() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [roomType, setRoomType] = useState(
    () => searchParams.get('roomType') || ''
  );
  const [petAllowedYn, setPetAllowedYn] = useState(
    () => searchParams.get('petAllowedYn') || ''
  );
  const [sunDirection, setSunDirection] = useState(
    () => searchParams.get('sunDirection') || ''
  );
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRooms = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await propertyApi.getRoomsAll({
          page: 1,
          size: 6,
          sort: 'roomId',
          direct: 'DESC',
          roomType: roomType || undefined,
          petAllowedYn: petAllowedYn || undefined,
          sunDirection: sunDirection || undefined,
          roomSt: 'available',
        });
        setRooms(data?.content || []);
      } catch (e) {
        setError(e?.message || '방 목록을 불러오지 못했습니다.');
        setRooms([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, [roomType, petAllowedYn, sunDirection]);

  useEffect(() => {
    const nextParams = {};
    if (roomType) nextParams.roomType = roomType;
    if (petAllowedYn) nextParams.petAllowedYn = petAllowedYn;
    if (sunDirection) nextParams.sunDirection = sunDirection;
    setSearchParams(nextParams, { replace: true });
  }, [roomType, petAllowedYn, sunDirection, setSearchParams]);

  const roomTypeOptions = [
    { label: '전체', value: '' },
    { label: '원룸형', value: 'one_room' },
    { label: '투룸형', value: 'two_room' },
    { label: '쓰리룸형', value: 'three_room' },
    { label: '복층', value: 'loft' },
    { label: '쉐어', value: 'share' },
  ];

  const petOptions = [
    { label: '반려동물 무관', value: '' },
    { label: '반려동물 가능', value: 'Y' },
    { label: '반려동물 불가', value: 'N' },
  ];

  const sunOptions = [
    { label: '채광 방향 무관', value: '' },
    { label: '남향', value: 's' },
    { label: '동향', value: 'e' },
    { label: '서향', value: 'w' },
    { label: '북향', value: 'n' },
  ];

  const roomTypeLabelMap = {
    one_room: '원룸형',
    two_room: '투룸형',
    three_room: '쓰리룸형',
    loft: '복층',
    share: '쉐어',
  };

  const sunDirectionLabelMap = {
    n: '북향',
    s: '남향',
    e: '동향',
    w: '서향',
  };

  return (
    <section className={styles.livingSection}>
      <div className={styles.contentWide}>
        <div className={styles.livingGrid}>
          <article className={styles.livingPanel}>
            <h3 className={styles.livingTitle}>최근 소식</h3>
            <p className={styles.livingDesc}>
              신규 하우스 오픈, 서비스 업데이트 등 UNI-PLACE의 새로운 소식을
              확인해보세요.
            </p>
            <button
              type="button"
              className={styles.livingBtn}
              onClick={() => navigate('/news')}
            >
              뉴스 보기
            </button>
          </article>

          <article className={styles.livingPanel}>
            <h3 className={styles.livingTitle}>입주 가이드</h3>
            <p className={styles.livingDesc}>
              계약부터 입주까지 필요한 절차를 단계별로 안내합니다.
            </p>
            <button type="button" className={styles.livingBtnAlt}>
              가이드 보기
            </button>
          </article>
        </div>

        <div className={styles.typeWrap}>
          <h3 className={styles.typeTitle}>주거유형 살피기</h3>

          <div className={styles.typeList}>
            {roomTypeOptions.map((option) => (
              <button
                key={option.value || 'all'}
                type="button"
                className={`${styles.typeChip} ${
                  roomType === option.value ? styles.typeChipActive : ''
                }`}
                onClick={() => setRoomType(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className={styles.typeSelectRow}>
            <select
              className={styles.typeSelect}
              value={petAllowedYn}
              onChange={(e) => setPetAllowedYn(e.target.value)}
            >
              {petOptions.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              className={styles.typeSelect}
              value={sunDirection}
              onChange={(e) => setSunDirection(e.target.value)}
            >
              {sunOptions.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <p className={styles.typeHint}>
              조건에 맞는 방을 불러오는 중입니다...
            </p>
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
                    <p className={styles.quickRoomName}>
                      {room.buildingNm} {room.roomNo}호
                    </p>
                    <p className={styles.quickRoomMeta}>
                      {roomTypeLabelMap[room.roomType] || '-'} |{' '}
                      {sunDirectionLabelMap[room.sunDirection] || '-'} |{' '}
                      {room.petAllowedYn === 'Y' ? '반려 가능' : '반려 불가'}
                    </p>
                    <p className={styles.quickRoomPrice}>
                      월 {Number(room.rentPrice || 0).toLocaleString()}원
                    </p>
                  </button>
                ))}
              </div>
              {!rooms.length && (
                <p className={styles.typeHint}>조건에 맞는 방이 없습니다.</p>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const heroVideos = [
    'videos/city.mp4',
    'videos/building.mp4',
    'videos/room.mp4',
  ];

  // videos[0], videos[1] 두 슬롯을 번갈아 사용 — 항상 겹쳐있음
  const [slotA, setSlotA] = useState({ src: heroVideos[0], visible: true });
  const [slotB, setSlotB] = useState({ src: heroVideos[1], visible: false });
  const [activeSlot, setActiveSlot] = useState('A'); // 현재 재생 중인 슬롯
  const [vidIndex, setVidIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const refA = useRef(null);
  const refB = useRef(null);

  const activeRef = activeSlot === 'A' ? refA : refB;
  const standbyRef = activeSlot === 'A' ? refB : refA;

  // 재생 중인 영상의 진행률 업데이트
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

      // 대기 슬롯에 다음 영상 세팅 후 페이드인
      if (activeSlot === 'A') {
        setSlotB({ src: nextSrc, visible: true });
        if (standbyRef.current) {
          standbyRef.current.load();
          standbyRef.current.play().catch(() => {});
        }
        setSlotA((prev) => ({ ...prev, visible: false }));
        setActiveSlot('B');
      } else {
        setSlotA({ src: nextSrc, visible: true });
        if (standbyRef.current) {
          standbyRef.current.load();
          standbyRef.current.play().catch(() => {});
        }
        setSlotB((prev) => ({ ...prev, visible: false }));
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
    if (isPlaying) video.pause();
    else video.play();
    setIsPlaying(!isPlaying);
  };

  return (
    <div className={styles.page}>
      <Header />

      <section className={styles.heroSection}>
        {/* 슬롯 A — 항상 마운트, opacity로 페이드 */}
        <video
          ref={refA}
          src={slotA.src}
          autoPlay={activeSlot === 'A'}
          muted
          playsInline
          className={styles.heroVideo}
          style={{
            opacity: slotA.visible ? 1 : 0,
            transition: 'opacity 1200ms ease',
            zIndex: slotA.visible ? 2 : 1,
          }}
        />
        {/* 슬롯 B — 항상 마운트, opacity로 페이드 */}
        <video
          ref={refB}
          src={slotB.src}
          autoPlay={activeSlot === 'B'}
          muted
          playsInline
          className={styles.heroVideo}
          style={{
            opacity: slotB.visible ? 1 : 0,
            transition: 'opacity 1200ms ease',
            zIndex: slotB.visible ? 2 : 1,
          }}
        />
        <div className={styles.heroOverlay} style={{ zIndex: 3 }} />

        <div className={styles.heroContentWrap} style={{ zIndex: 4 }}>
          <div className={styles.heroInner}>
            <h1 className={styles.heroMainTitle}>
              생활하는 공유주거를
              <br />한 번에 찾는 방법
            </h1>
            <p className={styles.heroSubTitle}>
              지역과 예산, 라이프스타일에 맞춘 코리빙 탐색 UNI-PLACE
            </p>
          </div>
        </div>

        <div className={styles.heroControlWrap} style={{ zIndex: 4 }}>
          <div className={styles.heroProgressRail}>
            <div
              className={styles.heroProgressFill}
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className={styles.heroControlRow}>
            <span>
              {String(vidIndex + 1).padStart(2, '0')} /{' '}
              {String(heroVideos.length).padStart(2, '0')}
            </span>
            <button
              type="button"
              onClick={togglePlay}
              className={styles.heroPlayBtn}
            >
              {isPlaying ? '일시정지' : '재생'}
            </button>
          </div>
        </div>
      </section>

      <IntroActionSection />

      <AiTop3Section />

      <NoticeAndPopularSection />

      <LivingTypeSection />

      <RecommendCarousel />

      <BannerSlider intervalMs={5000} />

      <NoticeSection />

      <Footer />
    </div>
  );
}
