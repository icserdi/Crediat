'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  RefreshCw,
  Building2,
  FileText,
  Gauge,
  HandCoins,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { useCreditReport } from '@/hooks/use-credit-report';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';

const statusBadge: Record<string, string> = {
  pendiente_autorizacion: 'bg-orange-50 text-orange-700 border-orange-200',
  autorizado: 'bg-green-50 text-green-700 border-green-200',
  rechazado: 'bg-red-50 text-red-700 border-red-200',
  activo: 'bg-blue-50 text-blue-700 border-blue-200',
};

const statusLabel: Record<string, string> = {
  pendiente_autorizacion: 'Pendiente autorización',
  autorizado: 'Autorizado',
  rechazado: 'Rechazado',
  activo: 'Activo',
};

export default function CreditReportPage() {
  const { stats, accounts, isLoading, reload } = useCreditReport();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8">
        <PageHeader
          title="Reporte del Ciclo de Crédito"
          description="Solicitud → pre-calificación → otorgamiento → expediente → cobranza."
          icon={Building2}
          actions={
            <Button onClick={reload} disabled={isLoading} variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" /> Recargar
            </Button>
          }
        />

        {isLoading || !stats ? (
          <div className="p-20 text-center text-muted-foreground italic font-medium">
            Cargando reporte...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                label="Solicitudes"
                value={String(stats.totalApplications)}
                icon={FileText}
              />
              <StatCard
                label="Pre-calificadas"
                value={String(stats.totalPrequalified)}
                icon={Gauge}
                tone="orange"
              />
              <StatCard
                label="Autorizadas"
                value={String(stats.totalAuthorized)}
                icon={CheckCircle2}
                tone="green"
              />
              <StatCard
                label="Rechazadas"
                value={String(stats.totalRejected)}
                icon={XCircle}
                tone="red"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                label="Créditos activos"
                value={String(stats.totalActive)}
                icon={HandCoins}
              />
              <StatCard
                label="Monto solicitado"
                value={`$${stats.totalRequestedAmount.toLocaleString()}`}
                icon={HandCoins}
              />
              <StatCard
                label="Aprobaciones pendientes"
                value={String(stats.pendingApprovals)}
                icon={AlertTriangle}
                tone="orange"
              />
              <StatCard
                label="Docs por vencer/vencidos"
                value={String(stats.expiringDocuments)}
                icon={AlertTriangle}
                tone="red"
              />
            </div>

            <Card className="border-none shadow-md rounded-2xl bg-white overflow-hidden">
              <CardContent className="p-0">
                {accounts.length === 0 ? (
                  <div className="p-20 text-center text-muted-foreground italic font-medium">
                    No hay cuentas de crédito registradas.
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-muted/10">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="font-bold">Cuenta</TableHead>
                        <TableHead className="font-bold">Solicitante</TableHead>
                        <TableHead className="font-bold">CardCode</TableHead>
                        <TableHead className="font-bold">Monto</TableHead>
                        <TableHead className="font-bold">Plazo</TableHead>
                        <TableHead className="font-bold">Estatus</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accounts.map((acc) => (
                        <TableRow
                          key={acc.id}
                          className="hover:bg-primary/5 transition-colors border-primary/5"
                        >
                          <TableCell className="font-mono font-bold text-primary">
                            {acc.accountNumber}
                          </TableCell>
                          <TableCell className="font-semibold">{acc.applicantName}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {acc.cardCode || '-'}
                          </TableCell>
                          <TableCell className="font-mono font-bold">
                            ${acc.requestedAmount.toLocaleString()}
                          </TableCell>
                          <TableCell>{acc.termMonths} meses</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={statusBadge[acc.status] || 'bg-slate-50'}
                            >
                              {statusLabel[acc.status] || acc.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
