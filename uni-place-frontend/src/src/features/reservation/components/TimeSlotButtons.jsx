import React from 'react';

/**
 * slots: [{ label, startAt, endAt }]
 * selectedKey: string (startAt)
 */
export default function TimeSlotButtons({ slots = [], selectedKey, onSelect }) {
  if (!slots.length)
    return <div style={{ opacity: 0.7 }}>예약 가능 슬롯 없음</div>;

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {slots.map((s) => {
        const key = String(s.startAt);
        const active = selectedKey === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect?.(s)}
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid #ddd',
              background: active ? '#111' : '#fff',
              color: active ? '#fff' : '#111',
              cursor: 'pointer',
            }}
            title={`${s.startAt} ~ ${s.endAt}`}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
