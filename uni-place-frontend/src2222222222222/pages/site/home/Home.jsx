import { useState, useRef, useEffect } from "react";

function EventSection() {
  const [hoveredCard, setHoveredCard] = useState(null);

  const events = {
    left: {
      date: "2026.02.28(수)",
      dateColor: "bg-gradient-to-r from-blue-50 to-blue-100/50",
      dateTextColor: "text-blue-700",
      items: [
        {
          title: "댕댕이 플레이 그라운드",
          time: "08:00 ~ 17:10",
          location: "올림픽 공원",
        },
        {
          title: "반려건 라이프 페어",
          time: "09:00 ~ 11:30",
          location: "올림픽 공원",
        },
        {
          title: "댕댕이 웰니스 데이",
          time: "10:00 ~ 16:00",
          location: "올림픽 공원",
        },
      ],
    },
    right: {
      date: "2026.02.28(수)",
      dateColor: "bg-gradient-to-r from-emerald-50 to-teal-100/50",
      dateTextColor: "text-teal-700",
      items: [
        {
          title: "댕댕이 웰니스 데이",
          time: "08:00 ~ 17:10",
          location: "올림픽 공원",
        },
        {
          title: "펫 비헤이비어 포럼",
          time: "09:00 ~ 11:30",
          location: "올림픽 공원",
        },
        {
          title: "반려견 교감 클래스",
          time: "10:00 ~ 16:00",
          location: "올림픽 공원",
        },
      ],
    },
  };

  return (
    <section className="w-full bg-gradient-to-b from-gray-50 to-white py-16 px-6">
      <div className="max-w-[1400px] mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-[14px] font-semibold text-gray-500 uppercase mb-1">
            2026 애견 행사 진행 안내
          </p>

          <h2 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
            현재 진행 중인 반려견 행사
          </h2>

          <button className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-2 rounded-full transition-all duration-300">
            자세히 보기
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 relative">
          {/* Divider */}
          <div className="hidden lg:block absolute left-1/2 top-6 bottom-0 -translate-x-1/2">
            <div
              className="w-px h-full"
              style={{
                backgroundImage:
                  "radial-gradient(circle, #d1d5db 1px, transparent 1px)",
                backgroundSize: "1px 5px",
                backgroundPosition: "center",
              }}
            />
          </div>

          {/* Left */}
          <div className="space-y-4">
            <div
              className={`${events.left.dateColor} ${events.left.dateTextColor} text-center py-3 rounded-xl font-semibold text-sm`}
            >
              {events.left.date}
            </div>

            <div className="space-y-4">
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

          {/* Right */}
          <div className="space-y-4">
            <div
              className={`${events.right.dateColor} ${events.right.dateTextColor} text-center py-3 rounded-xl font-semibold text-sm`}
            >
              {events.right.date}
            </div>

            <div className="space-y-4">
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

function EventCard({ event, isHovered, onHover, onLeave }) {
  return (
    <div
      className="cursor-pointer"
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <div
        className={`rounded-xl p-5 border border-gray-200 transition-all duration-300
        ${
          isHovered
            ? "bg-gray-100 shadow-[0_6px_18px_rgba(0,0,0,0.08)] border-gray-300"
            : "bg-white shadow-[0_2px_6px_rgba(0,0,0,0.04)]"
        }`}
      >
        <div className="text-center">
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            {event.title}
          </h3>

          <p className="text-[13px] text-gray-600 leading-tight">
            {event.time}
          </p>
          <p className="text-[13px] text-gray-600 leading-tight">
            {event.location}
          </p>

          {/* 🔥 버튼 영역 */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-out
  ${isHovered ? "max-h-16 mt-3" : "max-h-0 mt-0"}`}
          >
            <button className="bg-blue-600 text-white text-xs font-semibold px-4 py-1.5 transition-all duration-300 rounded-full">
              자세히 보기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecommendCarousel() {
  const items = [
    {
      title: "제목제목제목제목",
      desc: "여기다가 덧불일 내용을 쓰세요 좋게 말할때",
      tag: "서울시 강남구",
      img: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80",
    },
    {
      title: "제목제목제목제목",
      desc: "여기다가 덧불일 내용을 쓰세요 좋게 말할때",
      tag: "서울시 강남구",
      img: "https://images.unsplash.com/photo-1533106418989-88406c7cc8ca?auto=format&fit=crop&w=1200&q=80",
    },
    {
      title: "제목제목제목제목",
      desc: "여기다가 덧불일 내용을 쓰세요 좋게 말할때",
      tag: "서울시 강남구",
      img: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80",
    },
    {
      title: "제목제목제목제목",
      desc: "여기다가 덧불일 내용을 쓰세요 좋게 말할때",
      tag: "서울시 강남구",
      img: "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=1200&q=80",
    },
  ];

  const visibleCount = 4;
  const cardWidth = 320;
  const gap = 24;
  const slideSize = cardWidth + gap;

  // Clone entire items array on both sides for seamless infinite scroll
  const extended = [...items, ...items, ...items];

  const [index, setIndex] = useState(items.length);
  const [transition, setTransition] = useState(true);

  const next = () => setIndex((p) => p + 1);
  const prev = () => setIndex((p) => p - 1);

  const handleTransitionEnd = () => {
    // If we've scrolled past the end of the second set, snap back to the first set
    if (index >= items.length * 2) {
      setTransition(false);
      // Use double rAF for smoother reset
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIndex(items.length);
        });
      });
      return;
    }

    // If we've scrolled before the start of the second set, snap to the end of second set
    if (index < items.length) {
      setTransition(false);
      // Use double rAF for smoother reset
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIndex(items.length * 2 - 1);
        });
      });
      return;
    }
  };

  useEffect(() => {
    if (!transition) {
      // Re-enable transition after index reset
      const timer = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTransition(true);
        });
      });
      return () => cancelAnimationFrame(timer);
    }
  }, [transition]);

  const realIndex = ((index % items.length) + items.length) % items.length;

  return (
    <div className="relative overflow-hidden w-full">
      <div
        className="flex"
        style={{
          gap: `${gap}px`,
          transform: `translate3d(-${index * slideSize}px, 0, 0)`,
          transition: transition
            ? "transform 500ms cubic-bezier(0.25, 0.46, 0.45, 0.94)"
            : "none",
          willChange: "transform",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
          perspective: 1000,
          WebkitPerspective: 1000,
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        {extended.map((item, i) => (
          <div key={i} className="w-[320px] shrink-0">
            <img
              src={item.img}
              alt=""
              className="h-[220px] w-full object-cover rounded-xl"
            />
            <div className="mt-4">
              <div className="text-lg font-semibold">{item.title}</div>
              <div className="text-sm text-gray-500 mt-1">{item.desc}</div>
              <div className="inline-block mt-3 text-xs bg-gray-200 px-3 py-1 rounded-md">
                {item.tag}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 하단 UI */}
      <div className="flex items-center justify-between mt-10">
        <div className="flex items-center gap-4">
          <div className="text-sm font-semibold bg-black text-white px-3 py-1 rounded-full">
            {realIndex + 1} / {items.length}
          </div>

          <div className="w-40 h-[4px] bg-gray-300 rounded-full overflow-hidden">
            <div
              className="h-full bg-black transition-all duration-500"
              style={{
                width: `${((realIndex + 1) / items.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex gap-4">
          <button
            onClick={prev}
            className="group w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
          >
            <svg
              className="w-5 h-5 text-gray-700 transition group-hover:text-black"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <button
            onClick={next}
            className="group w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
          >
            <svg
              className="w-5 h-5 text-gray-700 transition group-hover:text-black"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
/* */
// ================= SPEAKER LINEUP =================
const speakers = [
  {
    id: 1,
    tag: "기조연설",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&grayscale",
    name: "Speaker 1",
  },
  {
    id: 2,
    tag: "기조연설",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop&grayscale",
    name: "Speaker 2",
  },
  {
    id: 3,
    tag: "슈스등장",
    image:
      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=500&fit=crop&grayscale",
    name: "Dog 1",
  },
  {
    id: 4,
    tag: "슈스등장",
    image:
      "https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=500&fit=crop&grayscale",
    name: "Dog 2",
  },
  {
    id: 5,
    tag: "패널토론",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop&grayscale",
    name: "Speaker 3",
  },
  {
    id: 6,
    tag: "패널토론",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=500&fit=crop&grayscale",
    name: "Speaker 4",
  },
];

function SpeakerLineup() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const TOTAL_WIDTH = 1400;
  const VISIBLE_COUNT = 4;
  const GAP = 24;

  const CARD_WIDTH = (TOTAL_WIDTH - GAP * (VISIBLE_COUNT - 1)) / VISIBLE_COUNT;

  const slideWidth = CARD_WIDTH + GAP;
  const maxIndex = speakers.length - VISIBLE_COUNT;

  const handleNext = () => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  return (
    <div className="w-full bg-white py-16">
      <div className="max-w-[1400px] mx-auto px-4 font-sans">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-[14px] font-semibold text-gray-500 uppercase mb-1">
            2026 애견 행사 진행 안내
          </p>

          <h2 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
            현재 진행 중인 반려견 행사
          </h2>

          <button className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-2 rounded-full transition-all duration-300">
            자세히 보기
          </button>
        </div>

        {/* Carousel */}
        <div className="relative" style={{ width: TOTAL_WIDTH }}>
          {/* 슬라이드 영역 */}
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{
                gap: `${GAP}px`,
                transform: `translateX(-${currentIndex * slideWidth}px)`,
              }}
            >
              {speakers.map((speaker) => (
                <div
                  key={speaker.id}
                  style={{ width: CARD_WIDTH }}
                  className="shrink-0 flex flex-col"
                >
                  <span className="text-sm text-blue-600 font-semibold mb-2 pl-1">
                    {speaker.tag}
                  </span>

                  <div className="relative overflow-hidden rounded-xl aspect-[3/4] bg-gray-200">
                    <img
                      src={speaker.image}
                      alt={speaker.name}
                      className="w-full h-full object-cover grayscale"
                      draggable={false}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Left Button */}
          <button
            onClick={handlePrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-gray-300 shadow flex items-center justify-center hover:bg-gray-100 transition"
          >
            ‹
          </button>

          {/* Right Button */}
          <button
            onClick={handleNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-gray-300 shadow flex items-center justify-center hover:bg-gray-100 transition"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}

/* */

export default function Home() {
  const heroVideos = [
    "http://kgj.dothome.co.kr/pupoo/1.mov",
    "http://kgj.dothome.co.kr/pupoo/2.mov",
    "http://kgj.dothome.co.kr/pupoo/3.mp4",
  ];

  // ================= HERO VIDEO =================
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      if (!video.duration) return;
      setProgress((video.currentTime / video.duration) * 100);
    };

    const handleEnded = () => {
      setFade(false);
      setProgress(0);

      setTimeout(() => {
        setCurrentVideoIndex((prev) =>
          prev === heroVideos.length - 1 ? 0 : prev + 1,
        );
        setFade(true);
      }, 600);
    };

    video.addEventListener("timeupdate", updateProgress);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("timeupdate", updateProgress);
      video.removeEventListener("ended", handleEnded);
    };
  }, [currentVideoIndex]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    isPlaying ? video.pause() : video.play();
    setIsPlaying(!isPlaying);
  };

  return (
    <div>
      {/* HERO */}
      <section className="relative h-screen w-full overflow-hidden">
        <video
          ref={videoRef}
          key={currentVideoIndex}
          src={heroVideos[currentVideoIndex]}
          autoPlay
          muted
          playsInline
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            fade ? "opacity-100" : "opacity-0"
          }`}
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative h-full flex items-center justify-center">
          <div className="max-w-[1400px] w-full px-6 text-white">
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
              멍멍멍 왈왈왈왈 몰보냐
              <br />
              우하하 테스트
            </h1>
            <p className="mt-6 text-lg md:text-xl text-white/90">
              We Make Quality pupooooo.
            </p>
          </div>
        </div>

        {/* Progress + Controls */}
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-[300px]">
          <div className="relative h-[2px] bg-white/30">
            <div
              className="absolute left-0 top-0 h-full bg-white transition-[width] duration-200 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex justify-between items-center mt-3 text-white text-sm">
            <span>
              {String(currentVideoIndex + 1).padStart(2, "0")} /{" "}
              {String(heroVideos.length).padStart(2, "0")}
            </span>

            <button type="button" onClick={togglePlay}>
              {isPlaying ? "❚❚" : "▶"}
            </button>
          </div>
        </div>
      </section>{" "}
      {/* 끝 */}
      <SpeakerLineup />
      <EventSection />
      {/* RECOMMEND CAROUSEL */}
      <section className="bg-[#f4f5f7] py-24 overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-extrabold mb-8">
            <span className="text-blue-600">당신이</span> 좋아할 만한 추천 행사
          </h2>

          <div className="bg-[#e9eaee] rounded-xl px-6 py-4 text-sm text-gray-700 mb-12">
            ‘나의 성향에 따른 맞춤형 행사’가 추천되고 있습니다.
          </div>

          <RecommendCarousel />
        </div>
      </section>
      {/* NOTICE */}
      <section className="bg-black text-white py-24">
        <div className="max-w-[1400px] mx-auto px-6 grid md:grid-cols-2 gap-16">
          {["공지사항", "관련기사"].map((section, idx) => (
            <div key={idx}>
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-3xl font-extrabold">{section}</h3>
                <button
                  type="button"
                  className="text-sm text-white/70 hover:text-white"
                >
                  more +
                </button>
              </div>

              <div className="space-y-10">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="group cursor-pointer">
                    <div className="flex justify-between">
                      <div>
                        <div className="text-lg font-semibold group-hover:text-gray-300 transition">
                          샘플 제목 {i}
                        </div>
                        <div className="mt-3 text-sm text-white/60">
                          2026.02.12
                        </div>
                      </div>
                      <div className="text-3xl text-white/60 group-hover:text-white transition">
                        +
                      </div>
                    </div>
                    <div className="mt-6 border-b border-white/20" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
