const AUTH_RESUME_KEY = 'uniplace_auth_resume_v1';
const MAX_FIELDS = 200;
const MAX_TEXT_LENGTH = 4000;
const AUTH_PATHS = new Set([
  '/login',
  '/signup',
  '/find-account',
  '/reset-password',
  '/oauth2/success',
]);

export const AUTH_SESSION_EXPIRED_EVENT = 'uniplace:auth-session-expired';
export const AUTH_EXPIRED_NOTICE =
  '세션이 만료되어 다시 로그인이 필요합니다. 작성 중이던 내용은 로그인 후 복원됩니다.';

let lastAuthExpiredEventAt = 0;

function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function nowPath() {
  if (!isBrowser()) return '/';
  const { pathname = '/', search = '', hash = '' } = window.location;
  return `${pathname}${search}${hash}`;
}

function truncate(value) {
  const text = String(value ?? '');
  return text.length > MAX_TEXT_LENGTH ? text.slice(0, MAX_TEXT_LENGTH) : text;
}

function isSkippableElement(el) {
  if (!el) return true;
  if (el.disabled) return true;
  if (el.closest('[data-draft-ignore="true"]')) return true;

  const tag = String(el.tagName || '').toLowerCase();
  if (tag === 'input') {
    const type = String(el.type || 'text').toLowerCase();
    if (
      type === 'password' ||
      type === 'file' ||
      type === 'hidden' ||
      type === 'submit' ||
      type === 'button' ||
      type === 'reset'
    ) {
      return true;
    }
  }
  return false;
}

function buildLocator(el) {
  const draftKey = String(el.getAttribute('data-draft-key') || '').trim();
  if (draftKey) return { by: 'data-draft-key', key: draftKey };

  const name = String(el.getAttribute('name') || '').trim();
  if (name) return { by: 'name', key: name };

  const id = String(el.getAttribute('id') || '').trim();
  if (id) return { by: 'id', key: id };

  return null;
}

function captureFieldValue(el) {
  const tag = String(el.tagName || '').toLowerCase();
  const inputType = String(el.type || '').toLowerCase();

  if (tag === 'input') {
    if (inputType === 'checkbox') return { kind: 'checkbox', value: !!el.checked };
    if (inputType === 'radio') {
      if (!el.checked) return null;
      return { kind: 'radio', value: String(el.value ?? '') };
    }
    return { kind: 'text', value: truncate(el.value ?? '') };
  }

  if (tag === 'textarea') {
    return { kind: 'text', value: truncate(el.value ?? '') };
  }

  if (tag === 'select') {
    if (el.multiple) {
      const selected = Array.from(el.options || [])
        .filter((option) => option.selected)
        .map((option) => String(option.value ?? ''));
      return { kind: 'select-multiple', value: selected };
    }
    return { kind: 'select', value: String(el.value ?? '') };
  }

  if (el.isContentEditable) {
    return { kind: 'html', value: truncate(el.innerHTML ?? '') };
  }

  return null;
}

function snapshotDraftFields() {
  if (!isBrowser()) return [];

  const candidates = Array.from(
    document.querySelectorAll('input, textarea, select, [contenteditable="true"]')
  );
  const fields = [];

  for (const el of candidates) {
    if (fields.length >= MAX_FIELDS) break;
    if (isSkippableElement(el)) continue;

    const locator = buildLocator(el);
    if (!locator) continue;

    const captured = captureFieldValue(el);
    if (!captured) continue;

    fields.push({
      locator,
      tag: String(el.tagName || '').toLowerCase(),
      inputType: String(el.type || '').toLowerCase(),
      ...captured,
    });
  }

  return fields;
}

