import { useState, KeyboardEvent, useRef } from 'react';

interface Props {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

export function TagInput({ values, onChange, placeholder = 'Type and press Enter…' }: Props) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function add(val: string) {
    const trimmed = val.trim().replace(/,$/, '');
    if (trimmed && !values.includes(trimmed)) onChange([...values, trimmed]);
    setInput('');
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(input); }
    else if (e.key === 'Backspace' && input === '' && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  }

  return (
    <div className="tag-input-container" onClick={() => inputRef.current?.focus()}>
      {values.map(v => (
        <span key={v} className="tag">
          {v}
          <button type="button" onClick={e => { e.stopPropagation(); onChange(values.filter(x => x !== v)); }}>×</button>
        </span>
      ))}
      <input
        ref={inputRef}
        className="tag-input"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={onKey}
        onBlur={() => { if (input.trim()) add(input); }}
        placeholder={values.length === 0 ? placeholder : ''}
      />
    </div>
  );
}
