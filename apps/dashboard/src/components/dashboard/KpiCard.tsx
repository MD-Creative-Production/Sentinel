interface KpiCardProps {
  label: string;
  value: number | string;
  trend?: string;
  variant?: 'default' | 'danger' | 'success' | 'warning' | 'info';
}

const variantStyles: Record<NonNullable<KpiCardProps['variant']>, string> = {
  default: 'border-gray-800',
  danger: 'border-red-900/60 bg-red-950/20',
  success: 'border-emerald-900/60 bg-emerald-950/20',
  warning: 'border-yellow-900/60 bg-yellow-950/20',
  info: 'border-blue-900/60 bg-blue-950/20',
};

const valueStyles: Record<NonNullable<KpiCardProps['variant']>, string> = {
  default: 'text-white',
  danger: 'text-red-400',
  success: 'text-emerald-400',
  warning: 'text-yellow-400',
  info: 'text-blue-400',
};

export function KpiCard({ label, value, trend, variant = 'default' }: KpiCardProps) {
  return (
    <div
      className={`bg-gray-900 border rounded-xl p-5 flex flex-col gap-2 ${variantStyles[variant]}`}
      role="region"
      aria-label={label}
    >
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold tabular-nums ${valueStyles[variant]}`}>{value}</p>
      {trend && <p className="text-xs text-gray-500">{trend}</p>}
    </div>
  );
}
