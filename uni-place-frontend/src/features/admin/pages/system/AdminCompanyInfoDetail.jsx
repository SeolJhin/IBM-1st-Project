import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import styles from './AdminCompanyInfoDetail.module.css';

const EMPTY_FORM = Object.freeze({
  companyNm: '',
  companyCeo: '',
  businessNo: '',
  companyTel: '',
  companyEmail: '',
  companyAddr: '',
});

function safeText(value) {
  return typeof value === 'string' ? value : '';
}

function normalizeCompany(payload) {
  if (!payload || typeof payload !== 'object') return null;

  return {
    companyId: payload.companyId ?? null,
    companyNm: safeText(payload.companyNm),
    companyCeo: safeText(payload.companyCeo),
    businessNo: safeText(payload.businessNo),
    companyTel: safeText(payload.companyTel),
    companyEmail: safeText(payload.companyEmail),
    companyAddr: safeText(payload.companyAddr),
  };
}

function toForm(company) {
  if (!company) return { ...EMPTY_FORM };
  return {
    companyNm: company.companyNm,
    companyCeo: company.companyCeo,
    businessNo: company.businessNo,
    companyTel: company.companyTel,
    companyEmail: company.companyEmail,
    companyAddr: company.companyAddr,
  };
}

function trimOrNull(value) {
  const v = String(value ?? '').trim();
  return v ? v : null;
}

function hasInvalidEmail(email) {
  const value = String(email ?? '').trim();
  if (!value) return false;
  return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function AdminCompanyInfoDetail() {
  const [company, setCompany] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [fetchError, setFetchError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [notice, setNotice] = useState('');

  const applyCompany = useCallback((nextCompany) => {
    setCompany(nextCompany);
    setForm(toForm(nextCompany));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    setSaveError('');
    setNotice('');

    try {
      const payload = await adminApi.getCompanyInfo();
      const normalized = normalizeCompany(payload);

      if (!normalized || !normalized.companyId) {
        applyCompany(null);
        setFetchError('회사 정보 데이터를 찾지 못했습니다.');
        return;
      }

      applyCompany(normalized);
    } catch (error) {
      applyCompany(null);
      setFetchError(
        error?.message ||
          '회사 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
      );
    } finally {
      setLoading(false);
    }
  }, [applyCompany]);

  useEffect(() => {
    load();
  }, [load]);

  const onInput = (field) => (event) => {
    const { value } = event.target;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const isDirty = useMemo(() => {
    if (!company) return false;
    return Object.keys(EMPTY_FORM).some((field) => {
      const a = String(form[field] ?? '').trim();
      const b = String(company[field] ?? '').trim();
      return a !== b;
    });
  }, [company, form]);

  const canSubmit =
    Boolean(company?.companyId) && isDirty && !loading && !saving;

  const onReset = () => {
    if (!company) return;
    setForm(toForm(company));
    setSaveError('');
    setNotice('');
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!company?.companyId || !canSubmit) return;

    setSaveError('');
    setNotice('');

    const companyNm = String(form.companyNm ?? '').trim();
    if (!companyNm) {
      setSaveError('회사명은 필수 항목입니다.');
      return;
    }

    if (hasInvalidEmail(form.companyEmail)) {
      setSaveError('이메일 형식이 올바르지 않습니다.');
      return;
    }

    setSaving(true);
    try {
      const body = {
        companyNm,
        companyCeo: trimOrNull(form.companyCeo),
        businessNo: trimOrNull(form.businessNo),
        companyTel: trimOrNull(form.companyTel),
        companyEmail: trimOrNull(form.companyEmail),
        companyAddr: trimOrNull(form.companyAddr),
      };

      const payload = await adminApi.updateCompanyInfo(company.companyId, body);
      const normalized = normalizeCompany(payload) ?? {
        ...company,
        ...body,
      };

      applyCompany(normalized);
      setNotice('회사 정보가 저장되었습니다.');
    } catch (error) {
      setSaveError(
        error?.message ||
          '저장 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={styles.wrap}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>회사 정보</h2>
          <p className={styles.subtitle}>
            현재 등록된 회사 정보 1건을 조회하고 수정할 수 있습니다.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.ghostButton}
            onClick={load}
            disabled={loading || saving}
          >
            새로고침
          </button>
        </div>
      </header>

      <div className={styles.statusRow} aria-live="polite">
        {loading ? '회사 정보 데이터를 불러오는 중입니다.' : ''}
        {!loading && notice ? notice : ''}
      </div>

      {fetchError ? (
        <div className={styles.errorBox} role="alert">
          <p>{fetchError}</p>
          <button
            type="button"
            className={styles.ghostButton}
            onClick={load}
            disabled={loading || saving}
          >
            다시 시도
          </button>
        </div>
      ) : null}

      {!fetchError && (
        <form
          id="admin-company-form"
          className={styles.form}
          onSubmit={onSubmit}
        >
          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>
              Company ID:{' '}
              <strong>
                {company?.companyId ? `#${company.companyId}` : '-'}
              </strong>
            </span>
            <span className={styles.metaLabel}>
              변경 상태: <strong>{isDirty ? '수정됨' : '변경 없음'}</strong>
            </span>
          </div>

          <div className={styles.grid}>
            <label className={styles.field} htmlFor="companyNm">
              <span>회사명 *</span>
              <input
                id="companyNm"
                name="companyNm"
                value={form.companyNm}
                onChange={onInput('companyNm')}
                placeholder="회사명을 입력하세요"
                required
                autoComplete="organization"
              />
            </label>

            <label className={styles.field} htmlFor="companyCeo">
              <span>대표자명</span>
              <input
                id="companyCeo"
                name="companyCeo"
                value={form.companyCeo}
                onChange={onInput('companyCeo')}
                placeholder="대표자명을 입력하세요"
              />
            </label>

            <label className={styles.field} htmlFor="businessNo">
              <span>사업자번호</span>
              <input
                id="businessNo"
                name="businessNo"
                value={form.businessNo}
                onChange={onInput('businessNo')}
                placeholder="예: 123-45-67890"
                inputMode="numeric"
              />
            </label>

            <label className={styles.field} htmlFor="companyTel">
              <span>대표 연락처</span>
              <input
                id="companyTel"
                name="companyTel"
                value={form.companyTel}
                onChange={onInput('companyTel')}
                placeholder="예: 02-1234-5678"
                inputMode="tel"
                autoComplete="tel"
              />
            </label>

            <label className={styles.field} htmlFor="companyEmail">
              <span>대표 이메일</span>
              <input
                id="companyEmail"
                name="companyEmail"
                type="email"
                value={form.companyEmail}
                onChange={onInput('companyEmail')}
                placeholder="example@company.com"
                autoComplete="email"
              />
            </label>

            <label
              className={`${styles.field} ${styles.fieldWide}`}
              htmlFor="companyAddr"
            >
              <span>회사 주소</span>
              <textarea
                id="companyAddr"
                name="companyAddr"
                value={form.companyAddr}
                onChange={onInput('companyAddr')}
                placeholder="회사 주소를 입력하세요"
                rows={3}
              />
            </label>
          </div>

          {saveError ? (
            <div className={styles.errorBox} role="alert">
              <p>{saveError}</p>
            </div>
          ) : null}

          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.ghostButton}
              onClick={onReset}
              disabled={!isDirty || saving || loading}
            >
              변경 취소
            </button>
            <button
              type="submit"
              className={styles.primaryButton}
              disabled={!canSubmit}
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
