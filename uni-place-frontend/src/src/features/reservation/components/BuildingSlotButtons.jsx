import React from 'react';

/**
 * buildings: [{ buildingId, buildingNm, ... }]
 * selectedId: number | null
 */
export default function BuildingSlotButtons({
  buildings = [],
  selectedId,
  onSelect,
}) {
  if (!buildings.length) return <div style={{ opacity: 0.7 }}>빌딩 없음</div>;

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {buildings.map((b) => {
        const id = b.buildingId;
        const active = Number(selectedId) === Number(id);
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect?.(b)}
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid #ddd',
              background: active ? '#111' : '#fff',
              color: active ? '#fff' : '#111',
              cursor: 'pointer',
            }}
            title={b.buildingNm ?? ''}
          >
            {b.buildingNm ?? `빌딩#${id}`}
          </button>
        );
      })}
    </div>
  );
}
