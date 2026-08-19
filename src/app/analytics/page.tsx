'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from 'recharts';
import {
  TrendingUp,
  BrainCircuit,
  ArrowUpRight,
  Zap,
  RefreshCw,
  AlertCircle,
  Building2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAnalytics } from '@/hooks/use-analytics';
import { useActiveCompany } from '@/hooks/use-active-company';
import { PageHeader } from '@/components/shared/page-header';

export default function AnalyticsPage() {
  const { activeCompanyId } = useActiveCompany();
  const { data, isLoading, error } = useAnalytics(activeCompanyId);

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            <p className="text-muted-foreground font-medium">Procesando analítica desde SAP...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <PageHeader
          title="Analítica e Inteligencia"
          description="Perspectivas profundas de ciclos de cobro basadas en datos SAP."
          icon={Building2}
          actions={
            <Badge
              variant="outline"
              className="bg-white px-3 py-1.5 gap-2 text-xs font-semibold border-primary/20"
            >
              <Zap className="w-3.5 h-3.5 text-accent" />
              Datos al {data?.asOf ? new Date(data.asOf).toLocaleDateString() : '-'}
            </Badge>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase font-bold">
                Tasa Morosidad
              </CardDescription>
              <CardTitle className="text-2xl font-headline flex items-baseline gap-2">
                {data?.kpi.morosidad.toFixed(1)}%
                <span className="text-xs text-muted-foreground">
                  {data?.totalDebtors || 0} deudores
                </span>
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase font-bold">
                Eficiencia Recuperación
              </CardDescription>
              <CardTitle className="text-2xl font-headline flex items-baseline gap-2">
                {data?.kpi.recuperacion.toFixed(1)}%
                <span className="text-xs text-green-600 flex items-center">
                  <ArrowUpRight className="w-3 h-3" /> Cartera
                </span>
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase font-bold">
                Rotación Cartera
              </CardDescription>
              <CardTitle className="text-2xl font-headline flex items-baseline gap-2">
                {data?.kpi.rotacion.toFixed(1)}x
                <span className="text-xs text-muted-foreground">Anual</span>
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-none shadow-md">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-accent" />
                    Proyección Flujo IA (30 Días)
                  </CardTitle>
                  <CardDescription>Estimación basada en datos de SAP.</CardDescription>
                </div>
                <Badge variant="outline" className="border-accent text-accent">
                  Confianza: 89%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.cashFlowProjection || []}>
                  <defs>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#353585" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#353585" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorProj" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FA9319" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#FA9319" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `$${val / 1000}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="actual"
                    stroke="#353585"
                    fillOpacity={1}
                    fill="url(#colorActual)"
                    strokeWidth={3}
                  />
                  <Area
                    type="monotone"
                    dataKey="projected"
                    stroke="#FA9319"
                    fillOpacity={1}
                    fill="url(#colorProj)"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-primary" />
                Insights Estratégicos
              </CardTitle>
              <CardDescription>
                Basados en datos SAP al{' '}
                {data?.asOf ? new Date(data.asOf).toLocaleDateString() : '-'}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {data?.insights.map((insight, i) => (
                <div
                  key={i}
                  className={cn(
                    'p-4 rounded-lg border',
                    insight.type === 'warning'
                      ? 'bg-orange-50 border-orange-100'
                      : insight.type === 'success'
                        ? 'bg-green-50 border-green-100'
                        : 'bg-primary/5 border-primary/10'
                  )}
                >
                  <h5 className="font-semibold text-primary mb-1 flex items-center gap-2 text-sm">
                    {insight.title}
                  </h5>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {insight.description}
                  </p>
                </div>
              ))}

              {data?.monthlyTrend && data.monthlyTrend.length > 0 && (
                <div className="space-y-4 pt-4 border-t">
                  <h5 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                    Recuperación (últimos meses)
                  </h5>
                  <ResponsiveContainer width="100%" height={150}>
                    <BarChart data={data.monthlyTrend}>
                      <XAxis dataKey="month" hide />
                      <Bar dataKey="recovery" fill="#353585" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
