// features/property/pages/SpaceDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../../app/layouts/components/Header';
import Footer from '../../../app/layouts/components/Footer';
import { propertyApi } from '../api/propertyApi';
import { useAuth } from '../../user/hooks/useAuth';
import { contractApi } from '../../contract/api/contractApi';
import styles from './SpaceDetail.module.css';
import { toApiImageUrl } from '../../../shared/utils/imageUrl';
import ImageGallery from '../../file/components/ImageGallery';

export default function SpaceDetail() {
  const { spaceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [findMenuOpen, setFindMenuOpen] = useState(false);
  const [permError, setPermError] = useState('');

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

  useEffect(() => {
    if (!findMenuOpen) return;
    const close = () => setFindMenuOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [findMenuOpen]);

  // 공용공간 예약 버튼 → 로그인 필요 + TENANT 권한 필요
  const handleReservation = async () => {
    setPermError('');
    if (!user) {
      navigate('/login', { state: { from: `/spaces/${spaceId}` } });
      return;
    }
    if (String(user.userRole ?? '').toLowerCase() !== 'tenant') {
      setPermError('공용공간 예약은 현재 입주 중인 분만 이용하실 수 있어요.');
      return;
    }
    // 같은 건물 active 계약 여부 확인
    try {
      const contracts = await contractApi.myContracts();
      const hasActiveHere = (contracts ?? []).some(
        (c) =>
          String(c.contractStatus ?? '').toLowerCase() === 'active' &&
          c.buildingId === Number(space?.buildingId)
      );
      if (!hasActiveHere) {
        setPermError(
          '이 건물에 거주 중인 분만 예약하실 수 있어요. 현재 계약 중인 건물의 공용공간을 이용해주세요.'
        );
        return;
      }
    } catch {
      setPermError('계약 정보를 확인할 수 없습니다. 다시 시도해주세요.');
      return;
    }
    navigate(
      `/me?tab=space&sub=create&spaceId=${spaceId}&buildingId=${space?.buildingId}`
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
        <div
          className={styles.breadcrumbInner}
          style={{ justifyContent: 'space-between' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button className={styles.bcBtn} onClick={() => navigate('/')}>
              홈
            </button>
            <span className={styles.bcSep}>›</span>
            <button
              className={styles.bcBtn}
              onClick={() => navigate('/rooms', { state: { tab: 'spaces' } })}
            >
              공용공간
            </button>
            <span className={styles.bcSep}>›</span>
            {space.buildingNm && (
              <>
                <button
                  className={styles.bcBtn}
                  onClick={() => navigate(`/buildings/${space.buildingId}`)}
                >
                  {space.buildingNm}
                </button>
                <span className={styles.bcSep}>›</span>
              </>
            )}
            <span className={styles.bcCurrent}>{space.spaceNm}</span>
          </div>

          {/* 방 찾기 드롭다운 */}
          <div
            style={{ position: 'relative' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              style={{
                background: '#ba8037',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '7px 14px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              onClick={() => setFindMenuOpen((v) => !v)}
              type="button"
            >
              🔍 방 찾기&nbsp;
              <span>{findMenuOpen ? '▲' : '▼'}</span>
            </button>
            {findMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 6px)',
                  background: '#fff',
                  border: '1px solid #e8dfd0',
                  borderRadius: '10px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                  minWidth: '160px',
                  zIndex: 100,
                  overflow: 'hidden',
                }}
              >
                <button
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 16px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                  onClick={() => {
                    setFindMenuOpen(false);
                    navigate('/rooms');
                  }}
                >
                  🏠 방 목록 전체
                </button>
                <button
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 16px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                  onClick={() => {
                    setFindMenuOpen(false);
                    navigate('/rooms', { state: { tab: 'buildings' } });
                  }}
                >
                  🏢 건물 목록
                </button>
                <button
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 16px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                  onClick={() => {
                    setFindMenuOpen(false);
                    navigate('/rooms', { state: { tab: 'spaces' } });
                  }}
                >
                  🛋️ 공용공간 목록
                </button>
              </div>
            )}
          </div>
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
            <p className={styles.reservationHint}>
              {!user
                ? '로그인 후 예약할 수 있습니다'
                : '예약 후 해당 공간을 이용해보세요'}
            </p>
            {permError && (
              <div
                style={{
                  background: '#fff5f5',
                  border: '1px solid #feb2b2',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginTop: '10px',
                  color: '#c53030',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                🔒 {permError}
              </div>
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
                onClick={() => navigate('/rooms', { state: { tab: 'spaces' } })}
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
                        <img
                          src={toApiImageUrl(s.thumbnailUrl)}
                          alt={s.spaceNm}
                        />
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
