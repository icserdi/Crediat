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
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, Building2 } from 'lucide-react';
import { useCreditApplications } from '@/hooks/use-credit-applications';
import { PageHeader } from '@/components/shared/page-header';
import type { CreditApplicationStatus } from '@/lib/credit/application';

const statusConfig: Record<CreditApplicationStatus, { label: string; className: string }> = {
  recibida: { label: 'Recibida', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  en_revision: {
    label: 'En revisión',
    className: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  aprobada: { label: 'Aprobada', className: 'bg-green-50 text-green-700 border-green-200' },
  rechazada: { label: 'Rechazada', className: 'bg-red-50 text-red-700 border-red-200' },
};

export default function CreditApplicationsPage() {
  const { applications, isLoading, error, reload } = useCreditApplications();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8">
        <PageHeader
          title="Solicitudes de Crédito"
          description="Revisión de solicitudes recibidas."
          icon={Building2}
          actions={
            <Button onClick={reload} disabled={isLoading} variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Recargar
            </Button>
          }
        />

        <Card className="border-none shadow-md rounded-2xl bg-white overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-20 text-center text-muted-foreground italic font-medium">
                Cargando solicitudes...
              </div>
            ) : error ? (
              <div className="p-20 text-center text-red-600 font-medium">{error}</div>
            ) : applications.length === 0 ? (
              <div className="p-20 text-center text-muted-foreground italic font-medium">
                No hay solicitudes de crédito registradas.
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-bold">Solicitante</TableHead>
                    <TableHead className="font-bold">Tipo</TableHead>
                    <TableHead className="font-bold">Ubicación</TableHead>
                    <TableHead className="font-bold">RFC</TableHead>
                    <TableHead className="font-bold">Contacto</TableHead>
                    <TableHead className="font-bold">Estatus</TableHead>
                    <TableHead className="font-bold">Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => {
                    const status = statusConfig[app.status] || statusConfig.recibida;
                    return (
                      <TableRow
                        key={app.id}
                        className="hover:bg-primary/5 transition-colors border-primary/5"
                      >
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-sm shadow-md">
                              {app.fullName[0]}
                            </div>
                            <span className="font-bold text-primary">{app.fullName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-medium">
                            {app.personType === 'fisica' ? 'Física' : 'Moral'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {app.city}, {app.state}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {app.rfc || '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <div>{app.email}</div>
                          <div className="text-xs">{app.phone}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={status.className}>
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(app.createdAt).toLocaleDateString()}
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
