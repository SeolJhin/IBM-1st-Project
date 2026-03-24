import React, { useMemo, useState } from 'react';
import styles from './PaymentOptionPanel.module.css';

import tossPayLogo from '../PGlogos/toss2.png';
import naverPayLogo from '../PGlogos/logo_navergr_small.svg';
import kakaoPayLogo from '../PGlogos/payment_icon_yellow_small.png';

function cls(...values) {
  return values.filter(Boolean).join(' ');
}

function ComingSoonToast({ onClose }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        background: 'rgba(0,0,0,0.35)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 14,
          padding: '28px 32px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          textAlign: 'center',
          minWidth: 260,
          maxWidth: 320,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: 36, marginBottom: 10 }}>🛠️</div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: '#222',
            marginBottom: 8,
          }}
        >
          기능 구현 예정
        </div>
        <div
          style={{
            fontSize: 13,
            color: '#888',
            marginBottom: 20,
            lineHeight: 1.6,
          }}
        >
          신용·체크카드 결제는
          <br />
          현재 준비 중입니다.
        </div>
        <button
          onClick={onClose}
          style={{
            background: '#222',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '9px 28px',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          확인
        </button>
      </div>
    </div>
  );
}

export default function PaymentOptionPanel({
  options = [],
  selectedOption = '',
  amountText = '',
  subtitle = '',
  loading = false,
  error = '',
  confirmLabel = '선택한 수단으로 결제',
  onSelect,
  onConfirm,
  onCancel,
}) {
  const [methodGroup, setMethodGroup] = useState('bankTransfer');
  const [cardCompany, setCardCompany] = useState(null);
  const [installment, setInstallment] = useState('0');
  const [comingSoon, setComingSoon] = useState(false);

  const easyPayOptions = useMemo(
    () => options.filter((opt) => ['toss', 'naver', 'kakao'].includes(opt.id)),
    [options]
  );

  const isSelectedEasyPay = (id) => selectedOption === id;

  const handleEasyPay = (id, available) => {
    if (!available || loading) return;
    setCardCompany(null);
    onSelect?.(id);
  };

  const handleCardSelect = (id) => {
    if (loading) return;
    setCardCompany(id);
    onSelect?.('card');
  };

  const cardCompanies = [
    { id: 'kb', short: 'Kb', label: '국민', color: '#f4b000' },
    { id: 'shinhan', short: 'Sh', label: '신한', color: '#2f5bd3' },
    { id: 'samsung', short: '삼', label: '삼성', color: '#3559b7' },
    { id: 'hyundai', short: 'Hd', label: '현대', color: '#8f8f8f' },
    { id: 'bc', short: 'BC', label: '비씨', color: '#ef4d4d' },
    { id: 'nonghyup', short: 'NH', label: '농협', color: '#f2b600' },
    { id: 'hana', short: '하', label: '하나', color: '#16a085' },
    { id: 'lotte', short: 'LO', label: '롯데', color: '#4d4d4d' },
    { id: 'woori', short: '우', label: '우리', color: '#3d7edb' },
    { id: 'citi', short: 'Ci', label: '씨티', color: '#d32f2f' },
    {
      id: 'kbank',
      short: 'k',
      label: '카카오뱅크',
      color: '#f5cc00',
      darkText: true,
    },
    { id: 'suhyup', short: 'Sh', label: '수협', color: '#2d9cdb' },
  ];

  return (
    <>
      {comingSoon && <ComingSoonToast onClose={() => setComingSoon(false)} />}

      <div className={styles.wrap}>
        <h3 className={styles.title}>결제 방법</h3>

        <button
          type="button"
          className={cls(
            styles.mainCardBtn,
            selectedOption === 'card' && styles.selected
          )}
          disabled={loading}
          onClick={() => setComingSoon(true)}
        >
          신용·체크카드
        </button>

        <div className={styles.tabs}>
          {[
            { id: 'bankTransfer', label: '계좌이체' },
            { id: 'virtualAccount', label: '무통장입금' },
            { id: 'mobile', label: '휴대폰' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={cls(
                styles.tab,
                methodGroup === tab.id && styles.tabActive
              )}
              onClick={() => setMethodGroup(tab.id)}
              disabled={loading}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className={styles.benefitWrap}>
          <span className={styles.badge}>혜택</span>
          <div className={styles.easyPayGrid}>
            <button
              type="button"
              className={cls(
                styles.easyPayBtn,
                isSelectedEasyPay('toss') && styles.selected
              )}
              onClick={() =>
                handleEasyPay(
                  'toss',
                  easyPayOptions.find((opt) => opt.id === 'toss')?.available !==
                    false
                )
              }
              disabled={
                loading ||
                easyPayOptions.find((opt) => opt.id === 'toss')?.available ===
                  false
              }
            >
              <img
                src={tossPayLogo}
                alt="토스페이"
                className={styles.easyLogoImg}
              />
              <span>토스페이</span>
            </button>

            <button
              type="button"
              className={cls(
                styles.easyPayBtn,
                isSelectedEasyPay('naver') && styles.selected
              )}
              onClick={() =>
                handleEasyPay(
                  'naver',
                  easyPayOptions.find((opt) => opt.id === 'naver')
                    ?.available !== false
                )
              }
              disabled={
                loading ||
                easyPayOptions.find((opt) => opt.id === 'naver')?.available ===
                  false
              }
            >
              <img
                src={naverPayLogo}
                alt="네이버페이"
                className={styles.easyLogoImg}
              />
              <span>네이버페이</span>
            </button>

            <button
              type="button"
              className={cls(
                styles.easyPayBtn,
                isSelectedEasyPay('kakao') && styles.selected
              )}
              onClick={() =>
                handleEasyPay(
                  'kakao',
                  easyPayOptions.find((opt) => opt.id === 'kakao')
                    ?.available !== false
                )
              }
              disabled={
                loading ||
                easyPayOptions.find((opt) => opt.id === 'kakao')?.available ===
                  false
              }
            >
              <img
                src={kakaoPayLogo}
                alt="카카오페이"
                className={styles.easyLogoImg}
              />
              <span>카카오페이</span>
            </button>
          </div>
        </div>

        <div className={styles.cardGrid}>
          {cardCompanies.map((card) => (
            <button
              key={card.id}
              type="button"
              className={cls(
                styles.cardItem,
                selectedOption === 'card' &&
                  cardCompany === card.id &&
                  styles.selected
              )}
              onClick={() => handleCardSelect(card.id)}
              disabled={loading}
            >
              <span
                className={styles.cardLogo}
                style={{
                  background: card.color,
                  color: card.darkText ? '#111' : '#fff',
                }}
              >
                {card.short}
              </span>
              <span className={styles.cardName}>{card.label}</span>
            </button>
          ))}
        </div>

        <select
          className={styles.installment}
          value={installment}
          onChange={(e) => setInstallment(e.target.value)}
          disabled={loading}
        >
          <option value="0">일시불</option>
          <option value="2">2개월</option>
          <option value="3">3개월</option>
          <option value="6">6개월</option>
          <option value="12">12개월</option>
        </select>

        <div className={styles.infoBlock}>
          {subtitle ? <div className={styles.heroSub}>{subtitle}</div> : null}
          {amountText ? (
            <div className={styles.amountBox}>
              결제 예정 금액 <strong>{amountText}</strong>
            </div>
          ) : null}
        </div>

        {error ? <div className={styles.error}>{error}</div> : null}

        <div className={styles.actions}>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className={styles.cancelBtn}
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading || !selectedOption}
            className={styles.confirmBtn}
          >
            {loading ? '처리 중..' : confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}
