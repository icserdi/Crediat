'use client';

import { useEffect } from 'react';
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
import { RefreshCw, AlertTriangle, Building2 } from 'lucide-react';
import Link from 'next/link';
import { useExpediente } from '@/hooks/use-expediente';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { DOCUMENT_TYPE_LABELS } from '@/lib/credit/expediente-types';

const validityBadge: Record<string, { label: string; className: string }> = {
  por_vencer: { label: 'Por vencer', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  vencido: { label: 'Vencido', className: 'bg-red-50 text-red-700 border-red-200' },
};

export default function CreditAlertasPage() {
  const { alertas, isLoadingAlertas, alertasError, loadAlertas } = useExpediente();

  useEffect(() => {
    loadAlertas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const vencidos = alertas.filter((a) => a.validity === 'vencido').length;
  const porVencer = alertas.filter((a) => a.validity === 'por_vencer').length;

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8">
        <PageHeader
          title="Alertas de Expediente"
          description="Documentos por vencer o vencidos que requieren renovación."
          icon={Building2}
          actions={
            <Button
              onClick={loadAlertas}
              disabled={isLoadingAlertas}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Recargar
            </Button>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <StatCard
            label="Por vencer"
            value={String(porVencer)}
            icon={AlertTriangle}
            tone="orange"
          />
          <StatCard label="Vencidos" value={String(vencidos)} icon={AlertTriangle} tone="red" />
        </div>

        <Card className="border-none shadow-md rounded-2xl bg-white overflow-hidden">
          <CardContent className="p-0">
            {isLoadingAlertas ? (
              <div className="p-20 text-center text-muted-foreground italic font-medium">
                Cargando alertas...
              </div>
            ) : alertasError ? (
              <div className="p-20 text-center text-red-600 font-medium">{alertasError}</div>
            ) : alertas.length === 0 ? (
              <div className="p-20 text-center text-muted-foreground italic font-medium">
                No hay documentos por vencer o vencidos. ¡Expediente al día!
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-bold">Solicitante</TableHead>
                    <TableHead className="font-bold">Cuenta</TableHead>
                    <TableHead className="font-bold">Documento</TableHead>
                    <TableHead className="font-bold">Expiración</TableHead>
                    <TableHead className="font-bold">Estado</TableHead>
                    <TableHead className="font-bold text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alertas.map((alerta) => {
                    const v = validityBadge[alerta.validity] || validityBadge.por_vencer;
                    return (
                      <TableRow
                        key={alerta.id}
                        className="hover:bg-primary/5 transition-colors border-primary/5"
                      >
                        <TableCell className="font-semibold text-primary">
                          {alerta.applicantName}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {alerta.accountNumber}
                        </TableCell>
                        <TableCell className="text-sm">
                          {DOCUMENT_TYPE_LABELS[alerta.documentType] || alerta.documentType}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(alerta.expiresAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={v.className}>
                            {v.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/credit/expedientes/${alerta.creditAccountId}`}>
                            <Button variant="outline" size="sm">
                              Renovar
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
