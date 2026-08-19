import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  className?: string;
}

/**
 * Encabezado de página reutilizable. Centraliza el patrón repetido de
 * título + subtítulo + acciones que aparece en casi todas las páginas.
 */
export function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4',
        className
      )}
    >
      <div>
        <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary">{title}</h2>
        {description && (
          <div className="flex items-center gap-2 text-muted-foreground">
            {Icon && <Icon className="w-4 h-4 shrink-0" />}
            <p className="text-lg">{description}</p>
          </div>
        )}
      </div>
      {actions && <div className="flex gap-3">{actions}</div>}
    </div>
  );
}
