import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Database, Zap, User, Clock, LogIn, LogOut, Key } from "lucide-react";
import { cn } from "@/lib/utils";

const auditLogs = [
  { id: 'AUD-007', event: 'Inicio de Sesión', debtor: '-', user: 'admin@serdi.com.mx', timestamp: '2023-11-15 11:05:22', severity: 'Éxito', details: 'Autenticación exitosa mediante OTP.' },
  { id: 'AUD-006', event: 'Recuperación Pass', debtor: '-', user: 'ventas@merkaaceros.com', timestamp: '2023-11-15 10:45:00', severity: 'Info', details: 'Solicitud de recuperación enviada a correo.' },
  { id: 'AUD-005', event: 'Mensaje IA Generado', debtor: 'Initech Systems', user: 'Sistema (Worker)', timestamp: '2023-11-15 10:24:12', severity: 'Info', details: 'Gemini-2.5-Flash usado para contenido WhatsApp.' },
  { id: 'AUD-004', event: 'Score Riesgo Actualizado', debtor: 'Globex Corp', user: 'Motor IA', timestamp: '2023-11-15 09:15:00', severity: 'Alerta', details: 'Puntaje incrementado de 0.72 a 0.92 por falta de pago.' },
  { id: 'AUD-003', event: 'Cierre de Sesión', debtor: '-', user: 'agente.cobranza@heliequiposindustriales.com', timestamp: '2023-11-15 08:30:15', severity: 'Info', details: 'Sesión terminada por el usuario.' },
  { id: 'AUD-002', event: 'Ajuste Manual', debtor: 'Massive Dynamic', user: 'Admin Usuario', timestamp: '2023-11-14 16:45:22', severity: 'Media', details: 'Extensión de pago otorgada hasta Dic 10.' },
  { id: 'AUD-001', event: 'Índice Vector Reconstruido', debtor: 'Cartera Global', user: 'Sistema', timestamp: '2023-11-14 02:00:00', severity: 'Éxito', details: '14,228 embeddings de conversación re-indexados.' },
];

export default function AuditPage() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-4xl font-headline font-bold text-primary">Logs de Auditoría</h2>
            <p className="text-muted-foreground text-lg italic">Registro inmutable de todas las intervenciones manuales, IA y accesos.</p>
          </div>
          <Badge className="bg-primary text-white px-4 py-2 font-bold gap-2">
            <ShieldCheck className="w-4 h-4" />
            Verificación Blockchain: ACTIVA
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-none shadow-md">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-bold uppercase text-muted-foreground">Inicios de Sesión</CardDescription>
              <CardTitle className="text-2xl font-headline flex items-center gap-2">
                <LogIn className="w-5 h-5 text-green-500" />
                1,244 / mes
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-none shadow-md">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-bold uppercase text-muted-foreground">Recuperaciones</CardDescription>
              <CardTitle className="text-2xl font-headline flex items-center gap-2">
                <Key className="w-5 h-5 text-orange-500" />
                28 / mes
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-none shadow-md">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-bold uppercase text-muted-foreground">Invocaciones IA</CardDescription>
              <CardTitle className="text-2xl font-headline flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-500" />
                12,455 / mes
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-none shadow-md">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-bold uppercase text-muted-foreground">Uptime Nodos</CardDescription>
              <CardTitle className="text-2xl font-headline flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                100% On-Prem
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card className="border-none shadow-xl">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/5">
                <TableRow>
                  <TableHead className="font-bold">ID</TableHead>
                  <TableHead className="font-bold">Tipo Evento</TableHead>
                  <TableHead className="font-bold">Usuario / Actor</TableHead>
                  <TableHead className="font-bold">Entidad</TableHead>
                  <TableHead className="font-bold">Detalles</TableHead>
                  <TableHead className="font-bold">Fecha/Hora</TableHead>
                  <TableHead className="font-bold">Severidad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-xs font-bold">{log.id}</TableCell>
                    <TableCell className="font-semibold text-primary">
                      <div className="flex items-center gap-2">
                        {log.event.includes('Sesión') && <LogIn className="w-3 h-3 text-muted-foreground" />}
                        {log.event.includes('Pass') && <Key className="w-3 h-3 text-muted-foreground" />}
                        {log.event}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-bold">{log.user}</TableCell>
                    <TableCell className="font-medium">{log.debtor}</TableCell>
                    <TableCell className="max-w-xs truncate text-xs text-muted-foreground">{log.details}</TableCell>
                    <TableCell className="text-[10px] font-mono whitespace-nowrap">{log.timestamp}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                        "text-[10px] uppercase font-bold",
                        log.severity === 'Alerta' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                        log.severity === 'Éxito' ? 'bg-green-50 text-green-700 border-green-200' :
                        log.severity === 'Media' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-slate-50 text-slate-700 border-slate-200'
                      )}>
                        {log.severity}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
