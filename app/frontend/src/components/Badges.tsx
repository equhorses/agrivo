import { cn } from '@/lib/utils';

interface BadgeProps {
  className?: string;
}

export function VerifiedBadge({ className }: BadgeProps) {
  return (
    <div className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-300', className)} title="Profesional Verificado">
      <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none">
        <circle cx="10" cy="10" r="9" fill="#059669" />
        <path d="M6 10l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-xs font-semibold text-emerald-800">Verificado</span>
    </div>
  );
}

export function TopProBadge({ className }: BadgeProps) {
  return (
    <div className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 border border-amber-300', className)} title="Top Pro - Profesional Destacado">
      <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none">
        <polygon
          points="10,1 12.5,7 19,7.5 14,12 15.5,18.5 10,15 4.5,18.5 6,12 1,7.5 7.5,7"
          fill="#D97706"
          stroke="#B45309"
          strokeWidth="0.5"
        />
        <circle cx="10" cy="10" r="4" fill="#FBBF24" />
        <path d="M8 10l1.5 1.5 3-3" stroke="#92400E" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-xs font-semibold text-amber-800">Top Pro</span>
    </div>
  );
}

export function PlanBadge({ plan }: { plan?: string }) {
  if (plan === 'enterprise') return <TopProBadge />;
  if (plan === 'pro') return <VerifiedBadge />;
  return null;
}