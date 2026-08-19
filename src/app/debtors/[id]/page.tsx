'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HandCoins, Zap, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, use, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useDebtorDetail } from '@/hooks/use-debtor-detail';

export default function DebtorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useToast();
  const [activeCompanyId, setActiveCompanyId] = useState('');
  const [promiseDate, setPromiseDate] = useState('');
  const { interactions, isSaving, registerPromise } = useDebtorDetail(activeCompanyId, id);

  useEffect(() => {
    const cid = localStorage.getItem('activeCompanyId') || '';
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveCompanyId(cid);
  }, []);

  const handleRegisterPromise = async () => {
    const result = await registerPromise(promiseDate);

    if (result.ok) {
      toast({
        title: result.sapWritten ? 'Promesa registrada en SAP' : 'Promesa registrada (local)',
        description: result.message,
      });
      setPromiseDate('');
    } else {
      toast({
        title: 'Error',
        description: result.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center text-white text-3xl font-bold shadow-2xl shadow-primary/30">
              {id[0]}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-4xl font-headline font-bold text-primary">Deudor: {id}</h2>
              </div>
              <p className="text-muted-foreground text-lg font-medium">ID: {id}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Gestión de Promesa */}
            <Card className="border-none shadow-xl overflow-hidden rounded-2xl bg-white">
              <CardHeader className="bg-primary/5 border-b p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary rounded-lg shadow-md shadow-primary/20">
                    <HandCoins className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-xl font-headline text-primary">
                    Registrar Promesa de Pago
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <Label className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">
                    Fecha de Promesa
                  </Label>
                  <Input
                    type="date"
                    value={promiseDate}
                    onChange={(e) => setPromiseDate(e.target.value)}
                    className="h-11 rounded-xl bg-muted/20 border-primary/10"
                  />
                </div>
                <Button
                  onClick={handleRegisterPromise}
                  disabled={isSaving || !promiseDate}
                  className="w-full bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20 h-12 font-bold gap-2"
                >
                  {isSaving ? (
                    <>Registrando...</>
                  ) : (
                    <>
                      <HandCoins className="w-5 h-5" /> Registrar Promesa en SAP
                    </>
                  )}
                </Button>
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 text-xs text-blue-800 font-medium">
                  <Zap className="w-4 h-4 inline mr-1 text-blue-600" />
                  La promesa se registra en la BD local y, si los campos U_AI_* existen en SAP,
                  también se escriben allí.
                </div>
              </CardContent>
            </Card>

            {/* Historial de Interacciones */}
            <Card className="border-none shadow-xl rounded-2xl bg-white overflow-hidden">
              <CardHeader className="bg-muted/10 border-b p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent rounded-lg shadow-md">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-xl font-headline text-primary">
                    Historial de Gestiones
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                {interactions.length === 0 ? (
                  <p className="text-muted-foreground italic text-center py-8">
                    No hay gestiones registradas para este deudor.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {interactions.map((item) => (
                      <div
                        key={item.id}
                        className="flex gap-4 p-4 bg-muted/5 rounded-2xl border border-primary/5"
                      >
                        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                          {item.type === 'WhatsApp' ? (
                            <Zap className="w-5 h-5 text-accent" />
                          ) : (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-primary text-sm">
                              {item.assigned_to}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {new Date(item.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-primary/70 font-medium">{item.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar info */}
          <div className="space-y-8">
            <Card className="border-none shadow-2xl bg-primary text-white overflow-hidden relative rounded-3xl">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <HandCoins className="w-32 h-32" />
              </div>
              <CardHeader className="p-8 pb-0">
                <CardTitle className="text-xl font-headline tracking-widest uppercase text-accent font-black">
                  Acciones Disponibles
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6 relative z-10">
                <div className="space-y-4">
                  <div className="p-4 bg-white/10 rounded-2xl border border-white/5 backdrop-blur-sm">
                    <CheckCircle2 className="w-5 h-5 text-green-400 mb-2" />
                    <p className="text-sm text-white/80 font-medium">Registro de promesa de pago</p>
                  </div>
                  {!activeCompanyId && (
                    <div className="p-4 bg-red-500/20 rounded-2xl border border-red-500/30">
                      <AlertCircle className="w-5 h-5 text-red-400 mb-2" />
                      <p className="text-sm text-red-200 font-medium">
                        Seleccione una empresa en el menú lateral
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
