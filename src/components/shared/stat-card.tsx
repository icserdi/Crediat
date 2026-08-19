import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: 'default' | 'red' | 'orange' | 'green';
  hint?: string;
  className?: string;
}

const toneIconBg = {
  default: 'bg-primary/10 text-primary',
  red: 'bg-red-100 text-red-600',
  orange: 'bg-orange-100 text-orange-600',
  green: 'bg-green-100 text-green-600',
};

/**
 * Tarjeta de estadística reutilizable usada en dashboard e invoices.
 * Centraliza el estilo repetido de los bloques de KPIs.
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'default',
  hint,
  className,
}: StatCardProps) {
  return (
    <Card className={cn('border-none shadow-sm', className)}>
      <CardContent className="p-6 flex items-center gap-4">
        <div className={cn('p-3 rounded-full shrink-0', toneIconBg[tone])}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider truncate">
            {label}
          </p>
          <h3 className="text-2xl font-headline font-bold text-primary truncate">{value}</h3>
          {hint && <p className="text-xs text-muted-foreground truncate">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
