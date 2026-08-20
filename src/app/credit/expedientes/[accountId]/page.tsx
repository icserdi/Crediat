'use client';

import { use, useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { ArrowLeft, FileText, Plus, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useExpediente } from '@/hooks/use-expediente';
import { DOCUMENT_TYPE_LABELS, type DocumentType } from '@/lib/credit/expediente-types';

const validityBadge: Record<string, { label: string; className: string }> = {
  vigente: { label: 'Vigente', className: 'bg-green-50 text-green-700 border-green-200' },
  por_vencer: { label: 'Por vencer', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  vencido: { label: 'Vencido', className: 'bg-red-50 text-red-700 border-red-200' },
};

export default function ExpedientePage({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = use(params);
  const { toast } = useToast();
  const { documentos, isLoading, error, load, add } = useExpediente();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    documentType: 'ine' as DocumentType,
    issuedAt: '',
    expiresAt: '',
    file: null as File | null,
  });

  useEffect(() => {
    load(accountId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.file) return;
    const result = await add(accountId, {
      documentType: form.documentType,
      issuedAt: form.issuedAt,
      expiresAt: form.expiresAt,
      file: form.file,
    });
    if (result.ok) {
      toast({
        title: 'Documento agregado',
        description: 'El documento se registró en el expediente.',
      });
      setOpen(false);
      setForm({ documentType: 'ine', issuedAt: '', expiresAt: '', file: null });
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8">
        <Link
          href="/credit/grant"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a otorgamiento
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-headline font-bold text-primary">Expediente de Crédito</h2>
            <p className="text-muted-foreground">
              Documentos del crédito y control de vigencia. Cuenta: {accountId.slice(0, 8)}...
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => load(accountId)}
              disabled={isLoading}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Recargar
            </Button>
            <Button onClick={() => setOpen(true)} className="bg-primary hover:bg-primary/90 gap-2">
              <Plus className="w-4 h-4" /> Agregar documento
            </Button>
          </div>
        </div>

        <Card className="border-none shadow-md rounded-2xl bg-white overflow-hidden">
          <CardHeader className="bg-muted/10 border-b">
            <CardTitle className="text-lg text-primary">Documentos del expediente</CardTitle>
            <CardDescription>
              Vigencia de cada documento. Los que estén por vencer o vencidos requieren renovación.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-20 text-center text-muted-foreground italic font-medium">
                Cargando expediente...
              </div>
            ) : error ? (
              <div className="p-20 text-center text-red-600 font-medium">{error}</div>
            ) : documentos.length === 0 ? (
              <div className="p-20 text-center text-muted-foreground italic font-medium">
                No hay documentos en el expediente.
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-bold">Documento</TableHead>
                    <TableHead className="font-bold">Archivo</TableHead>
                    <TableHead className="font-bold">Emisión</TableHead>
                    <TableHead className="font-bold">Expiración</TableHead>
                    <TableHead className="font-bold">Vigencia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documentos.map((doc) => {
                    const v = validityBadge[doc.validity] || validityBadge.vigente;
                    return (
                      <TableRow
                        key={doc.id}
                        className="hover:bg-primary/5 transition-colors border-primary/5"
                      >
                        <TableCell className="font-semibold text-primary">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 shrink-0" />
                            {DOCUMENT_TYPE_LABELS[doc.documentType] || doc.documentType}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground truncate max-w-[200px]">
                          {doc.fileName}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(doc.issuedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(doc.expiresAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={v.className}>
                            {v.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Dialog agregar documento */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="rounded-2xl max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline font-bold text-primary">
                Agregar documento
              </DialogTitle>
              <DialogDescription>
                Registre un documento del expediente con su vigencia.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">
                  Tipo de documento *
                </Label>
                <select
                  className="w-full h-11 rounded-xl bg-muted/20 border-primary/10 px-3"
                  value={form.documentType}
                  onChange={(e) =>
                    setForm({ ...form, documentType: e.target.value as DocumentType })
                  }
                >
                  {(Object.keys(DOCUMENT_TYPE_LABELS) as DocumentType[]).map((t) => (
                    <option key={t} value={t}>
                      {DOCUMENT_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">
                    Fecha de emisión *
                  </Label>
                  <Input
                    type="date"
                    value={form.issuedAt}
                    onChange={(e) => setForm({ ...form, issuedAt: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">
                    Fecha de expiración *
                  </Label>
                  <Input
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">
                  Archivo *
                </Label>
                <Input
                  type="file"
                  onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null })}
                  required
                />
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-primary hover:bg-primary/90">
                  Agregar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
