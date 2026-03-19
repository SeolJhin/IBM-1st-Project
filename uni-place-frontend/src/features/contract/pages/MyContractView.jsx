// features/contract/pages/MyContractView.jsx
// 마이페이지 > 마이룸 탭
// 내 계약서 목록 → 각 계약서마다 방 상세 정보 + 사진 표시 + 계약서 이미지 보기
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { contractApi } from '../api/contractApi';
import { propertyApi } from '../../property/api/propertyApi';
import { authApi } from '../../user/api/authApi';
import { getOrCreateDeviceId } from '../../../app/http/tokenStore';
import { withApiPrefix } from '../../../app/http/apiBase';
import { toApiImageUrl } from '../../file/api/fileApi';
import styles from './MyContractView.module.css';

/* ─── 이미지 갤러리 ───────────────────────────────────────────── */
function ImageGallery({ files }) {
  const [active, setActive] = useState(0);
  const images = (files ?? []).filter((f) => {
    const ext = (f.fileType ?? '').toLowerCase();
    return ['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext);
  });

  if (!images.length) {
    return (
      <div className={styles.galleryEmpty}>
        <span>🏠</span>
        <p>등록된 사진이 없습니다</p>
      </div>
    );
  }

  return (
    <div className={styles.gallery}>
      <div className={styles.galleryMain}>
        <img
          src={toApiImageUrl(
            images[active]?.viewUrl ?? images[active]?.fileUrl
          )}
          alt={`방 사진 ${active + 1}`}
        />
      </div>
      {images.length > 1 && (
        <div className={styles.galleryThumbs}>
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              className={`${styles.galleryThumb} ${i === active ? styles.galleryThumbActive : ''}`}
              onClick={() => setActive(i)}
            >
              <img
                src={toApiImageUrl(img.viewUrl ?? img.fileUrl)}
                alt={`썸네일 ${i + 1}`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── 방 정보 패널 ────────────────────────────────────────────── */
function RoomInfoPanel({ room, contract }) {
  const rentTypeLabel = { monthly_rent: '월세', stay: '단기' };
  const sunLabel = { s: '남향', n: '북향', e: '동향', w: '서향' };
  const statusLabel = {
    available: '입주 가능',
    reserved: '예약 중',
    contracted: '계약 중',
    repair: '수리 중',
    cleaning: '청소 중',
  };

  const options = room.roomOptions
    ? room.roomOptions
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean)
    : [];

  const fmt = (v) => (v ? String(v).slice(0, 10) : '-');
  const fmtMoney = (v) => (v != null ? Number(v).toLocaleString() + '원' : '-');

  return (
    <div className={styles.roomPanel}>
      <div className={styles.roomTitleRow}>
        <h2 className={styles.roomName}>
          {room.buildingNm} {room.roomNo}호 · {room.floor}층
        </h2>
        <span
          className={`${styles.statusBadge} ${
            room.roomSt === 'available'
              ? styles.statusAvailable
              : room.roomSt === 'contracted'
                ? styles.statusContracted
                : styles.statusOther
          }`}
        >
          {statusLabel[room.roomSt] ?? room.roomSt}
        </span>
      </div>

      <p className={styles.buildingAddr}>📍 {room.buildingAddr}</p>

      <div className={styles.contractBanner}>
        <span className={styles.contractBannerLabel}>📋 계약 기간</span>
        <span className={styles.contractBannerValue}>
          {fmt(contract.contractStart)} ~ {fmt(contract.contractEnd)}
        </span>
        <span
          className={`${styles.contractStatusChip} ${
            contract.contractStatus === 'active'
              ? styles.chipActive
              : contract.contractStatus === 'requested' ||
                  contract.contractStatus === 'approved'
                ? styles.chipPending
                : styles.chipExpired
          }`}
        >
          {contract.contractStatus === 'active'
            ? '활성'
            : contract.contractStatus === 'requested' ||
                contract.contractStatus === 'approved'
              ? '승인대기'
              : contract.contractStatus === 'ended'
                ? '만료'
                : (contract.contractStatus ?? '-')}
        </span>
      </div>

      <div className={styles.priceBlock}>
        <div className={styles.priceType}>
          {rentTypeLabel[room.rentType] ?? room.rentType ?? '월세'}
        </div>
        <div className={styles.priceMain}>
          월 <strong>{fmtMoney(contract.rentPrice ?? room.rentPrice)}</strong>
        </div>
        <div className={styles.priceSub}>
          보증금 {fmtMoney(contract.deposit ?? room.deposit)} · 관리비{' '}
          {fmtMoney(contract.manageFee ?? room.manageFee)}
          {contract.paymentDay ? ` · 매월 ${contract.paymentDay}일 납부` : ''}
        </div>
      </div>

      <div className={styles.specGrid}>
        {[
          ['면적', room.roomSize ? `${room.roomSize}㎡` : '-'],
          ['수용인원', room.roomCapacity ? `${room.roomCapacity}인` : '-'],
          ['최소기간', room.rentMin ? `${room.rentMin}개월` : '-'],
          ['채광', sunLabel[room.sunDirection] ?? room.sunDirection ?? '-'],
          [
            '납부일',
            contract.paymentDay ? `매월 ${contract.paymentDay}일` : '-',
          ],
          ...(contract.lessorNm ? [['임차인', contract.lessorNm]] : []),
        ].map(([label, value]) => (
          <div key={label} className={styles.specItem}>
            <span className={styles.specLabel}>{label}</span>
            <span className={styles.specValue}>{value}</span>
          </div>
        ))}
      </div>

      {options.length > 0 && (
        <div className={styles.optionBlock}>
          <p className={styles.optionTitle}>포함 옵션</p>
          <div className={styles.optionTags}>
            {options.map((o) => (
              <span key={o} className={styles.optionTag}>
                {o}
              </span>
            ))}
          </div>
        </div>
      )}

      {room.roomDesc && (
        <div className={styles.descBlock}>
          <p className={styles.descTitle}>방 소개</p>
          <p className={styles.descText}>{room.roomDesc}</p>
        </div>
      )}
    </div>
  );
}

/* ─── 계약서 이미지 뷰어 모달 ────────────────────────────────── */
function ContractImageModal({ contract, onClose }) {
  const imgUrl =
    toApiImageUrl(contract.contractPdfUrl) ||
    withApiPrefix(`/files/${contract.contractPdfFileId}/view`);
  const downloadUrl =
    toApiImageUrl(contract.contractPdfUrl) ||
    withApiPrefix(`/files/${contract.contractPdfFileId}/download`);

  return (
    <div className={styles.imgOverlay} onClick={onClose}>
      <div className={styles.imgModal} onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className={styles.imgModalHeader}>
          <span className={styles.imgModalTitle}>
            📄 계약서 · {contract.buildingNm} {contract.roomNo}호
          </span>
          <div className={styles.imgModalActions}>
            <a
              className={styles.imgDownloadBtn}
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              ⬇ 저장
            </a>
            <button
              type="button"
              className={styles.imgCloseBtn}
              onClick={onClose}
            >
              ✕
            </button>
          </div>
        </div>

        {/* 계약서 이미지 */}
        <div className={styles.imgScrollArea}>
          <img
            src={imgUrl}
            alt="계약서"
            className={styles.contractImg}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextSibling.style.display = 'flex';
            }}
          />
          <div className={styles.imgLoadError} style={{ display: 'none' }}>
            <span>⚠️</span>
            <p>계약서 이미지를 불러올 수 없습니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── 비밀번호 확인 모달 ────────────────────────────────────── */
function PasswordModal({ onConfirm, onClose }) {
  const [pwdInput, setPwdInput] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!pwdInput.trim()) {
      setPwdError('비밀번호를 입력해주세요.');
      return;
    }
    setLoading(true);
    setPwdError('');
    try {
      const me = await authApi.me();
      const deviceId = getOrCreateDeviceId();
      await authApi.login({
        userEmail: me.userEmail,
        userPwd: pwdInput,
        deviceId,
      });
      onConfirm();
    } catch {
      setPwdError('비밀번호가 올바르지 않습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modalBox}>
        <h3 className={styles.modalTitle}>🔒 본인 확인</h3>
        <p className={styles.modalDesc}>
          계약서를 확인하려면 현재 비밀번호를 입력해주세요.
        </p>
        <input
          className={styles.pwdInput}
          type="password"
          placeholder="비밀번호"
          value={pwdInput}
          onChange={(e) => setPwdInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
          autoFocus
        />
        {pwdError && <p className={styles.pwdError}>{pwdError}</p>}
        <div className={styles.modalBtns}>
          <button type="button" className={styles.btnCancel} onClick={onClose}>
            취소
          </button>
          <button
            type="button"
            className={styles.btnConfirm}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? '확인 중…' : '확인'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── 계약 카드 ──────────────────────────────────────────────── */
function ContractCard({ contract }) {
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [roomLoading, setRoomLoading] = useState(true);
  const [roomError, setRoomError] = useState('');
  const [expanded, setExpanded] = useState(true);

  // 모달 상태
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [showImgModal, setShowImgModal] = useState(false);

  /* 방 상세 정보 로드 */
  useEffect(() => {
    if (!contract.roomId) {
      setRoomLoading(false);
      return;
    }
    propertyApi
      .getRoomDetail(contract.roomId)
      .then((data) => setRoom(data))
      .catch((e) =>
        setRoomError(e?.message ?? '방 정보를 불러오지 못했습니다.')
      )
      .finally(() => setRoomLoading(false));
  }, [contract.roomId]);

  const hasContractImage = !!contract.contractPdfFileId;
  const isActive = contract.contractStatus === 'active';
  const isEnded = contract.contractStatus === 'ended';
  const canWriteReview = isActive || isEnded;

  const handleViewContract = () => {
    if (!hasContractImage) return;
    setShowPwdModal(true);
  };

  return (
    <div className={styles.contractCard}>
      {/* ── 카드 헤더 ── */}
      <button
        type="button"
        className={styles.cardHeadBtn}
        onClick={() => setExpanded((v) => !v)}
      >
        <div className={styles.cardHeadLeft}>
          <span className={styles.cardIdChip}>계약 #{contract.contractId}</span>
          <span className={styles.cardBuilding}>
            {contract.buildingNm} · 방 #{contract.roomNo ?? contract.roomId}
          </span>
        </div>
        <div className={styles.cardHeadRight}>
          <span
            className={`${styles.statusChip} ${
              contract.contractStatus === 'active'
                ? styles.chipActive
                : contract.contractStatus === 'requested' ||
                    contract.contractStatus === 'approved'
                  ? styles.chipPending
                  : styles.chipExpired
            }`}
          >
            {contract.contractStatus === 'active'
              ? '활성'
              : contract.contractStatus === 'requested' ||
                  contract.contractStatus === 'approved'
                ? '승인대기'
                : contract.contractStatus === 'ended'
                  ? '만료'
                  : (contract.contractStatus ?? '-')}
          </span>
          <span className={styles.chevron}>{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* ── 카드 바디 ── */}
      {expanded && (
        <div className={styles.cardBody}>
          {roomLoading ? (
            <div className={styles.roomLoading}>
              <span className={styles.spinner} /> 방 정보를 불러오는 중…
            </div>
          ) : roomError ? (
            <p className={styles.roomError}>⚠️ {roomError}</p>
          ) : room ? (
            <div className={styles.roomGrid}>
              <ImageGallery files={room.files} />
              <RoomInfoPanel room={room} contract={contract} />
            </div>
          ) : (
            <p className={styles.roomError}>방 정보를 찾을 수 없습니다.</p>
          )}

          {/* ── 하단 버튼 영역 ── */}
          <div className={styles.pdfRow}>
            {/* 계약서 보기 */}
            {hasContractImage ? (
              <button
                type="button"
                className={styles.pdfBtn}
                onClick={handleViewContract}
              >
                📄 계약서 보기
              </button>
            ) : (
              <div className={styles.contractPending}>
                {contract.contractStatus === 'requested' ||
                contract.contractStatus === 'approved'
                  ? '⏳ 관리자 승인 후 계약서가 발급됩니다.'
                  : '📄 계약서 준비 중입니다.'}
              </div>
            )}

            {/* 월세 결제 버튼 (active 계약만 표시) */}
            {isActive && (
              <button
                type="button"
                className={styles.payBtn}
                onClick={() => {
                  window.location.href = `/me?tab=myroom&sub=rent-payment&contractId=${contract.contractId}`;
                }}
              >
                💳 월세 결제
              </button>
            )}

            {/* 결제 조회 버튼 (active 계약만 표시) */}
            {isActive && (
              <button
                type="button"
                className={styles.payHistoryBtn}
                onClick={() => {
                  window.location.href = `/me?tab=myroom&sub=rent-payment&contractId=${contract.contractId}`;
                }}
              >
                🧾 결제 조회
              </button>
            )}

            {/* 리뷰쓰기 버튼 (active 또는 ended 계약만 표시) */}
            {canWriteReview && contract.roomId && (
              <button
                type="button"
                className={styles.reviewBtn}
                onClick={() => navigate(`/rooms/${contract.roomId}#reviews`)}
              >
                ✍️ 리뷰쓰기
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── 비밀번호 확인 모달 ── */}
      {showPwdModal && (
        <PasswordModal
          onConfirm={() => {
            setShowPwdModal(false);
            setShowImgModal(true);
          }}
          onClose={() => setShowPwdModal(false)}
        />
      )}

      {/* ── 계약서 이미지 뷰어 ── */}
      {showImgModal && (
        <ContractImageModal
          contract={contract}
          onClose={() => setShowImgModal(false)}
        />
      )}
    </div>
  );
}

/* ─── 메인 컴포넌트 ───────────────────────────────────────────── */
export default function MyContractView() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    contractApi
      .myContracts()
      .then((data) => {
        setContracts(Array.isArray(data) ? data : []);
        setError('');
      })
      .catch((e) => setError(e?.message ?? '계약 정보를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className={styles.stateBox}>
        <span className={styles.spinner} />
        <p>계약 정보를 불러오는 중…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.stateBox}>
        <span className={styles.stateIcon}>⚠️</span>
        <p className={styles.stateError}>{error}</p>
      </div>
    );
  }

  if (!contracts.length) {
    return (
      <div className={styles.stateBox}>
        <span className={styles.stateIcon}>🏠</span>
        <p className={styles.stateMsg}>현재 계약 정보가 없습니다.</p>
        <p className={styles.stateSub}>
          입주 계약 후 여기서 내 방 정보를 확인할 수 있어요.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      {contracts.map((c) => (
        <ContractCard key={c.contractId} contract={c} />
      ))}
    </div>
  );
}
