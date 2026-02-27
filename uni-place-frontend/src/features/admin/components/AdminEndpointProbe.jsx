import React, { useCallback, useEffect, useMemo, useState } from 'react';

function guessCount(data) {
  if (Array.isArray(data)) return data.length;
  if (data && Array.isArray(data.content)) return data.content.length;
  if (data && data.notifications && Array.isArray(data.notifications.content)) {
    return data.notifications.content.length;
  }
  return data ? 1 : 0;
}

export function AdminEndpointListProbe({
  title,
  fetcher,
  controls = [],
  initialFilters = {},
  normalizeFilters,
}) {
  const [filters, setFilters] = useState(initialFilters);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const prepared = useMemo(
    () => (normalizeFilters ? normalizeFilters(filters) : filters),
    [filters, normalizeFilters]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetcher(prepared);
      setData(result);
    } catch (e) {
      setError(e?.message || 'Failed to load endpoint');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [fetcher, prepared]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <h2 style={{ margin: 0 }}>{title}</h2>
      {controls.length ? (
        <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
          {controls.map((c) => (
            <label key={c.name} style={{ display: 'grid', gap: 4 }}>
              <span style={{ fontSize: 12, color: '#6b7280' }}>{c.label}</span>
              <input
                type={c.type || 'text'}
                value={filters[c.name] ?? ''}
                placeholder={c.placeholder || ''}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, [c.name]: e.target.value }))
                }
                style={{ height: 34, padding: '0 10px' }}
              />
            </label>
          ))}
        </div>
      ) : null}

      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button type="button" onClick={load} disabled={loading}>
          {loading ? 'Loading...' : 'Fetch endpoint'}
        </button>
        <span style={{ fontSize: 12, color: '#6b7280', alignSelf: 'center' }}>
          Count: {guessCount(data)}
        </span>
      </div>

      {error ? (
        <div style={{ marginTop: 10, color: '#b91c1c', fontSize: 13 }}>{error}</div>
      ) : null}

      <pre
        style={{
          marginTop: 10,
          maxHeight: 420,
          overflow: 'auto',
          background: '#f7f8fa',
          padding: 10,
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          fontSize: 12,
        }}
      >
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

export function AdminEndpointDetailProbe({
  title,
  fetcher,
  idLabel = 'ID',
  initialId = '',
  parseId,
}) {
  const [id, setId] = useState(initialId);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const value = parseId ? parseId(id) : id;
    if (value === '' || value === null || value === undefined) {
      setError(`${idLabel} is required`);
      setData(null);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await fetcher(value);
      setData(result);
    } catch (e) {
      setError(e?.message || 'Failed to load endpoint');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [fetcher, id, idLabel, parseId]);

  return (
    <div>
      <h2 style={{ margin: 0 }}>{title}</h2>
      <div style={{ marginTop: 12, display: 'grid', gap: 6 }}>
        <span style={{ fontSize: 12, color: '#6b7280' }}>{idLabel}</span>
        <input
          value={id}
          onChange={(e) => setId(e.target.value)}
          style={{ height: 34, padding: '0 10px' }}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button type="button" onClick={load} disabled={loading}>
          {loading ? 'Loading...' : 'Fetch endpoint'}
        </button>
      </div>

      {error ? (
        <div style={{ marginTop: 10, color: '#b91c1c', fontSize: 13 }}>{error}</div>
      ) : null}

      <pre
        style={{
          marginTop: 10,
          maxHeight: 420,
          overflow: 'auto',
          background: '#f7f8fa',
          padding: 10,
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          fontSize: 12,
        }}
      >
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
