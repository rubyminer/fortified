interface Props { width?: string | number; height?: string | number; style?: React.CSSProperties; }

export function Skeleton({ width = '100%', height = 20, style }: Props) {
  return (
    <div className="skeleton" style={{ width, height: typeof height === 'number' ? height : height, borderRadius: 4, ...style }} />
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <table className="data-table">
      <thead>
        <tr>{Array.from({ length: cols }).map((_, i) => (
          <th key={i}><Skeleton height={12} width={60 + (i % 3) * 20} /></th>
        ))}</tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, r) => (
          <tr key={r}>{Array.from({ length: cols }).map((_, c) => (
            <td key={c}><Skeleton height={14} width={50 + ((r + c) % 4) * 30} /></td>
          ))}</tr>
        ))}
      </tbody>
    </table>
  );
}

export function SkeletonCard() {
  return (
    <div className="stat-card">
      <Skeleton height={10} width={80} style={{ marginBottom: 12 }} />
      <Skeleton height={32} width={60} style={{ marginBottom: 8 }} />
      <Skeleton height={10} width={100} />
    </div>
  );
}
