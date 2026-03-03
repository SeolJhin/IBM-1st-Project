import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Modal from '../../../shared/components/Modal/Modal';
import { contractApi } from '../../contract/api/contractApi';
import { billingApi } from '../api/billingApi';
import styles from './MyMonthlyCharges.module.css';

const CONTRACT_FILTERS = [
  { key: 'ongoing', label: '怨꾩빟 吏꾪뻾/?덉젙' },
  { key: 'ended', label: '怨꾩빟 留뚮즺' },
];

const BILLING_FILTERS = [
  { key: 'all', label: '?꾩껜' },
  { key: 'unpaid', label: '誘몃궔?댁뿭' },
  { key: 'paid', label: '寃곗젣 ?꾨즺' },
  { key: 'overdue', label: '?곗껜 ?댁뿭' },
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
  if (key === 'active' || key === 'requested') return 'ongoing';
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
  const payableCharges = sortByBillingDtAsc([...overdueCharges, ...unpaidCharges]);

  const paidMonths = paidCharges.length;
  const remainingMonths = Math.max(0, totalMonths - paidMonths);

  let statusKey = 'paid';
  let statusLabel = '?꾨궔';
  if (overdueCharges.length > 0) {
    statusKey = 'overdue';
    statusLabel = `?곗껜(${overdueCharges.length})`;
  } else if (paidMonths < scheduledMonths) {
    statusKey = 'unpaid';
    statusLabel = `誘몃궔(${scheduledMonths - paidMonths})`;
  } else if (paidMonths > scheduledMonths) {
    statusKey = 'paid';
    statusLabel = `?좊궔(${paidMonths - scheduledMonths})`;
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
    monthProgress: `${totalMonths}媛쒖썡 / ?덉젙 ${scheduledMonths} / ?⑹엯 ${paidMonths}`,
    totalMonths,
    scheduledMonths,
    paidMonths,
    remainingMonths,
    billingMonth: targetBillingMonth,
    statusKey,
    statusLabel,
    monthlyRent: Number(contract.rentPrice || 0),
    maxPlan: remainingMonths,
    payableChargeIds: payableCharges.map((c) => c.chargeId).filter(Boolean),
    selected: false,
    payPlan: 0,
    contractStart: contract?.contractStart || '-',
    contractEnd: contract?.contractEnd || '-',
  };
}

function buildQrImageUrl(text) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=230x230&data=${encodeURIComponent(
    text
  )}`;
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
      const contracts = Array.isArray(contractsRaw) ? contractsRaw : [];

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
      setError(e?.message || '??? ??? ??????????? ????????');
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
      if (billingFilter.size > 0) {
        const hasAll = billingFilter.has('all');
        if (!hasAll && !billingFilter.has(row.statusKey)) {
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
        '紐⑤뱺 ?붿꽭瑜??⑸??섏뀲?듬땲?? ?붿씠??吏遺덊븯?????놁뒿?덈떎.'
      );
      return;
    }

    if (selectedRows.length === 0) {
      setPayError('寃곗젣????ぉ???좏깮?섍퀬 吏遺??덉젙 ?섎? 1 ?댁긽?쇰줈 ?ㅼ젙?댁＜?몄슂.');
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
            '紐⑤뱺 ?붿꽭瑜??⑸??섏뀲?듬땲?? ?붿씠??吏遺덊븯?????놁뒿?덈떎.'
          );
        }
        if (needed > available) {
          throw new Error(
            `${row.buildingNm} ${row.roomNo}?몃뒗 ?꾩옱 ${available}媛쒖썡遺꾨쭔 泥?뎄 ?앹꽦?섏뼱 寃곗젣?????덉뒿?덈떎.`
          );
        }
        titleParts.push(`${row.buildingNm} ${row.roomNo}??${needed}媛쒖썡`);
        for (let i = 0; i < needed; i += 1) {
          selectedChargeIds.push(row.payableChargeIds[i]);
        }
      }

      const pay = await billingApi.prepareKakaoBatch(selectedChargeIds);
      const openUrl =
        pay?.redirectPcUrl || pay?.redirectMobileUrl || pay?.redirectAppUrl;
      if (!hasText(openUrl)) {
        throw new Error('移댁뭅?ㅽ럹??寃곗젣 URL??媛?몄삤吏 紐삵뻽?듬땲??');
      }
      setQrItems([
        {
          title: titleParts.join(' / '),
          url: openUrl,
          qrImageUrl: buildQrImageUrl(openUrl),
          totalPrice: totalAmount,
        },
      ]);
    } catch (e) {
      setPayError(e?.message || '移댁뭅?ㅽ럹??QR ?앹꽦???ㅽ뙣?덉뒿?덈떎.');
    } finally {
      setPayLoading(false);
    }
  };

  return (
    <section className={styles.wrap}>
      <div className={styles.filterBox}>
        <div className={styles.filterGroup}>
          <strong>怨꾩빟 ?꾪꽣</strong>
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
          <strong>泥?뎄 ?곹깭 ?꾪꽣</strong>
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

      {loading && <div className={styles.stateBox}>遺덈윭?ㅻ뒗 以?..</div>}
      {!loading && error && <div className={styles.errorBox}>{error}</div>}
      {!loading && !error && shownRows.length === 0 && (
        <div className={styles.stateBox}>?쒖떆???붿꽭 寃곗젣 ?댁뿭???놁뒿?덈떎.</div>
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
                  <th>怨꾩빟/?덉젙/?⑹엯</th>
                  <th>청구월</th>
                  <th>?곹깭</th>
                  <th>吏遺??덉젙</th>
                  <th>媛寃???</th>
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
                      <div className={styles.maxText}>理쒕? {row.maxPlan}</div>
                    </td>
                    <td>{formatMoney(row.monthlyRent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.footerBar}>
            <div>寃곗젣 湲덉븸</div>
            <div>
              珥?<strong>{formatMoney(totalAmount)}</strong>
            </div>
          </div>

          {payError && <div className={styles.errorBox}>{payError}</div>}

          <div className={styles.payRow}>
            <button type="button" className={styles.payBtn} onClick={openPay}>
              寃곗젣?섍린
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
        title="寃곗젣 ?섎떒 ?좏깮"
        size="md"
      >
        <div className={styles.modalBody}>
          <div className={styles.modalAmount}>
            寃곗젣 ?덉젙 湲덉븸: <strong>{formatMoney(totalAmount)}</strong>
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
            寃곗젣 ?곹깭 ?덈줈怨좎묠
          </button>

          {payError && <div className={styles.errorBox}>{payError}</div>}

          {qrItems.length > 0 && (
            <div className={styles.qrList}>
              {qrItems.map((item, idx) => (
                <div key={`${idx}-${item.url}`} className={styles.qrCard}>
                  <div className={styles.qrTitle}>
                    {idx + 1}. {item.title} / {formatMoney(item.totalPrice)}
                  </div>
                  <img src={item.qrImageUrl} alt="移댁뭅?ㅽ럹??QR" className={styles.qrImage} />
                  <a href={item.url} target="_blank" rel="noreferrer" className={styles.qrLink}>
                    寃곗젣李??닿린
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

