function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isActiveNow(contract, now = new Date()) {
  if (!contract) return false;
  if (String(contract.contractStatus || '').toLowerCase() !== 'active') {
    return false;
  }
  const start = toDate(contract.contractStart);
  const end = toDate(contract.contractEnd);
  if (!start || !end) return false;
  return start <= now && now <= end;
}

export function pickActiveTenantContract(contracts) {
  const list = Array.isArray(contracts) ? contracts : [];
  return list.find((contract) => isActiveNow(contract)) || null;
}

