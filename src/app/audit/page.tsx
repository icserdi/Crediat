'use client';

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
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Database, 
  Zap, 
  LogIn, 
  Key,
  RefreshCw,
  AlertCircle,
  Building2
} from "lucide-react";

type AuditEvent = {
  id: string;
  event_type: string;
  severity: string;
  actor: string;
  actor_role: string | null;
  entity_type: string | null;
  entity_id: string | null;
  description: string;
  metadata: Record<string, unknown>;
  company_db: string | null;
  ip_address: string | null;
  created_at: string;
};

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditEvent[]>([]);
  const [stats, setStats] = useState({ logins: 0, logouts: 0, iaInvocations: 0, writes: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAudit = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/audit?limit=100');
      const data = await response.json();
      if (response.ok) {
        setLogs(data.logs);
        setStats(data.stats);
      } else {
        setError(data.message || 'Error al cargar auditoría');
      }
    } catch {
      setError('Error de conexión al servidor');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAudit();
  }, []);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-4xl font-headline font-bold text-primary">Logs de Auditoría</h2>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="w-4 h-4" />
              <p className="text-lg italic">Registro inmutable de todas las intervenciones manuales, IA y accesos.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-primary text-white px-4 py-2 font-bold gap-2">
              <ShieldCheck className="w-4 h-4" />
              Append-Only: ACTIVA
            </Badge>
            <Button onClick={loadAudit} disabled={isLoading} variant="outline" size="sm" className="gap-2">
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
              Recargar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-none shadow-md">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-bold uppercase text-muted-foreground">Inicios de Sesión</CardDescription>
              <CardTitle className="text-2xl font-headline flex items-center gap-2">
                <LogIn className="w-5 h-5 text-green-500" />
                {stats.logins}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-none shadow-md">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-bold uppercase text-muted-foreground">Escrituras SAP/UDF</CardDescription>
              <CardTitle className="text-2xl font-headline flex items-center gap-2">
                <Key className="w-5 h-5 text-orange-500" />
                {stats.writes}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-none shadow-md">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-bold uppercase text-muted-foreground">Invocaciones IA</CardDescription>
              <CardTitle className="text-2xl font-headline flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-500" />
                {stats.iaInvocations}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-none shadow-md">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-bold uppercase text-muted-foreground">Total Eventos</CardDescription>
              <CardTitle className="text-2xl font-headline flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                {logs.length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {isLoading ? (
          <div className="py-20 text-center flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            <p className="text-muted-foreground font-medium">Cargando auditoría...</p>
          </div>
        ) : error ? (
          <div className="py-20 text-center flex flex-col items-center gap-3">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        ) : (
          <Card className="border-none shadow-xl">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/5">
                  <TableRow>
                    <TableHead className="font-bold">Evento</TableHead>
                    <TableHead className="font-bold">Actor</TableHead>
                    <TableHead className="font-bold">Entidad</TableHead>
                    <TableHead className="font-bold">Detalles</TableHead>
                    <TableHead className="font-bold">Fecha/Hora</TableHead>
                    <TableHead className="font-bold">Severidad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-20 text-center text-muted-foreground italic">
                        No hay eventos de auditoría registrados.
                      </TableCell>
                    </TableRow>
                  ) : logs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-muted/30">
                      <TableCell className="font-semibold text-primary">
                        <div className="flex items-center gap-2">
                          {log.event_type?.toLowerCase().includes('sesión') || log.event_type?.toLowerCase().includes('login') ? <LogIn className="w-3 h-3 text-muted-foreground" /> : null}
                          {log.event_type?.toLowerCase().includes('write') || log.event_type?.toLowerCase().includes('udf') || log.event_type?.toLowerCase().includes('promise') ? <Key className="w-3 h-3 text-muted-foreground" /> : null}
                          {log.event_type}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-bold">{log.actor}</TableCell>
                      <TableCell className="font-medium text-xs">{log.entity_id || '-'}</TableCell>
                      <TableCell className="max-w-xs truncate text-xs text-muted-foreground">{log.description}</TableCell>
                      <TableCell className="text-[10px] font-mono whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(
                          "text-[10px] uppercase font-bold",
                          log.severity === 'error' || log.severity === 'alta' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                          log.severity === 'success' || log.severity === 'éxito' ? 'bg-green-50 text-green-700 border-green-200' :
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
        )}
      </main>
    </div>
  );
}