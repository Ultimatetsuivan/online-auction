import { useState, useRef, useEffect } from 'react';

const CYRILLIC = [
  'А','Б','В','Г','Д','Е','Ё',
  'Ж','З','И','Й','К','Л','М',
  'Н','О','Ө','П','Р','С','Т',
  'У','Ү','Ф','Х','Ц','Ч','Ш',
  'Щ','Ъ','Ы','Ь','Э','Ю','Я',
];

export const RegistrationNumberInput = ({ value = '', onChange, error }) => {
  const letter1 = value[0] || '';
  const letter2 = value[1] || '';
  const digits  = value.slice(2);

  const [activePicker, setActivePicker] = useState(null); // 'l1' | 'l2' | null
  const digitsRef   = useRef(null);
  const containerRef = useRef(null);

  // Close picker on outside click
  useEffect(() => {
    const handle = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setActivePicker(null);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const emit = (l1, l2, d) => onChange(l1 + l2 + d);

  const handleLetterPick = (letter) => {
    if (activePicker === 'l1') {
      emit(letter, letter2, digits);
      setActivePicker('l2');
    } else {
      emit(letter1, letter, digits);
      setActivePicker(null);
      setTimeout(() => digitsRef.current?.focus(), 50);
    }
  };

  const handleDigits = (e) => {
    const d = e.target.value.replace(/\D/g, '').slice(0, 8);
    emit(letter1, letter2, d);
  };

  const btnStyle = (selected, active) => ({
    width: 48,
    height: 48,
    border: `2px solid ${active ? '#3b82f6' : selected ? '#3b82f6' : '#e2e8f0'}`,
    borderRadius: 10,
    background: selected ? '#3b82f6' : active ? '#eff6ff' : '#f8fafc',
    color: selected ? '#fff' : '#64748b',
    fontSize: 18,
    fontWeight: 700,
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'all 0.15s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  });

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          type="button"
          style={btnStyle(!!letter1, activePicker === 'l1')}
          onClick={() => setActivePicker(activePicker === 'l1' ? null : 'l1')}
        >
          {letter1 || <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.4 }}>?</span>}
        </button>

        <button
          type="button"
          style={btnStyle(!!letter2, activePicker === 'l2')}
          onClick={() => setActivePicker(activePicker === 'l2' ? null : 'l2')}
        >
          {letter2 || <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.4 }}>?</span>}
        </button>

        <input
          ref={digitsRef}
          type="text"
          inputMode="numeric"
          value={digits}
          onChange={handleDigits}
          placeholder="Регистрийн дугаар"
          maxLength={8}
          style={{
            flex: 1,
            height: 48,
            padding: '0 14px',
            border: `1.5px solid ${error ? '#ef4444' : '#e2e8f0'}`,
            borderRadius: 10,
            fontSize: 15,
            color: '#0f172a',
            background: '#fff',
            outline: 'none',
            letterSpacing: digits ? '0.1em' : 0,
          }}
          onFocus={e => e.target.style.borderColor = '#3b82f6'}
          onBlur={e => e.target.style.borderColor = error ? '#ef4444' : '#e2e8f0'}
        />
      </div>

      {activePicker && (
        <div style={{
          position: 'absolute',
          top: 56,
          left: 0,
          zIndex: 200,
          background: '#fff',
          border: '1.5px solid #e2e8f0',
          borderRadius: 16,
          padding: '14px 12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          width: 322,
        }}>
          <p style={{
            textAlign: 'center',
            fontSize: 13,
            fontWeight: 700,
            color: '#3b82f6',
            margin: '0 0 12px',
          }}>
            {activePicker === 'l1' ? 'Эхний үсгийг сонгоно уу' : 'Хоёр дах үсгийг сонгоно уу'}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5 }}>
            {CYRILLIC.map(letter => {
              const isCurrent = activePicker === 'l1' ? letter === letter1 : letter === letter2;
              return (
                <button
                  key={letter}
                  type="button"
                  onClick={() => handleLetterPick(letter)}
                  style={{
                    padding: '8px 0',
                    border: `1.5px solid ${isCurrent ? '#3b82f6' : '#e2e8f0'}`,
                    borderRadius: 8,
                    background: isCurrent ? '#eff6ff' : '#fff',
                    fontSize: 14,
                    fontWeight: 600,
                    color: isCurrent ? '#3b82f6' : '#0f172a',
                    cursor: 'pointer',
                    transition: 'all 0.1s',
                  }}
                  onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.background = '#f8fafc'; }}
                  onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.background = '#fff'; }}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
