'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RefreshCw, Building2, Plus, CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCreditAccounts } from '@/hooks/use-credit-accounts';
import { PageHeader } from '@/components/shared/page-header';
import type { CreditAccount, Approval } from '@/lib/credit/grant';

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

export default function CreditGrantPage() {
  const { toast } = useToast();
  const { accounts, isLoading, reload, create, getApprovals, decide } = useCreditAccounts();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    applicationId: '',
    requestedAmount: '',
    termMonths: '',
    interestRate: '',
    conditions: '',
  });
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [approvalAccount, setApprovalAccount] = useState<CreditAccount | null>(null);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [approvalComments, setApprovalComments] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await create({
      applicationId: form.applicationId,
      requestedAmount: Number(form.requestedAmount),
      termMonths: Number(form.termMonths),
      interestRate: Number(form.interestRate) || 0,
      conditions: form.conditions,
    });
    if (result.ok) {
      toast({
        title: 'Cuenta de crédito creada',
        description: 'Se inició el flujo de autorización.',
      });
      setOpen(false);
      setForm({
        applicationId: '',
        requestedAmount: '',
        termMonths: '',
        interestRate: '',
        conditions: '',
      });
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
    }
  };

  const openApprovals = async (account: CreditAccount) => {
    const list = await getApprovals(account.id);
    setApprovals(list);
    setApprovalAccount(account);
    setApprovalComments('');
    setApprovalOpen(true);
  };

  const handleDecide = async (approvalId: string, decision: 'aprobado' | 'rechazado') => {
    if (!approvalAccount) return;
    const result = await decide(
      approvalAccount.id,
      approvalId,
      decision,
      'usuario-actual',
      approvalComments
    );
    if (result.ok) {
      toast({
        title: result.allApproved ? 'Crédito autorizado' : 'Decisión registrada',
        description: result.allApproved
          ? 'Todas las aprobaciones completadas.'
          : 'Aprobación registrada.',
      });
      setApprovalOpen(false);
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8">
        <PageHeader
          title="Otorgamiento de Crédito"
          description="Cuentas de crédito y flujos de autorización."
          icon={Building2}
          actions={
            <>
              <Button onClick={reload} disabled={isLoading} variant="outline" className="gap-2">
                <RefreshCw className="w-4 h-4" /> Recargar
              </Button>
              <Button
                onClick={() => setOpen(true)}
                className="bg-primary hover:bg-primary/90 gap-2"
              >
                <Plus className="w-4 h-4" /> Nueva cuenta
              </Button>
            </>
          }
        />

        <Card className="border-none shadow-md rounded-2xl bg-white overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-20 text-center text-muted-foreground italic font-medium">
                Cargando cuentas...
              </div>
            ) : accounts.length === 0 ? (
              <div className="p-20 text-center text-muted-foreground italic font-medium">
                No hay cuentas de crédito registradas.
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-bold">Cuenta</TableHead>
                    <TableHead className="font-bold">Monto</TableHead>
                    <TableHead className="font-bold">Plazo</TableHead>
                    <TableHead className="font-bold">Tasa</TableHead>
                    <TableHead className="font-bold">Estatus</TableHead>
                    <TableHead className="font-bold text-right">Autorización</TableHead>
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
                      <TableCell className="font-mono font-bold">
                        ${acc.requestedAmount.toLocaleString()}
                      </TableCell>
                      <TableCell>{acc.termMonths} meses</TableCell>
                      <TableCell className="font-mono">{acc.interestRate}%</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={statusBadge[acc.status] || 'bg-slate-50'}
                        >
                          {statusLabel[acc.status] || acc.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => openApprovals(acc)}>
                          Ver aprobaciones
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Dialog nueva cuenta */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="rounded-2xl max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline font-bold text-primary">
                Nueva Cuenta de Crédito
              </DialogTitle>
              <DialogDescription>
                Registre el crédito a otorgar. Se crearán los niveles de autorización según el
                monto.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">
                  ID de solicitud *
                </Label>
                <Input
                  value={form.applicationId}
                  onChange={(e) => setForm({ ...form, applicationId: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">
                    Monto (MXN) *
                  </Label>
                  <Input
                    type="number"
                    value={form.requestedAmount}
                    onChange={(e) => setForm({ ...form, requestedAmount: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">
                    Plazo (meses) *
                  </Label>
                  <Input
                    type="number"
                    value={form.termMonths}
                    onChange={(e) => setForm({ ...form, termMonths: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">
                  Tasa de interés (%)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.interestRate}
                  onChange={(e) => setForm({ ...form, interestRate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">
                  Condiciones
                </Label>
                <Textarea
                  value={form.conditions}
                  onChange={(e) => setForm({ ...form, conditions: e.target.value })}
                />
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-primary hover:bg-primary/90">
                  Crear cuenta
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog aprobaciones */}
        <Dialog open={approvalOpen} onOpenChange={setApprovalOpen}>
          <DialogContent className="rounded-2xl max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline font-bold text-primary">
                Autorización — {approvalAccount?.accountNumber}
              </DialogTitle>
              <DialogDescription>Aprobaciones requeridas para este crédito.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              {approvals.map((ap) => (
                <div key={ap.id} className="p-4 rounded-xl border border-primary/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary">
                      Nivel {ap.level} · {ap.role}
                    </span>
                    {ap.decision ? (
                      <Badge
                        className={
                          ap.decision === 'aprobado'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }
                      >
                        {ap.decision}
                      </Badge>
                    ) : (
                      <Badge className="bg-orange-50 text-orange-700 border-orange-200">
                        Pendiente
                      </Badge>
                    )}
                  </div>
                  {ap.decidedAt && (
                    <p className="text-xs text-muted-foreground">
                      Decidido por {ap.approvedBy} el {new Date(ap.decidedAt).toLocaleString()}
                    </p>
                  )}
                  {!ap.decision && (
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 gap-1"
                        onClick={() => handleDecide(ap.id, 'aprobado')}
                      >
                        <CheckCircle2 className="w-4 h-4" /> Aprobar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50 gap-1"
                        onClick={() => handleDecide(ap.id, 'rechazado')}
                      >
                        <XCircle className="w-4 h-4" /> Rechazar
                      </Button>
                    </div>
                  )}
                </div>
              ))}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">
                  Comentarios
                </Label>
                <Textarea
                  value={approvalComments}
                  onChange={(e) => setApprovalComments(e.target.value)}
                  placeholder="Comentarios de la aprobación..."
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
