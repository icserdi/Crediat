'use client';

import { Sidebar } from "@/components/layout/sidebar";
import { KPICard } from "@/components/dashboard/kpi-card";
import { 
  Banknote, 
  CalendarClock, 
  HandCoins, 
  ShieldAlert, 
  ShieldCheck,
  Users,
  Zap,
  TrendingUp,
  History
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const performanceData = [
  { name: 'Jul', actual: 82000, projected: 85000 },
  { name: 'Ago', actual: 95000, projected: 92000 },
  { name: 'Sep', actual: 88000, projected: 98000 },
  { name: 'Oct', actual: 110000, projected: 105000 },
  { name: 'Nov', actual: 102000, projected: 115000 },
  { name: 'Dic', actual: 125000, projected: 120000 },
];

export default function Dashboard() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-headline font-bold text-primary">Inteligencia Financiera</h1>
            <p className="text-muted-foreground text-lg">Desempeño de cobranza en tiempo real y modelos de riesgo predictivo.</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-white px-3 py-1.5 gap-2 text-xs font-semibold border-primary/20">
              <Zap className="w-3.5 h-3.5 text-accent animate-pulse-slow" />
              Estado IA: Sincronizado
            </Badge>
            <Badge variant="outline" className="bg-white px-3 py-1.5 gap-2 text-xs font-semibold border-primary/20">
              <History className="w-3.5 h-3.5 text-primary" />
              Última Actividad: hace 12m
            </Badge>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <KPICard 
            title="DSO (plazo de cobro)" 
            value="38.2" 
            description="Días promedio venta → cobro" 
            icon={CalendarClock}
            trend={{ value: 4.2, isPositive: true }}
          />
          <KPICard 
            title="Tasa Morosidad" 
            value="5.4%" 
            description="Exposición riesgo crítico" 
            icon={ShieldAlert}
            trend={{ value: 1.1, isPositive: true }}
          />
          <KPICard 
            title="Tasa Recuperación" 
            value="91.8%" 
            description="Eficiencia de cartera" 
            icon={HandCoins}
            trend={{ value: 2.5, isPositive: true }}
          />
          <KPICard 
            title="Rotación Cartera" 
            value="7.4x" 
            description="Velocidad anual flujo" 
            icon={TrendingUp}
          />
          <KPICard 
            title="Cumplimiento Promesa" 
            value="89%" 
            description="Pagos concretados" 
            icon={ShieldCheck}
            trend={{ value: 5.0, isPositive: true }}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-none shadow-md bg-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-headline text-xl flex items-center gap-2 text-primary">
                  <Banknote className="w-5 h-5 text-accent" />
                  Cobranza Real vs Proyectada
                </CardTitle>
                <CardDescription>Histórico vs pronósticos de cobranza a 30 días impulsados por IA.</CardDescription>
              </div>
              <Badge className="bg-primary/5 text-primary border-primary/10">Horizonte 30D</Badge>
            </CardHeader>
            <CardContent className="h-[350px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData}>
                  <defs>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#353585" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#353585" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#888', fontSize: 12 }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tickFormatter={(val) => `$${val/1000}k`}
                    tick={{ fill: '#888', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="actual" stroke="#353585" strokeWidth={4} fillOpacity={1} fill="url(#colorActual)" />
                  <Area type="monotone" dataKey="projected" stroke="#FA9319" strokeWidth={2} strokeDasharray="6 4" fill="transparent" />
                </AreaChart>
              </ResponsiveContainer>
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
                { name: 'Riesgo Alto (Crítico)', value: 18, color: 'bg-red-500', score: 85 },
                { name: 'Riesgo Medio (Alerta)', value: 42, color: 'bg-orange-500', score: 62 },
                { name: 'Riesgo Bajo (Saludable)', value: 124, color: 'bg-green-500', score: 15 },
              ].map((segment) => (
                <div key={segment.name} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-semibold text-primary">{segment.name}</span>
                    <span className="text-xs font-bold text-muted-foreground">{segment.value} cuentas</span>
                  </div>
                  <Progress value={segment.score} className="h-2.5" />
                </div>
              ))}

              <div className="mt-8 pt-8 border-t border-dashed">
                <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Alertas Estratégicas</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex gap-3">
                    <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-red-800">Initech Systems Riesgo 0.92</p>
                      <p className="text-[10px] text-red-700">Inconsistencia detectada. IA sugiere WhatsApp firme inmediato.</p>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex gap-3">
                    <Zap className="w-5 h-5 text-blue-600 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-blue-800">Nueva Oportunidad Recuperación</p>
                      <p className="text-[10px] text-blue-700">Massive Dynamic aceptó oferta incentivo. Probabilidad éxito: 85%.</p>
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
