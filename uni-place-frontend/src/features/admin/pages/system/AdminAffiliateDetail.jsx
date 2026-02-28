import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { apiJson } from '../../../../app/http/request';

function toNumOrNull(v) {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toIsoOrNull(v) {
  // input type="datetime-local" => "YYYY-MM-DDTHH:mm"
  if (!v) return null;
  // seconds 없이 들어오면 그대로 보내도 Jackson이 파싱하는 설정일 수 있으나,
  // 안정적으로 ":00" 붙여주기
  if (v.length === 16) return `${v}:00`;
  return v;
}

function fromIsoToLocalInput(v) {
  if (!v) return '';
  // "2026-02-28T12:34:56" -> "2026-02-28T12:34"
  if (typeof v === 'string' && v.includes('T')) return v.slice(0, 16);
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  } catch {
    return '';
  }
}

export default function AdminAffiliateDetail() {
  const navigate = useNavigate();
  const { affiliateId } = useParams();

  const isCreate = useMemo(
    () => affiliateId === 'new' || !affiliateId,
    [affiliateId]
  );
  const idNum = useMemo(
    () => (affiliateId && affiliateId !== 'new' ? Number(affiliateId) : null),
    [affiliateId]
  );

  const [loading, setLoading] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    buildingId: '',
    affiliateNm: '',
    affiliateCeo: '',
    affiliateTel: '',
    businessNo: '',
    affiliateFax: '',
    affiliateEmail: '',
    affiliateAddr: '',
    affiliateStartAt: '',
    affiliateEndAt: '',
    code: '',
    affiliateDesc: '',
    affiliateSt: 'planned',
  });

  const statusOptions = [
    { value: 'planned', label: 'planned(예정)' },
    { value: 'progress', label: 'progress(진행)' },
    { value: 'ended', label: 'ended(종료)' },
  ];

  const fetchDetail = async () => {
    if (!idNum) return;
    setLoading(true);
    setError('');
    try {
      const res = await apiJson.get(`/admin/affiliates/${idNum}`);
      const d = res?.data?.data;

      setForm({
        buildingId: d?.buildingId ?? '',
        affiliateNm: d?.affiliateNm ?? '',
        affiliateCeo: d?.affiliateCeo ?? '',
        affiliateTel: d?.affiliateTel ?? '',
        businessNo: d?.businessNo ?? '',
        affiliateFax: d?.affiliateFax ?? '',
        affiliateEmail: d?.affiliateEmail ?? '',
        affiliateAddr: d?.affiliateAddr ?? '',
        affiliateStartAt: fromIsoToLocalInput(d?.affiliateStartAt),
        affiliateEndAt: fromIsoToLocalInput(d?.affiliateEndAt),
        code: d?.code ?? '',
        affiliateDesc: d?.affiliateDesc ?? '',
        affiliateSt: d?.affiliateSt ?? 'planned',
      });
    } catch (e) {
      setError(e?.message || '상세 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isCreate) fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCreate, idNum]);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const validateCreate = () => {
    // CreateRequest: buildingId, affiliateNm 필수
    if (!String(form.buildingId).trim()) return 'buildingId는 필수입니다.';
    if (!String(form.affiliateNm).trim())
      return 'affiliateNm(제휴업체명)은 필수입니다.';
    return '';
  };

  const onSave = async () => {
    setError('');
    const msg = isCreate ? validateCreate() : '';
    if (msg) {
      setError(msg);
      return;
    }

    setSaving(true);
    try {
      if (isCreate) {
        // POST /admin/affiliates : AffiliateCreateRequest
        const body = {
          buildingId: toNumOrNull(form.buildingId),
          affiliateNm: form.affiliateNm?.trim(),
          affiliateCeo: form.affiliateCeo?.trim() || null,
          affiliateTel: form.affiliateTel?.trim() || null,
          businessNo: form.businessNo?.trim() || null,
          affiliateFax: form.affiliateFax?.trim() || null,
          affiliateEmail: form.affiliateEmail?.trim() || null,
          affiliateAddr: form.affiliateAddr?.trim() || null,
          affiliateStartAt: toIsoOrNull(form.affiliateStartAt),
          affiliateEndAt: toIsoOrNull(form.affiliateEndAt),
          code: form.code?.trim() || null,
          affiliateDesc: form.affiliateDesc?.trim() || null,
          affiliateSt: form.affiliateSt || null,
        };

        const res = await apiJson.post('/admin/affiliates', body);
        const created = res?.data?.data;
        const newId = created?.affiliateId;

        if (newId) navigate(`/admin/system/affiliates/${newId}`);
        else navigate('/admin/system/affiliates');
      } else {
        // PATCH /admin/affiliates/{id} : AffiliateUpdateRequest
        // 서비스에서 "" => null 정책 적용하니까, 프론트도 "빈 값이면 보내지 않기"가 제일 깔끔.
        const body = {};

        const push = (key, value) => {
          if (value === undefined) return;
          body[key] = value;
        };

        // 숫자/enum은 값 있으면
        if (String(form.buildingId).trim())
          push('buildingId', toNumOrNull(form.buildingId));

        // 문자열은 trim 후, 빈문자열이면 아예 보내지 않기
        const str = (v) => {
          const t = (v ?? '').trim();
          return t ? t : undefined;
        };

        push('affiliateNm', str(form.affiliateNm));
        push('affiliateCeo', str(form.affiliateCeo));
        push('affiliateTel', str(form.affiliateTel));
        push('businessNo', str(form.businessNo));
        push('affiliateFax', str(form.affiliateFax));
        push('affiliateEmail', str(form.affiliateEmail));
        push('affiliateAddr', str(form.affiliateAddr));
        push('code', str(form.code));
        push('affiliateDesc', str(form.affiliateDesc));

        // datetime-local은 값 있을 때만
        if (form.affiliateStartAt)
          push('affiliateStartAt', toIsoOrNull(form.affiliateStartAt));
        if (form.affiliateEndAt)
          push('affiliateEndAt', toIsoOrNull(form.affiliateEndAt));

        // 상태는 값 있을 때만(기본 planned)
        if (form.affiliateSt) push('affiliateSt', form.affiliateSt);

        await apiJson.patch(`/admin/affiliates/${idNum}`, body);
        await fetchDetail();
        alert('저장되었습니다.');
      }
    } catch (e) {
      setError(e?.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <h2 style={{ margin: 0 }}>
          {isCreate ? '제휴 등록' : `제휴 상세 (#${idNum})`}
        </h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => navigate('/admin/system/affiliates')}
          >
            목록
          </button>
          <button type="button" onClick={onSave} disabled={saving || loading}>
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>

      {loading && <div>로딩 중...</div>}
      {!loading && error && (
        <div style={{ color: 'crimson', marginBottom: 12 }}>{error}</div>
      )}

      {!loading && (
        <div
          style={{
            border: '1px solid #ddd',
            borderRadius: 8,
            padding: 16,
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 12,
          }}
        >
          <div>
            <label style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>
              건물 ID *
            </label>
            <input
              value={form.buildingId}
              onChange={set('buildingId')}
              inputMode="numeric"
              placeholder="예: 1"
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>
              상태
            </label>
            <select
              value={form.affiliateSt}
              onChange={set('affiliateSt')}
              style={{ width: '100%' }}
            >
              {statusOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>
              제휴업체명 *
            </label>
            <input
              value={form.affiliateNm}
              onChange={set('affiliateNm')}
              placeholder="업체명"
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>
              대표자
            </label>
            <input
              value={form.affiliateCeo}
              onChange={set('affiliateCeo')}
              placeholder="대표자명"
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>
              전화
            </label>
            <input
              value={form.affiliateTel}
              onChange={set('affiliateTel')}
              placeholder="010-..."
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>
              사업자번호
            </label>
            <input
              value={form.businessNo}
              onChange={set('businessNo')}
              placeholder="000-00-00000"
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>
              팩스
            </label>
            <input
              value={form.affiliateFax}
              onChange={set('affiliateFax')}
              placeholder="02-..."
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>
              이메일
            </label>
            <input
              value={form.affiliateEmail}
              onChange={set('affiliateEmail')}
              placeholder="example@domain.com"
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>
              제휴 분류(code)
            </label>
            <input
              value={form.code}
              onChange={set('code')}
              placeholder="common_code.code"
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>
              제휴 시작일
            </label>
            <input
              type="datetime-local"
              value={form.affiliateStartAt}
              onChange={set('affiliateStartAt')}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>
              제휴 종료일
            </label>
            <input
              type="datetime-local"
              value={form.affiliateEndAt}
              onChange={set('affiliateEndAt')}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>
              주소
            </label>
            <input
              value={form.affiliateAddr}
              onChange={set('affiliateAddr')}
              placeholder="주소"
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>
              제휴 내용
            </label>
            <textarea
              value={form.affiliateDesc}
              onChange={set('affiliateDesc')}
              placeholder="제휴 설명/혜택/유의사항 등"
              rows={6}
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          <div style={{ gridColumn: '1 / -1', fontSize: 12, color: '#666' }}>
            * 수정(PATCH)은 “값이 있는 항목만” 서버로 보내고 있어. (서버가 빈
            문자열을 null 처리하는 정책과도 잘 맞음)
          </div>
        </div>
      )}
    </div>
  );
}
