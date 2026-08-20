'use client';

import { use, useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, FileText, CheckCircle2, XCircle, RefreshCw, Gauge } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useCreditApplications } from '@/hooks/use-credit-applications';
import { usePrequalification } from '@/hooks/use-prequalification';
import { STATUS_LABELS, STATUS_TRANSITIONS, type CreditApplication } from '@/lib/credit/constants';

const statusBadgeClass: Record<string, string> = {
  solicitud_enviada: 'bg-blue-50 text-blue-700 border-blue-200',
  en_revision: 'bg-orange-50 text-orange-700 border-orange-200',
  precalificada: 'bg-purple-50 text-purple-700 border-purple-200',
  aprobada: 'bg-green-50 text-green-700 border-green-200',
  rechazada: 'bg-red-50 text-red-700 border-red-200',
};

export default function CreditApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { toast } = useToast();
  const { applications, reload, updateStatus } = useCreditApplications();

  const [application, setApplication] = useState<CreditApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState('');

  const {
    isRunning: preqRunning,
    result: preqResult,
    run: runPrequalification,
  } = usePrequalification();
  const [preqIncome, setPreqIncome] = useState('');
  const [preqAmount, setPreqAmount] = useState('');
  const [preqAge, setPreqAge] = useState('');

  // Cargar detalle desde el listado si ya está, o buscarlo por ID
  useEffect(() => {
    let active = true;
    (async () => {
      const app =
        applications.find((a) => a.id === id) ||
        (await fetch(`/api/credit/applications/${id}`)
          .then((r) => r.json())
          .then((d) => d.application as CreditApplication | undefined)
          .catch(() => undefined));
      if (active) {
        setApplication(app ?? null);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleStatus = async (target: CreditApplication['status']) => {
    const result = await updateStatus(id, target, target === 'rechazada' ? reason : undefined);
    if (result.ok) {
      toast({ title: 'Estatus actualizado', description: STATUS_LABELS[target] });
      setReason('');
      reload();
    } else {
      toast({
        title: 'Error',
        description: result.message,
        variant: 'destructive',
      });
    }
  };

  const handlePrequalify = async () => {
    if (!application) return;
    const result = await runPrequalification({
      applicationId: application.id,
      personType: application.personType,
      rfc: application.rfc,
      declaredIncome: preqIncome ? Number(preqIncome) : undefined,
      requestedAmount: preqAmount ? Number(preqAmount) : undefined,
      businessAgeYears: preqAge ? Number(preqAge) : undefined,
    });
    if (result.ok) {
      toast({ title: 'Pre-calificación completada' });
      reload();
    } else {
      toast({
        title: 'Error en pre-calificación',
        description: result.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        </main>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">
          <p className="text-red-600 font-medium">Solicitud no encontrada.</p>
          <Link href="/credit/applications" className="text-primary underline mt-4 inline-block">
            ← Volver al listado
          </Link>
        </main>
      </div>
    );
  }

  const attachments =
    (application.metadata as { attachments?: string[] } | undefined)?.attachments || [];
  const nextTransitions = STATUS_TRANSITIONS[application.status] || [];
  const canAct = nextTransitions.length > 0;

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8">
        <Link
          href="/credit/applications"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a solicitudes
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-headline font-bold text-primary">
              {application.fullName}
            </h2>
            <p className="text-muted-foreground">
              {application.personType === 'fisica' ? 'Persona Física' : 'Persona Moral'} ·{' '}
              {application.city}, {application.state}
            </p>
          </div>
          <Badge className={statusBadgeClass[application.status] || 'bg-slate-50'}>
            {STATUS_LABELS[application.status]}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Datos de contacto */}
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="text-lg text-primary">Datos de contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Email:</span>{' '}
                <span className="font-medium">{application.email}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Teléfono:</span>{' '}
                <span className="font-medium">{application.phone}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Asesor:</span>{' '}
                <span className="font-medium">{application.advisor}</span>
              </div>
              <div>
                <span className="text-muted-foreground">RFC:</span>{' '}
                <span className="font-mono font-medium">{application.rfc || '-'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Fecha:</span>{' '}
                <span className="font-medium">
                  {new Date(application.createdAt).toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Documentos adjuntos */}
          <Card className="lg:col-span-2 border-none shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-primary">
                <FileText className="w-5 h-5" /> Documentos adjuntos
              </CardTitle>
              <CardDescription>Archivos subidos en la solicitud (MinIO).</CardDescription>
            </CardHeader>
            <CardContent>
              {attachments.length === 0 ? (
                <p className="text-muted-foreground italic">No se adjuntaron documentos.</p>
              ) : (
                <ul className="space-y-2">
                  {attachments.map((key) => {
                    const name = key.split('/').pop() || key;
                    return (
                      <li
                        key={key}
                        className="flex items-center gap-3 p-3 bg-muted/10 rounded-lg border border-primary/5"
                      >
                        <FileText className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-sm font-medium font-mono truncate">{name}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Pre-calificación */}
          <Card className="lg:col-span-3 border-none shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-primary">
                <Gauge className="w-5 h-5" /> Pre-calificación
              </CardTitle>
              <CardDescription>
                Evalúe preliminarmente la viabilidad del crédito (score y resultado).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">
                    Ingreso declarado (MXN)
                  </Label>
                  <Input
                    type="number"
                    placeholder="Ej. 50000"
                    value={preqIncome}
                    onChange={(e) => setPreqIncome(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">
                    Monto solicitado (MXN)
                  </Label>
                  <Input
                    type="number"
                    placeholder="Ej. 200000"
                    value={preqAmount}
                    onChange={(e) => setPreqAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">
                    Antigüedad negocio (años)
                  </Label>
                  <Input
                    type="number"
                    placeholder="Ej. 3"
                    value={preqAge}
                    onChange={(e) => setPreqAge(e.target.value)}
                  />
                </div>
              </div>

              <Button
                onClick={handlePrequalify}
                disabled={preqRunning}
                className="bg-accent hover:bg-accent/90 gap-2"
              >
                <Gauge className="w-4 h-4" />
                {preqRunning ? 'Pre-calificando...' : 'Ejecutar pre-calificación'}
              </Button>

              {preqResult && (
                <div className="p-4 rounded-xl border space-y-2">
                  <div className="flex items-center gap-3">
                    <Badge
                      className={
                        preqResult.result === 'aprobado'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : preqResult.result === 'condicionado'
                            ? 'bg-orange-50 text-orange-700 border-orange-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                      }
                    >
                      {preqResult.result}
                    </Badge>
                    <span className="font-bold text-primary">Score: {preqResult.score}/100</span>
                  </div>
                  {preqResult.reasons.length > 0 && (
                    <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                      {preqResult.reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Acciones por estatus */}
          <Card className="lg:col-span-3 border-none shadow-md">
            <CardHeader>
              <CardTitle className="text-lg text-primary">Acciones</CardTitle>
              <CardDescription>
                Mover la solicitud al siguiente paso del workflow de crédito.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!canAct ? (
                <p className="text-muted-foreground italic">
                  Esta solicitud se encuentra en un estado terminal (
                  {STATUS_LABELS[application.status]}).
                </p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-3">
                    {nextTransitions.map((st) =>
                      st === 'rechazada' ? (
                        <Button
                          key={st}
                          variant="outline"
                          className="border-red-200 text-red-600 hover:bg-red-50 gap-2"
                          disabled={!reason.trim()}
                          onClick={() => handleStatus(st)}
                        >
                          <XCircle className="w-4 h-4" /> Rechazar
                        </Button>
                      ) : (
                        <Button
                          key={st}
                          onClick={() => handleStatus(st)}
                          className="bg-primary hover:bg-primary/90 gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" /> {STATUS_LABELS[st]}
                        </Button>
                      )
                    )}
                  </div>
                  {nextTransitions.includes('rechazada') && (
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">
                        Motivo del rechazo
                      </Label>
                      <Textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Indique el motivo del rechazo..."
                      />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
