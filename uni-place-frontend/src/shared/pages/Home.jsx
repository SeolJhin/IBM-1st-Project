import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../../app/layouts/components/Header';
import Footer from '../../app/layouts/components/Footer';
import { propertyApi } from '../../features/property/api/propertyApi';
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
            onClick={() => navigate('/rooms')}
          >
            방 둘러보기
          </button>
        </div>
      </div>
    </section>
  );
}

function EventCard({ event, isHovered, onHover, onLeave }) {
  return (
    <div
      className={styles.eventCardWrap}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <div
        className={`${styles.eventCard} ${isHovered ? styles.eventCardHover : ''}`}
      >
        <div className={styles.eventCardBody}>
          <h3 className={styles.eventTitle}>{event.title}</h3>
          <p className={styles.eventMeta}>{event.time}</p>
          <p className={styles.eventMeta}>{event.location}</p>
          <div
            className={`${styles.eventActionArea} ${isHovered ? styles.eventActionVisible : ''}`}
          >
            <button className={styles.eventActionBtn} type="button">
              자세히 보기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EventSection() {
  const [hoveredCard, setHoveredCard] = useState(null);

  const events = {
    left: {
      date: '2026.03.12(목)',
      items: [
        {
          title: '입주 설명회 & 하우스 투어',
          time: '08:00 ~ 17:10',
          location: '강남 코리빙 라운지',
        },
        {
          title: '공용공간 이용정책 안내',
          time: '09:00 ~ 11:30',
          location: '강남 코리빙 라운지',
        },
        {
          title: '신규 입주민 스타트 세션',
          time: '10:00 ~ 16:00',
          location: '강남 코리빙 라운지',
        },
      ],
    },
    right: {
      date: '2026.03.13(금)',
      items: [
        {
          title: '커뮤니티 매니저 Q&A',
          time: '08:00 ~ 17:10',
          location: '성수 코리빙 허브',
        },
        {
          title: '룸메이트 매칭 오리엔테이션',
          time: '09:00 ~ 11:30',
          location: '성수 코리빙 허브',
        },
        {
          title: '입주 가이드 토크',
          time: '10:00 ~ 16:00',
          location: '성수 코리빙 허브',
        },
      ],
    },
  };

  return (
    <section className={styles.sectionSoft}>
      <div className={styles.contentWide}>
        <div className={styles.sectionHeadCenter}>
          <p className={styles.sectionEyebrow}>2026 UNI-PLACE 프로그램 안내</p>
          <h2 className={styles.sectionTitle}>
            현재 진행 중인 공유주거 프로그램
          </h2>
          <button className={styles.primaryPill} type="button">
            자세히 보기
          </button>
        </div>

        <div className={styles.eventGrid}>
          <div className={styles.eventCol}>
            <div className={`${styles.eventDate} ${styles.eventDateLeft}`}>
              {events.left.date}
            </div>
            <div className={styles.eventList}>
              {events.left.items.map((event, idx) => (
                <EventCard
                  key={`left-${idx}`}
                  event={event}
                  isHovered={hoveredCard === `left-${idx}`}
                  onHover={() => setHoveredCard(`left-${idx}`)}
                  onLeave={() => setHoveredCard(null)}
                />
              ))}
            </div>
          </div>

          <div className={styles.eventDivider} aria-hidden="true" />

          <div className={styles.eventCol}>
            <div className={`${styles.eventDate} ${styles.eventDateRight}`}>
              {events.right.date}
            </div>
            <div className={styles.eventList}>
              {events.right.items.map((event, idx) => (
                <EventCard
                  key={`right-${idx}`}
                  event={event}
                  isHovered={hoveredCard === `right-${idx}`}
                  onHover={() => setHoveredCard(`right-${idx}`)}
                  onLeave={() => setHoveredCard(null)}
                />
              ))}
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

const lineupItems = [
  {
    id: 1,
    tag: '추천 하우스 1',
    image:
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=500&fit=crop',
    name: '강남역 10분 프리미엄 코리빙',
  },
  {
    id: 2,
    tag: '추천 하우스 2',
    image:
      'https://images.unsplash.com/photo-1560185008-b033106af5c3?w=400&h=500&fit=crop',
    name: '여성 전용 하우스',
  },
  {
    id: 3,
    tag: '추천 하우스 3',
    image:
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=500&fit=crop',
    name: '성수 반려동물 가능 하우스',
  },
  {
    id: 4,
    tag: '추천',
    image:
      'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=400&h=500&fit=crop',
    name: '장기 거주 특화 하우스',
  },
  {
    id: 5,
    tag: '인기',
    image:
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400&h=500&fit=crop',
    name: '합정 커뮤니티 하우스',
  },
  {
    id: 6,
    tag: '신규',
    image:
      'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=400&h=500&fit=crop',
    name: '광화문 비즈니스 하우스',
  },
];

function HouseLineup() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const visibleCount = 4;
  const maxIndex = lineupItems.length - visibleCount;

  const handleNext = () => setCurrentIndex((p) => (p >= maxIndex ? 0 : p + 1));
  const handlePrev = () => setCurrentIndex((p) => (p <= 0 ? maxIndex : p - 1));

  return (
    <section className={styles.sectionWhite}>
      <div className={styles.contentWide}>
        <div className={styles.sectionHeadCenter}>
          <p className={styles.sectionEyebrow}>UNI-PLACE LINEUP</p>
          <h2 className={styles.sectionTitle}>이달의 PICK</h2>
          <button className={styles.primaryPill} type="button">
            전체 보기
          </button>
        </div>

        <div className={styles.lineupFrame}>
          <div
            className={styles.lineupTrack}
            style={{ transform: `translateX(-${currentIndex * 25}%)` }}
          >
            {lineupItems.map((item) => (
              <article key={item.id} className={styles.lineupCard}>
                <span className={styles.lineupTag}>{item.tag}</span>
                <div className={styles.lineupImageWrap}>
                  <img
                    src={item.image}
                    alt={item.name}
                    className={styles.lineupImage}
                    draggable={false}
                  />
                </div>
                <p className={styles.lineupName}>{item.name}</p>
              </article>
            ))}
          </div>

          <button
            className={`${styles.lineBtn} ${styles.lineBtnLeft}`}
            onClick={handlePrev}
            type="button"
          >
            &#8249;
          </button>
          <button
            className={`${styles.lineBtn} ${styles.lineBtnRight}`}
            onClick={handleNext}
            type="button"
          >
            &#8250;
          </button>
        </div>
      </div>
    </section>
  );
}

function NoticeSection() {
  const navigate = useNavigate();

  const notices = [
    '신규 하우스 오픈 일정 안내',
    '3월 입주 프로모션 사전 공지',
    '커뮤니티 라운지 운영시간 변경',
    '서비스 점검 및 배포 안내',
  ];

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
            {notices.map((t, i) => (
              <li
                key={i}
                className={styles.nfNoticeItem}
                onClick={() => navigate('/support/notice')}
              >
                {t}
              </li>
            ))}
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
            <h3 className={styles.livingTitle}>커뮤니티 프로그램</h3>
            <p className={styles.livingDesc}>
              입주민 네트워킹, 취미 모임, 지역 이벤트 정보를 확인해보세요.
            </p>
            <button type="button" className={styles.livingBtn}>
              프로그램 보기
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

  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const updateProgress = () => {
      if (!video.duration) return;
      setProgress((video.currentTime / video.duration) * 100);
    };

    const handleEnded = () => {
      setFade(false);
      setProgress(0);

      setTimeout(() => {
        setCurrentVideoIndex((prev) =>
          prev === heroVideos.length - 1 ? 0 : prev + 1
        );
        setFade(true);
      }, 450);
    };

    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', updateProgress);
      video.removeEventListener('ended', handleEnded);
    };
  }, [currentVideoIndex, heroVideos.length]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className={styles.page}>
      <Header />

      <section className={styles.heroSection}>
        <video
          ref={videoRef}
          key={currentVideoIndex}
          src={heroVideos[currentVideoIndex]}
          autoPlay
          muted
          playsInline
          className={`${styles.heroVideo} ${fade ? styles.heroVideoVisible : styles.heroVideoHidden}`}
        />
        <div className={styles.heroOverlay} />

        <div className={styles.heroContentWrap}>
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

        <div className={styles.heroControlWrap}>
          <div className={styles.heroProgressRail}>
            <div
              className={styles.heroProgressFill}
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className={styles.heroControlRow}>
            <span>
              {String(currentVideoIndex + 1).padStart(2, '0')} /{' '}
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
      <HouseLineup />
      <EventSection />
      <LivingTypeSection />

      <section className={styles.recoSection}>
        <div className={styles.contentWide}>
          <h2 className={styles.recoHeading}>
            <span>당신이</span> 좋아할 만한 추천 하우스
          </h2>
          <div className={styles.recoBanner}>
            취향과 조건에 맞는 주거 공간을 추천해드립니다.
          </div>
          <RecommendCarousel />
        </div>
      </section>

      <NoticeSection />

      <Footer />
    </div>
  );
}
