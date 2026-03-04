import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Modal from '../../../shared/components/Modal/Modal';
import { contractApi } from '../../contract/api/contractApi';
import { billingApi } from '../api/billingApi';
import styles from './MyMonthlyCharges.module.css';

const CONTRACT_FILTERS = [
  { key: 'ongoing', label: '계약 진행/예정' },
  { key: 'ended', label: '계약 만료' },
];

const BILLING_FILTERS = [  { key: 'unpaid', label: '미납내역' },
  { key: 'paid', label: '결제 완료' },
  { key: 'overdue', label: '연체 내역' },
];

function hasText(value) {
  return value !== null && value !== undefined && String(value).trim() !== '';
}

function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toMonthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function monthDiff(start, end) {
  return (
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth())
  );
}

function monthRangeInclusive(start, end) {
  if (!start || !end) return 0;
  const diff = monthDiff(toMonthStart(start), toMonthStart(end));
  return diff >= 0 ? diff + 1 : 0;
}

function addMonths(date, months) {
  const out = new Date(date);
  out.setMonth(out.getMonth() + months);
  return out;
}

function formatMonth(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    '0'
  )}`;
}

function formatMoney(value) {
  const n = Number(value || 0);
  return `${n.toLocaleString('ko-KR')}원`;
}

function sortByBillingDtAsc(list) {
  return [...list].sort((a, b) =>
    String(a?.billingDt || '').localeCompare(String(b?.billingDt || ''))
  );
}

function toStatusKey(contractStatus) {
  const key = String(contractStatus || '').toLowerCase();
  if (key === 'active' || key === 'approved' || key === 'requested') return 'ongoing';
  return 'ended';
}

function summarizeContract(contract, charges, now) {
  const contractStart = parseDate(contract?.contractStart);
  const contractEnd = parseDate(contract?.contractEnd);
  const totalMonths = monthRangeInclusive(contractStart, contractEnd);

  const elapsedMonthsRaw =
    contractStart && now ? monthDiff(toMonthStart(contractStart), toMonthStart(now)) + 1 : 0;
  const scheduledMonths = Math.max(0, Math.min(totalMonths, elapsedMonthsRaw));

  const rentChargesAll = Array.isArray(charges)
    ? charges.filter(
        (c) =>
          String(c?.chargeType || '').toLowerCase() === 'rent' ||
          !hasText(c?.chargeType)
      )
    : [];

  const rentCharges = sortByBillingDtAsc(
    rentChargesAll.length ? rentChargesAll : Array.isArray(charges) ? charges : []
  );

  const paidCharges = rentCharges.filter(
    (c) => String(c?.chargeSt || '').toLowerCase() === 'paid'
  );
  const unpaidCharges = rentCharges.filter(
    (c) => String(c?.chargeSt || '').toLowerCase() === 'unpaid'
  );
  const overdueCharges = rentCharges.filter(
    (c) => String(c?.chargeSt || '').toLowerCase() === 'overdue'
  );
  const payableCharges = sortByBillingDtAsc([...unpaidCharges]);

  const paidMonths = paidCharges.length;
  const remainingMonths = Math.max(0, totalMonths - paidMonths);

  let statusKey = 'paid';
  let statusLabel = '완납';
  if (overdueCharges.length > 0) {
    statusKey = 'overdue';
    statusLabel = `연체(${overdueCharges.length})`;
  } else if (paidMonths < scheduledMonths) {
    statusKey = 'unpaid';
    statusLabel = `미납(${scheduledMonths - paidMonths})`;
  } else if (paidMonths > scheduledMonths) {
    statusKey = 'paid';
    statusLabel = `선납(${paidMonths - scheduledMonths})`;
  }

  const firstPayable = payableCharges[0] || null;
  const targetBillingMonth =
    firstPayable?.billingDt ||
    (contractStart && paidMonths < totalMonths
      ? formatMonth(addMonths(toMonthStart(contractStart), paidMonths))
      : '-');

  return {
    contractId: contract.contractId,
    buildingNm: contract.buildingNm || '-',
    roomNo: contract.roomNo || '-',
    contractStatusKey: toStatusKey(contract.contractStatus),
    monthProgress: `${totalMonths}개월 / 예정 ${scheduledMonths} / 납입 ${paidMonths}`,
    totalMonths,
    scheduledMonths,
    paidMonths,
    remainingMonths,
    billingMonth: targetBillingMonth,
    statusKey,
    statusLabel,
    monthlyRent: Number(contract.rentPrice || 0),
    maxPlan: Math.min(remainingMonths, payableCharges.length),
    payableChargeIds: payableCharges.map((c) => c.chargeId).filter(Boolean),
    selected: false,
    payPlan: 0,
    contractStart: contract?.contractStart || '-',
    contractEnd: contract?.contractEnd || '-',
  };
}

export default function MyMonthlyCharges({ focusContractId = null }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);
  const [contractFilter, setContractFilter] = useState(new Set());
  const [billingFilter, setBillingFilter] = useState(new Set());
  const [payOpen, setPayOpen] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState('');
  const [qrItems, setQrItems] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const contractsRaw = await contractApi.myContracts();
      const contracts = (Array.isArray(contractsRaw) ? contractsRaw : []).filter(
        (contract) => {
          const status = String(contract?.contractStatus || '').toLowerCase();
          return status !== 'cancelled' && status !== 'requested';
        }
      );

      const chargeResults = await Promise.all(
        contracts.map(async (contract) => {
          try {
            const charges = await billingApi.listByContract(contract.contractId);
            return [contract.contractId, Array.isArray(charges) ? charges : []];
          } catch {
            return [contract.contractId, []];
          }
        })
      );
      const chargeMap = new Map(chargeResults);
      const now = new Date();

      const nextRows = contracts.map((contract) =>
        summarizeContract(contract, chargeMap.get(contract.contractId), now)
      );
      setRows(nextRows);
    } catch (e) {
      setError(e?.message || '월세 정보를 불러오지 못했습니다.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!payOpen || qrItems.length === 0) return undefined;
    const timer = setInterval(() => {
      loadData();
    }, 5000);
    return () => clearInterval(timer);
  }, [loadData, payOpen, qrItems.length]);

  useEffect(() => {
    if (!focusContractId) return;
    const targetId = Number(focusContractId);
    if (!Number.isFinite(targetId) || targetId <= 0) return;
    setRows((prev) =>
      prev.map((row) =>
        row.contractId === targetId ? { ...row, selected: true } : row
      )
    );
  }, [focusContractId]);

  const shownRows = useMemo(() => {
    return rows.filter((row) => {
      if (contractFilter.size > 0 && !contractFilter.has(row.contractStatusKey)) {
        return false;
      }
      if (billingFilter.size > 0) {        if (!billingFilter.has(row.statusKey)) {
          return false;
        }
      }
      return true;
    });
  }, [rows, contractFilter, billingFilter]);

  const totalAmount = useMemo(
    () =>
      shownRows
        .filter((row) => row.selected)
        .reduce((sum, row) => sum + row.payPlan * row.monthlyRent, 0),
    [shownRows]
  );

  const toggleContractFilter = (key) => {
    setContractFilter((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleBillingFilter = (key) => {
    setBillingFilter((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const setRowValue = (contractId, updater) => {
    setRows((prev) =>
      prev.map((row) => (row.contractId === contractId ? updater(row) : row))
    );
  };

  const updatePlan = (row, delta) => {
    setRowValue(row.contractId, (current) => {
      const max = Number(current.maxPlan || 0);
      const nextPlan = Math.max(0, Math.min(max, Number(current.payPlan || 0) + delta));
      return { ...current, payPlan: nextPlan };
    });
  };

  const selectedRows = shownRows.filter((row) => row.selected && row.payPlan > 0);

  const openPay = () => {
    const payableRemain = shownRows.reduce(
      (sum, row) => sum + Number(row.maxPlan || 0),
      0
    );
    if (payableRemain <= 0) {
      setPayError(
        '모든 월세를 납부하셨습니다. 더이상 지불하실 수 없습니다.'
      );
      return;
    }

    if (selectedRows.length === 0) {
      setPayError('결제할 항목을 선택하고 지불 예정 횟수를 1 이상으로 설정해주세요.');
      return;
    }
    setPayError('');
    setQrItems([]);
    setPayOpen(true);
  };

  const handleKakao = async () => {
    setPayLoading(true);
    setPayError('');
    setQrItems([]);
    try {
      const selectedChargeIds = [];
      const titleParts = [];

      for (const row of selectedRows) {
        const needed = row.payPlan;
        const available = row.payableChargeIds.length;
        if (Number(row.maxPlan || 0) <= 0) {
          throw new Error(
            '모든 월세를 납부하셨습니다. 더이상 지불하실 수 없습니다.'
          );
        }
        if (needed > available) {
          throw new Error(
            `${row.buildingNm} ${row.roomNo}호는 현재 ${available}개월분만 청구 생성되어 결제할 수 있습니다.`
          );
        }
        titleParts.push(`${row.buildingNm} ${row.roomNo}호 ${needed}개월`);
        for (let i = 0; i < needed; i += 1) {
          selectedChargeIds.push(row.payableChargeIds[i]);
        }
      }

      const pay = await billingApi.prepareKakaoBatch(selectedChargeIds);
      const openUrl =
        pay?.redirectPcUrl || pay?.redirectMobileUrl || pay?.redirectAppUrl;
      if (!hasText(openUrl)) {
        throw new Error('카카오페이 결제 URL을 가져오지 못했습니다.');
      }
      window.location.href = openUrl;
    } catch (e) {
      setPayError(e?.message || '카카오페이 QR 생성에 실패했습니다.');
    } finally {
      setPayLoading(false);
    }
  };

  return (
    <section className={styles.wrap}>
      <div className={styles.filterBox}>
        <div className={styles.filterGroup}>
          <strong>계약 필터</strong>
          {CONTRACT_FILTERS.map((item) => (
            <label key={item.key} className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={contractFilter.has(item.key)}
                onChange={() => toggleContractFilter(item.key)}
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>

        <div className={styles.filterGroup}>
          <strong>청구 상태 필터</strong>
          {BILLING_FILTERS.map((item) => (
            <label key={item.key} className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={billingFilter.has(item.key)}
                onChange={() => toggleBillingFilter(item.key)}
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {loading && <div className={styles.stateBox}>불러오는 중..</div>}
      {!loading && error && <div className={styles.errorBox}>{error}</div>}
      {!loading && !error && shownRows.length === 0 && (
        <div className={styles.stateBox}>표시할 월세 결제 내역이 없습니다.</div>
      )}

      {!loading && !error && shownRows.length > 0 && (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th />
                  <th>건물명</th>
                  <th>방호실</th>
                  <th>계약/예정/납입</th>
                  <th>청구월</th>
                  <th>상태</th>
                  <th>지불 예정</th>
                  <th>가격(원)</th>
                </tr>
              </thead>
              <tbody>
                {shownRows.map((row) => (
                  <tr key={row.contractId}>
                    <td>
                      <input
                        type="checkbox"
                        checked={row.selected}
                        onChange={(e) =>
                          setRowValue(row.contractId, (current) => ({
                            ...current,
                            selected: e.target.checked,
                          }))
                        }
                      />
                    </td>
                    <td>{row.buildingNm}</td>
                    <td>{row.roomNo}호</td>
                    <td>{row.monthProgress}</td>
                    <td>{row.billingMonth}</td>
                    <td>{row.statusLabel}</td>
                    <td>
                      <div className={styles.stepper}>
                        <button
                          type="button"
                          onClick={() => updatePlan(row, -1)}
                        >
                          {'<'}
                        </button>
                        <span>{row.payPlan}</span>
                        <button
                          type="button"
                          onClick={() => updatePlan(row, 1)}
                        >
                          {'>'}
                        </button>
                      </div>
                      <div className={styles.maxText}>최대 {row.maxPlan}</div>
                    </td>
                    <td>{formatMoney(row.monthlyRent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.footerBar}>
            <div>결제 금액</div>
            <div>
              총 <strong>{formatMoney(totalAmount)}</strong>
            </div>
          </div>

          {payError && <div className={styles.errorBox}>{payError}</div>}

          <div className={styles.payRow}>
            <button type="button" className={styles.payBtn} onClick={openPay}>
              결제하기
            </button>
          </div>
        </>
      )}

      <Modal
        open={payOpen}
        onClose={() => {
          setPayOpen(false);
          loadData();
        }}
        title="결제 수단 선택"
        size="md"
      >
        <div className={styles.modalBody}>
          <div className={styles.modalAmount}>
            결제 예정 금액: <strong>{formatMoney(totalAmount)}</strong>
          </div>

          <button
            type="button"
            className={styles.kakaoBtn}
            onClick={handleKakao}
            disabled={payLoading}
          >
            {payLoading ? 'QR 생성 중..' : '카카오페이'}
          </button>
          <button type="button" className={styles.refreshMiniBtn} onClick={loadData}>
            결제 상태 새로고침
          </button>

          {payError && <div className={styles.errorBox}>{payError}</div>}

          {qrItems.length > 0 && (
            <div className={styles.qrList}>
              {qrItems.map((item, idx) => (
                <div key={`${idx}-${item.url}`} className={styles.qrCard}>
                  <div className={styles.qrTitle}>
                    {idx + 1}. {item.title} / {formatMoney(item.totalPrice)}
                  </div>
                  <img src={item.qrImageUrl} alt="카카오페이 QR" className={styles.qrImage} />
                  <a href={item.url} target="_blank" rel="noreferrer" className={styles.qrLink}>
                    결제창 열기
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </section>
  );
}
