'use client';

import { Sidebar } from '@/components/layout/sidebar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  Filter,
  AlertCircle,
  Clock,
  CheckCircle2,
  RefreshCw,
  MoreHorizontal,
  Mail,
  TrendingUp,
  Building2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useInvoices } from '@/hooks/use-invoices';
import { useActiveCompany } from '@/hooks/use-active-company';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';

export default function InvoicesPage() {
  const { activeCompanyId } = useActiveCompany();
  const { invoices, isLoading, error, reload } = useInvoices(activeCompanyId);
  const [searchQuery, setSearchQuery] = useState('');

  const overdueTotal = invoices
    .filter((i) => i.status === 'Vencida')
    .reduce((sum, i) => sum + i.total, 0);

  const pendingTotal = invoices
    .filter((i) => i.status === 'Pendiente')
    .reduce((sum, i) => sum + i.total, 0);

  const paidTotal = invoices
    .filter((i) => i.status === 'Pagada')
    .reduce((sum, i) => sum + i.total, 0);

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.cardName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.docNum.toString().includes(searchQuery) ||
      inv.cardCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-8">
        <PageHeader
          title="Ledger de Facturación"
          description="Monitoreo de cuentas por cobrar desde SAP B1."
          icon={Building2}
          actions={
            <>
              <Button onClick={reload} disabled={isLoading} variant="outline" className="gap-2">
                <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
                {isLoading ? 'Cargando...' : 'Recargar'}
              </Button>
              <Button className="bg-accent hover:bg-accent/90">Acción de Cobro Masivo</Button>
            </>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            label="Vencido"
            value={`$${overdueTotal.toLocaleString()}`}
            icon={AlertCircle}
            tone="red"
          />
          <StatCard
            label="Pendiente"
            value={`$${pendingTotal.toLocaleString()}`}
            icon={Clock}
            tone="orange"
          />
          <StatCard
            label="Pagado"
            value={`$${paidTotal.toLocaleString()}`}
            icon={CheckCircle2}
            tone="green"
          />
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-none">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente, ID de factura..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Filtros
            </Button>
          </div>

          {isLoading ? (
            <div className="py-20 text-center">
              <div className="flex flex-col items-center gap-3">
                <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                <p className="text-muted-foreground font-medium">Cargando facturas desde SAP...</p>
              </div>
            </div>
          ) : error ? (
            <div className="py-20 text-center">
              <div className="flex flex-col items-center gap-3">
                <AlertCircle className="w-8 h-8 text-red-500" />
                <p className="text-red-600 font-medium">{error}</p>
                <Button onClick={reload} variant="outline" size="sm" className="gap-2">
                  <RefreshCw className="w-4 h-4" /> Reintentar
                </Button>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>ID Factura</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Fecha Venc.</TableHead>
                  <TableHead>Antigüedad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-20 text-center text-muted-foreground italic"
                    >
                      {searchQuery
                        ? 'No se encontraron facturas que coincidan con la búsqueda.'
                        : 'No hay facturas para esta empresa.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((inv) => (
                    <TableRow key={inv.docEntry} className="group">
                      <TableCell className="font-mono font-medium text-primary">
                        {inv.docNum}
                      </TableCell>
                      <TableCell className="font-semibold">{inv.cardName}</TableCell>
                      <TableCell className="font-mono font-bold">
                        ${inv.total.toLocaleString()}{' '}
                        <span className="text-[10px] text-muted-foreground">{inv.currency}</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{inv.dueDate}</TableCell>
                      <TableCell>
                        {inv.daysOverdue > 0 ? (
                          <span className="text-red-600 font-semibold">{inv.daysOverdue} d</span>
                        ) : (
                          <span className="text-green-600">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            inv.status === 'Vencida'
                              ? 'destructive'
                              : inv.status === 'Pagada'
                                ? 'secondary'
                                : 'outline'
                          }
                          className={
                            inv.status === 'Pagada'
                              ? 'bg-green-100 text-green-700 hover:bg-green-100'
                              : ''
                          }
                        >
                          {inv.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2">
                              <Mail className="w-4 h-4" /> Reenviar Factura
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                              <TrendingUp className="w-4 h-4" /> Forzar Cobranza IA
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </main>
    </div>
  );
}
