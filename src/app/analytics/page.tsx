'use client';

import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart,
  Area,
  BarChart,
  Bar
} from "recharts";
import { 
  TrendingUp, 
  BrainCircuit, 
  ArrowUpRight, 
  ArrowDownRight,
  ShieldCheck,
  Zap
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const performanceData = [
  { month: 'Jul', recovery: 85, morbidity: 12 },
  { month: 'Ago', recovery: 88, morbidity: 10 },
  { month: 'Sep', recovery: 82, morbidity: 15 },
  { month: 'Oct', recovery: 91, morbidity: 8 },
  { month: 'Nov', recovery: 89, morbidity: 9 },
  { month: 'Dic', recovery: 94, morbidity: 6 },
];

const cashFlowData = [
  { day: 'D+1', actual: 4000, projected: 4500 },
  { day: 'D+3', actual: 6000, projected: 5800 },
  { day: 'D+5', actual: 12000, projected: 11000 },
  { day: 'D+7', actual: 8000, projected: 9500 },
  { day: 'D+10', actual: 15000, projected: 16200 },
  { day: 'D+14', projected: 22000 },
  { day: 'D+21', projected: 18500 },
  { day: 'D+30', projected: 31000 },
];

export default function AnalyticsPage() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-headline font-bold text-primary">Inteligencia y Pronósticos</h2>
            <p className="text-muted-foreground">Perspectivas profundas de ciclos de cobro y seguridad de ingresos.</p>
          </div>
          <Badge className="bg-primary py-2 px-4 gap-2">
            <Zap className="w-4 h-4 text-accent" />
            Estado Entrenamiento IA: Optimizado
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase font-bold">Tasa Morosidad</CardDescription>
              <CardTitle className="text-2xl font-headline flex items-baseline gap-2">
                6.2%
                <span className="text-xs text-green-600 flex items-center">
                  <ArrowDownRight className="w-3 h-3" /> -1.4%
                </span>
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase font-bold">Eficiencia Recuperación</CardDescription>
              <CardTitle className="text-2xl font-headline flex items-baseline gap-2">
                94.8%
                <span className="text-xs text-green-600 flex items-center">
                  <ArrowUpRight className="w-3 h-3" /> +2.1%
                </span>
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase font-bold">Rotación Portafolio</CardDescription>
              <CardTitle className="text-2xl font-headline flex items-baseline gap-2">
                8.4x
                <span className="text-xs text-muted-foreground">Estable</span>
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase font-bold">Cumplimiento Promesa</CardDescription>
              <CardTitle className="text-2xl font-headline flex items-baseline gap-2">
                92%
                <span className="text-xs text-green-600 flex items-center">
                  <ArrowUpRight className="w-3 h-3" /> +5%
                </span>
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
                  <CardDescription>Cobranza estimada basada en vectores de comportamiento histórico.</CardDescription>
                </div>
                <Badge variant="outline" className="border-accent text-accent">Confianza: 89%</Badge>
              </div>
            </CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashFlowData}>
                  <defs>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#353585" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#353585" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorProj" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FA9319" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#FA9319" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="actual" stroke="#353585" fillOpacity={1} fill="url(#colorActual)" strokeWidth={3} />
                  <Area type="monotone" dataKey="projected" stroke="#FA9319" fillOpacity={1} fill="url(#colorProj)" strokeDasharray="5 5" strokeWidth={2} />
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
              <CardDescription>Hallazgos clave del último ciclo de entrenamiento.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                <h5 className="font-semibold text-primary mb-1 flex items-center gap-2">
                   <ShieldCheck className="w-4 h-4" /> 
                   Canal Óptimo
                </h5>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  WhatsApp enviados entre 9:00 AM y 11:00 AM tienen una tasa de respuesta 35% mayor que email.
                </p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                <h5 className="font-semibold text-orange-800 mb-1 flex items-center gap-2">
                   <TrendingUp className="w-4 h-4" /> 
                   Alerta de Abandono
                </h5>
                <p className="text-sm text-orange-700 leading-relaxed">
                  3 deudores de alto valor muestran baja en cumplimiento. IA sugiere intervención manual inmediata.
                </p>
              </div>
              <div className="space-y-4 pt-4 border-t">
                 <h5 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Composición de Recuperación</h5>
                 <ResponsiveContainer width="100%" height={150}>
                   <BarChart data={performanceData.slice(-3)}>
                      <XAxis dataKey="month" hide />
                      <Bar dataKey="recovery" fill="#353585" radius={[4, 4, 0, 0]} />
                   </BarChart>
                 </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