function findTargets(locator) {
  if (!isBrowser() || !locator?.by || !locator?.key) return [];

  if (locator.by === 'id') {
    const el = document.getElementById(locator.key);
    return el ? [el] : [];
  }

  if (locator.by === 'name') {
    return Array.from(document.getElementsByName(locator.key));
  }

  if (locator.by === 'data-draft-key') {
    const escaped =
      typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
        ? CSS.escape(locator.key)
        : String(locator.key).replace(/"/g, '\\"');
    return Array.from(
      document.querySelectorAll(`[data-draft-key="${escaped}"]`)
    );
  }

  return [];
}

function dispatchInputEvents(el) {
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

function setTextLikeValue(el, value) {
  const setter =
    Object.getOwnPropertyDescriptor(el.constructor?.prototype, 'value')?.set ||
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set ||
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set ||
    Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set;

  if (setter) {
    setter.call(el, value);
  } else {
    el.value = value;
  }
}

function applyFieldSnapshot(field) {
  const targets = findTargets(field?.locator);
  if (!targets.length) return 0;

  let applied = 0;

  for (const el of targets) {
    const tag = String(el.tagName || '').toLowerCase();
    const type = String(el.type || '').toLowerCase();

    if (field.kind === 'radio' && tag === 'input' && type === 'radio') {
      const shouldCheck = String(el.value ?? '') === String(field.value ?? '');
      if (!shouldCheck) continue;
      el.checked = true;
      dispatchInputEvents(el);
      applied += 1;
      continue;
    }

    if (field.kind === 'checkbox' && tag === 'input' && type === 'checkbox') {
      el.checked = !!field.value;
      dispatchInputEvents(el);
      applied += 1;
      continue;
    }

    if (field.kind === 'select-multiple' && tag === 'select') {
      const selected = new Set(
        Array.isArray(field.value) ? field.value.map((v) => String(v)) : []
      );
      Array.from(el.options || []).forEach((option) => {
        option.selected = selected.has(String(option.value ?? ''));
      });
      dispatchInputEvents(el);
      applied += 1;
      continue;
    }

    if (field.kind === 'html' && el.isContentEditable) {
      el.innerHTML = String(field.value ?? '');
      dispatchInputEvents(el);
      applied += 1;
      continue;
    }

    if (
      field.kind === 'text' ||
      field.kind === 'select' ||
      (tag === 'input' && type !== 'radio' && type !== 'checkbox')
    ) {
      setTextLikeValue(el, String(field.value ?? ''));
      dispatchInputEvents(el);
      applied += 1;
    }
  }

  return applied;
}

function safeParse(jsonText) {
  if (!jsonText) return null;
  try {
    return JSON.parse(jsonText);
  } catch {
    return null;
  }
}

export function isAuthPath(pathname = '') {
  return AUTH_PATHS.has(String(pathname || '').trim());
}

export function peekAuthResumeSnapshot() {
  if (!isBrowser()) return null;
  return safeParse(sessionStorage.getItem(AUTH_RESUME_KEY));
}

export function clearAuthResumeSnapshot() {
  if (!isBrowser()) return;
  sessionStorage.removeItem(AUTH_RESUME_KEY);
}

export function __resetAuthResumeForTest() {
  lastAuthExpiredEventAt = 0;
  clearAuthResumeSnapshot();
}

export function getAuthResumePath() {
  const snapshot = peekAuthResumeSnapshot();
  const from = String(snapshot?.from || '').trim();
  return from || '/';
}

export function saveAuthResumeSnapshot(fromPath = nowPath()) {
  if (!isBrowser()) return null;

  const snapshot = {
    from: String(fromPath || '/'),
    capturedAt: new Date().toISOString(),
    draft: snapshotDraftFields(),
  };

  sessionStorage.setItem(AUTH_RESUME_KEY, JSON.stringify(snapshot));
  return snapshot;
}

export function notifyAuthSessionExpired(fromPath = nowPath()) {
  if (!isBrowser()) return;
  if (isAuthPath(window.location.pathname)) return;

  const now = Date.now();
  if (now - lastAuthExpiredEventAt < 800) return;
  lastAuthExpiredEventAt = now;

  const snapshot = saveAuthResumeSnapshot(fromPath);
  window.dispatchEvent(
    new CustomEvent(AUTH_SESSION_EXPIRED_EVENT, {
      detail: {
        from: snapshot?.from || fromPath,
        message: AUTH_EXPIRED_NOTICE,
      },
    })
  );
}

export function restoreAuthResumeForPath(
  currentPath,
  { maxAttempts = 10, intervalMs = 120 } = {}
) {
  if (!isBrowser()) return false;

  const snapshot = peekAuthResumeSnapshot();
  if (!snapshot?.from || !Array.isArray(snapshot.draft)) return false;
  if (String(snapshot.from) !== String(currentPath || '')) return false;

  let attempts = 0;

  const tryRestore = () => {
    attempts += 1;
    const restoredCount = snapshot.draft.reduce(
      (sum, field) => sum + applyFieldSnapshot(field),
      0
    );

    if (restoredCount > 0) {
      clearAuthResumeSnapshot();
      return;
    }

    if (attempts < maxAttempts) {
      window.setTimeout(tryRestore, intervalMs);
    }
  };

  window.setTimeout(tryRestore, 0);
  return true;
}
