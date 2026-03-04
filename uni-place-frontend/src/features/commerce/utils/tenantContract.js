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
  return pickActiveTenantContracts(contracts)[0] || null;
}

export function pickActiveTenantContracts(contracts) {
  const list = Array.isArray(contracts) ? contracts : [];
  return list.filter((contract) => isActiveNow(contract));
}
