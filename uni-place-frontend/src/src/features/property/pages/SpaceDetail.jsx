// features/property/pages/SpaceDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../../app/layouts/components/Header';
import Footer from '../../../app/layouts/components/Footer';
import { propertyApi } from '../api/propertyApi';
import { useAuth } from '../../user/hooks/useAuth';
import styles from './SpaceDetail.module.css';

function ImageGallery({ files }) {
  const [active, setActive] = useState(0);
  const images = (files || []).filter((f) => {
    const ext = (f.fileType || '').toLowerCase();
    return ['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext);
  });
  if (!images.length) {
    return (
      <div className={styles.galleryPlaceholder}>
        <span>🛋️</span>
        <p>등록된 사진이 없습니다</p>
      </div>
    );
  }
  return (
    <div className={styles.gallery}>
      <div className={styles.galleryMain}>
        <img
          src={images[active]?.viewUrl || images[active]?.fileUrl}
          alt={`공용공간 사진 ${active + 1}`}
        />
      </div>
      {images.length > 1 && (
        <div className={styles.galleryThumbs}>
          {images.map((img, i) => (
            <button
              key={i}
              className={`${styles.galleryThumb} ${i === active ? styles.galleryThumbActive : ''}`}
              onClick={() => setActive(i)}
              type="button"
            >
              <img src={img.viewUrl || img.fileUrl} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SpaceDetail() {
  const { spaceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [space, setSpace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 같은 건물 다른 공용공간
  const [otherSpaces, setOtherSpaces] = useState([]);

  useEffect(() => {
    if (!spaceId) return;
    setLoading(true);
    propertyApi
      .getSpaceDetail(Number(spaceId))
      .then((data) => setSpace(data))
      .catch((err) =>
        setError(err?.message || '공용공간 정보를 불러올 수 없습니다.')
      )
      .finally(() => setLoading(false));
  }, [spaceId]);

  // 같은 건물 공용공간 조회
  useEffect(() => {
    if (!space?.buildingId) return;
    propertyApi
      .getSpaces(space.buildingId, { page: 1, size: 6 })
      .then((data) => {
        const others = (data?.content ?? []).filter(
          (s) => s.spaceId !== Number(spaceId)
        );
        setOtherSpaces(others.slice(0, 4));
      })
      .catch(() => setOtherSpaces([]));
  }, [space?.buildingId, spaceId]);

  // 공용공간 예약 버튼 → 로그인 필요
  const handleReservation = () => {
    if (!user) {
      navigate('/login', { state: { from: `/spaces/${spaceId}` } });
      return;
    }
    // 공용공간 예약 페이지로 이동, spaceId/buildingId 자동 전달
    navigate(
      `/reservations/space/create?spaceId=${spaceId}&buildingId=${space?.buildingId || ''}`
    );
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <Header />
        <div className={styles.centerBox}>
          <div className={styles.spinner} />
          <p>공용공간 정보를 불러오는 중...</p>
        </div>
        <Footer />
      </div>
    );
  }
  if (error || !space) {
    return (
      <div className={styles.page}>
        <Header />
        <div className={styles.centerBox}>
          <p>⚠️ {error || '공용공간 정보를 찾을 수 없습니다.'}</p>
          <button onClick={() => navigate('/spaces')}>목록으로</button>
        </div>
        <Footer />
      </div>
    );
  }

  const options = space.spaceOptions
    ? space.spaceOptions
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean)
    : [];

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
          <button className={styles.bcBtn} onClick={() => navigate('/spaces')}>
            공용공간
          </button>
          <span className={styles.bcSep}>›</span>
          {space.buildingNm && (
            <>
              <button
                className={styles.bcBtn}
                onClick={() =>
                  navigate(
                    `/spaces?buildingId=${space.buildingId}&buildingNm=${encodeURIComponent(space.buildingNm)}`
                  )
                }
              >
                {space.buildingNm}
              </button>
              <span className={styles.bcSep}>›</span>
            </>
          )}
          <span className={styles.bcCurrent}>{space.spaceNm}</span>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.topGrid}>
          <ImageGallery files={space.files} />

          <div className={styles.infoPanel}>
            {/* 건물 링크 */}
            <button
              className={styles.buildingLink}
              onClick={() => navigate(`/buildings/${space.buildingId}`)}
              type="button"
            >
              🏢 {space.buildingNm}
              <span className={styles.buildingLinkArrow}>건물 상세 보기 →</span>
            </button>

            <p className={styles.infoKicker}>COMMON SPACE</p>
            <h1 className={styles.spaceNm}>{space.spaceNm}</h1>

            {/* 기본 정보 */}
            <div className={styles.specGrid}>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>위치</span>
                <span className={styles.specValue}>{space.spaceFloor}층</span>
              </div>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>최대 인원</span>
                <span className={styles.specValue}>
                  {space.spaceCapacity}명
                </span>
              </div>
              {space.buildingAddr && (
                <div className={styles.specItem} style={{ gridColumn: '1/-1' }}>
                  <span className={styles.specLabel}>주소</span>
                  <span className={styles.specValue}>{space.buildingAddr}</span>
                </div>
              )}
            </div>

            {/* 옵션/시설 */}
            {options.length > 0 && (
              <div className={styles.optionBlock}>
                <p className={styles.optionTitle}>시설 · 옵션</p>
                <div className={styles.optionTags}>
                  {options.map((o) => (
                    <span key={o} className={styles.optionTag}>
                      {o}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 설명 */}
            {space.spaceDesc && (
              <div className={styles.descBlock}>
                <p className={styles.descText}>{space.spaceDesc}</p>
              </div>
            )}

            {/* ── 공용공간 예약 버튼 ── */}
            <button
              className={styles.reservationBtn}
              onClick={handleReservation}
              type="button"
            >
              📅 공용공간 예약하기
            </button>
            {!user && (
              <p className={styles.reservationHint}>
                로그인 후 예약할 수 있습니다
              </p>
            )}
          </div>
        </div>

        {/* ── 같은 건물 다른 공용공간 ── */}
        {otherSpaces.length > 0 && (
          <section className={styles.otherSpaces}>
            <div className={styles.otherSpacesHeader}>
              <h2 className={styles.sectionTitle}>같은 건물의 다른 공용공간</h2>
              <button
                className={styles.otherSeeAll}
                onClick={() =>
                  navigate(
                    `/spaces?buildingId=${space.buildingId}&buildingNm=${encodeURIComponent(space.buildingNm)}`
                  )
                }
                type="button"
              >
                전체 보기 →
              </button>
            </div>
            <div className={styles.otherGrid}>
              {otherSpaces.map((s) => {
                const opts = s.spaceOptions
                  ? s.spaceOptions
                      .split(',')
                      .map((o) => o.trim())
                      .filter(Boolean)
                  : [];
                return (
                  <article
                    key={s.spaceId}
                    className={styles.otherCard}
                    onClick={() => navigate(`/spaces/${s.spaceId}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && navigate(`/spaces/${s.spaceId}`)
                    }
                  >
                    <div className={styles.otherCardImg}>
                      {s.thumbnailUrl ? (
                        <img src={s.thumbnailUrl} alt={s.spaceNm} />
                      ) : (
                        <div className={styles.otherCardImgPh}>🛋️</div>
                      )}
                    </div>
                    <div className={styles.otherCardBody}>
                      <p className={styles.otherSpaceNm}>{s.spaceNm}</p>
                      <p className={styles.otherSpaceMeta}>
                        {s.spaceFloor}층 · 최대 {s.spaceCapacity}명
                      </p>
                      {opts.length > 0 && (
                        <div className={styles.otherTags}>
                          {opts.slice(0, 2).map((o) => (
                            <span key={o} className={styles.otherTag}>
                              {o}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>

      <Footer />
    </div>
  );
}
