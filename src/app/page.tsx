'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { KPICard } from '@/components/dashboard/kpi-card';
import {
  Banknote,
  CalendarClock,
  HandCoins,
  ShieldAlert,
  ShieldCheck,
  Users,
  Zap,
  TrendingUp,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useKpis } from '@/hooks/use-kpis';
import { useActiveCompany } from '@/hooks/use-active-company';

export default function Dashboard() {
  const { activeCompanyId } = useActiveCompany();
  const { data, isLoading, error, reload } = useKpis(activeCompanyId);

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            <p className="text-muted-foreground font-medium">Calculando KPIs desde SAP...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <p className="text-red-600 font-medium">{error}</p>
            <Button onClick={reload} variant="outline" size="sm" className="gap-2">
              <RefreshCw className="w-4 h-4" /> Reintentar
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-headline font-bold text-primary">
              Inteligencia Financiera
            </h1>
            <p className="text-muted-foreground text-lg">
              Desempeño de cobranza en tiempo real y modelos de riesgo predictivo.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className="bg-white px-3 py-1.5 gap-2 text-xs font-semibold border-primary/20"
            >
              <Zap className="w-3.5 h-3.5 text-accent" />
              Estado IA: Sincronizado
            </Badge>
            <Button onClick={reload} variant="outline" size="sm" className="gap-2">
              <RefreshCw className="w-4 h-4" /> Recargar
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <KPICard
            title="DSO (plazo de cobro)"
            value={data?.dso.value.toFixed(1) || '-'}
            description={data?.dso.description || ''}
            icon={CalendarClock}
          />
          <KPICard
            title="Tasa Morosidad"
            value={data ? `${data.morosidad.value.toFixed(1)}%` : '-'}
            description={data?.morosidad.description || ''}
            icon={ShieldAlert}
          />
          <KPICard
            title="Tasa Recuperación"
            value={data ? `${data.recuperacion.value.toFixed(1)}%` : '-'}
            description={data?.recuperacion.description || ''}
            icon={HandCoins}
          />
          <KPICard
            title="Rotación Cartera"
            value={data ? `${data.rotacion.value.toFixed(1)}x` : '-'}
            description={data?.rotacion.description || ''}
            icon={TrendingUp}
          />
          <KPICard
            title="Cumplimiento Promesa"
            value="--"
            description="Requiere escritura SAP (UDF)"
            icon={ShieldCheck}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-none shadow-md bg-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-headline text-xl flex items-center gap-2 text-primary">
                  <Banknote className="w-5 h-5 text-accent" />
                  Resumen de Cartera
                </CardTitle>
                <CardDescription>Datos consolidados desde SAP B1.</CardDescription>
              </div>
              <Badge className="bg-primary/5 text-primary border-primary/10">Tiempo Real</Badge>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 bg-muted/10 rounded-2xl border border-primary/5">
                  <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                    Total AR
                  </p>
                  <p className="text-3xl font-headline font-bold text-primary mt-2">
                    ${data?.totalAr.toLocaleString() || '-'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Cuentas por cobrar abiertas</p>
                </div>
                <div className="p-6 bg-muted/10 rounded-2xl border border-primary/5">
                  <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                    Deudores
                  </p>
                  <p className="text-3xl font-headline font-bold text-primary mt-2">
                    {data?.totalDebtors || '-'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Clientes activos en SAP</p>
                </div>
                <div className="p-6 bg-muted/10 rounded-2xl border border-primary/5">
                  <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                    Facturas Abiertas
                  </p>
                  <p className="text-3xl font-headline font-bold text-primary mt-2">
                    {data?.openInvoices || '-'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Documentos pendientes</p>
                </div>
                <div className="p-6 bg-muted/10 rounded-2xl border border-primary/5">
                  <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                    Compañía SAP
                  </p>
                  <p className="text-3xl font-headline font-bold text-primary mt-2 text-lg">
                    {data?.companyDb || '-'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Base de datos activa</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-white">
            <CardHeader>
              <CardTitle className="font-headline text-xl text-primary flex items-center gap-2">
                <Users className="w-5 h-5 text-accent" />
                Segmentación de Riesgo
              </CardTitle>
              <CardDescription>Clasificación automatizada por comportamiento.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                {
                  name: 'Riesgo Alto (Crítico)',
                  value: data?.riesgo.alto || 0,
                  color: 'bg-red-500',
                  score: Math.min(
                    100,
                    ((data?.riesgo.alto || 0) / Math.max(1, data?.totalDebtors || 1)) * 100
                  ),
                },
                {
                  name: 'Riesgo Medio (Alerta)',
                  value: data?.riesgo.medio || 0,
                  color: 'bg-orange-500',
                  score: Math.min(
                    100,
                    ((data?.riesgo.medio || 0) / Math.max(1, data?.totalDebtors || 1)) * 100
                  ),
                },
                {
                  name: 'Riesgo Bajo (Saludable)',
                  value: data?.riesgo.bajo || 0,
                  color: 'bg-green-500',
                  score: Math.min(
                    100,
                    ((data?.riesgo.bajo || 0) / Math.max(1, data?.totalDebtors || 1)) * 100
                  ),
                },
              ].map((segment) => (
                <div key={segment.name} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-semibold text-primary">{segment.name}</span>
                    <span className="text-xs font-bold text-muted-foreground">
                      {segment.value} cuentas
                    </span>
                  </div>
                  <Progress value={segment.score} className="h-2.5" />
                </div>
              ))}

              <div className="mt-8 pt-8 border-t border-dashed">
                <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">
                  Alertas Estratégicas
                </h4>
                <div className="space-y-3">
                  <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex gap-3">
                    <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-red-800">
                        {data?.riesgo.alto || 0} cuentas en riesgo crítico
                      </p>
                      <p className="text-[10px] text-red-700">
                        Balance supera 80% del límite de crédito.
                      </p>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex gap-3">
                    <Zap className="w-5 h-5 text-blue-600 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-blue-800">
                        AR Total: ${data?.totalAr.toLocaleString() || '-'}
                      </p>
                      <p className="text-[10px] text-blue-700">
                        DSO actual: {data?.dso.value.toFixed(1) || '-'} días.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
