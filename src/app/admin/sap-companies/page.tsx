'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Database, Plus, Save, X, Building2, Trash2, Edit, Check, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { SapCompany } from '@/lib/sap/types';
import { useSapCompanies, type CompanyFormData } from '@/hooks/use-sap-companies';

const emptyForm: CompanyFormData = {
  companyDb: '',
  friendlyName: '',
  description: '',
  isActive: true,
};

export default function SapCompaniesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { companies, isLoading, reload, create, update, remove, assign } = useSapCompanies();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<SapCompany | null>(null);
  const [formData, setFormData] = useState<CompanyFormData>(emptyForm);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [assignmentFormData, setAssignmentFormData] = useState({
    userId: '',
    companyIds: [] as string[],
  });

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (role !== 'admin') {
      router.push('/');
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsAdmin(true);
    }
  }, [router]);

  const handleCreate = () => {
    setEditingCompany(null);
    setFormData(emptyForm);
    setIsDialogOpen(true);
  };

  const handleEdit = (company: SapCompany) => {
    setEditingCompany(company);
    setFormData({
      companyDb: company.companyDb,
      friendlyName: company.friendlyName,
      description: company.description || '',
      isActive: company.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar esta empresa SAP?')) return;
    const result = await remove(id);
    toast({
      title: result.ok ? 'Empresa eliminada' : 'Error al eliminar',
      description: result.ok
        ? 'La empresa SAP ha sido eliminada correctamente'
        : result.message || 'Error desconocido',
      variant: result.ok ? 'default' : 'destructive',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = editingCompany
      ? await update(editingCompany.id, formData)
      : await create(formData);

    toast({
      title: result.ok
        ? editingCompany
          ? 'Empresa actualizada'
          : 'Empresa creada'
        : 'Error al guardar',
      description: result.ok
        ? editingCompany
          ? 'La empresa SAP ha sido actualizada correctamente'
          : 'La empresa SAP ha sido creada correctamente'
        : result.message || 'Error desconocido',
      variant: result.ok ? 'default' : 'destructive',
    });

    if (result.ok) setIsDialogOpen(false);
  };

  const handleOpenAssignmentDialog = () => {
    setAssignmentFormData({ userId: '', companyIds: [] });
    setAssignmentDialogOpen(true);
  };

  const handleAssignmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!assignmentFormData.userId || assignmentFormData.companyIds.length === 0) {
      toast({
        title: 'Datos incompletos',
        description: 'Debe especificar un usuario y al menos una empresa',
        variant: 'destructive',
      });
      return;
    }

    const result = await assign(assignmentFormData.userId, assignmentFormData.companyIds);
    toast({
      title: result.ok ? 'Asignación creada' : 'Error al asignar',
      description: result.ok
        ? 'El usuario ha sido asignado a las empresas seleccionadas'
        : result.message || 'Error desconocido',
      variant: result.ok ? 'default' : 'destructive',
    });

    if (result.ok) setAssignmentDialogOpen(false);
  };

  const toggleCompanySelection = (companyId: string) => {
    setAssignmentFormData((prev) => ({
      ...prev,
      companyIds: prev.companyIds.includes(companyId)
        ? prev.companyIds.filter((id) => id !== companyId)
        : [...prev.companyIds, companyId],
    }));
  };

  if (!isAdmin) return null;

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="space-y-1">
            <h2 className="text-4xl font-headline font-bold text-primary">
              Catálogo de Empresas SAP
            </h2>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Database className="w-4 h-4 text-primary" />
              <p className="text-lg">Gestión de bases de datos CompanyDB de SAP Business One</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleOpenAssignmentDialog}
              variant="outline"
              className="rounded-xl h-12 px-6 font-bold gap-3 border-primary/20 text-primary hover:bg-primary/5"
            >
              <Users className="w-5 h-5" /> Asignar Empresas a Usuario
            </Button>
            <Button
              onClick={handleCreate}
              className="bg-primary hover:bg-primary/90 rounded-xl h-12 px-8 font-bold gap-3 shadow-xl shadow-primary/20 text-white"
            >
              <Plus className="w-5 h-5" /> Nueva Empresa SAP
            </Button>
          </div>
        </header>

        <Card className="border-none shadow-xl rounded-2xl bg-white overflow-hidden">
          <CardHeader className="bg-muted/10 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-headline text-primary">
                  Empresas Configuradas
                </CardTitle>
                <CardDescription className="font-medium">
                  {companies.length} {companies.length === 1 ? 'empresa' : 'empresas'} SAP
                  registradas
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={reload}
                disabled={isLoading}
                className="gap-2"
              >
                <Database className="w-4 h-4" />
                {isLoading ? 'Cargando...' : 'Recargar'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-20 text-center text-muted-foreground italic font-medium">
                Cargando empresas...
              </div>
            ) : companies.length === 0 ? (
              <div className="p-20 text-center text-muted-foreground italic font-medium">
                No hay empresas SAP configuradas. Cree la primera para comenzar.
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-bold py-5">Nombre Amigable</TableHead>
                    <TableHead className="font-bold py-5">CompanyDB</TableHead>
                    <TableHead className="font-bold py-5">Descripción</TableHead>
                    <TableHead className="font-bold py-5">Estado</TableHead>
                    <TableHead className="font-bold py-5 text-right pr-8">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => (
                    <TableRow
                      key={company.id}
                      className="hover:bg-primary/5 transition-colors border-primary/5"
                    >
                      <TableCell className="py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center font-bold text-white shadow-sm">
                            {company.friendlyName[0]}
                          </div>
                          <span className="font-bold text-primary text-base">
                            {company.friendlyName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {company.companyDb}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                        {company.description || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            'uppercase text-[9px] tracking-widest',
                            company.isActive
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          )}
                        >
                          {company.isActive ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-xl hover:bg-primary/5"
                            onClick={() => handleEdit(company)}
                          >
                            <Edit className="w-4 h-4 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-xl hover:bg-red-50 hover:text-red-600"
                            onClick={() => handleDelete(company.id)}
                          >
                            <Trash2 className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="rounded-2xl max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline font-bold text-primary flex items-center gap-3">
                <Building2 className="w-6 h-6" />
                {editingCompany ? 'Editar Empresa SAP' : 'Nueva Empresa SAP'}
              </DialogTitle>
              <DialogDescription className="font-medium">
                {editingCompany
                  ? 'Actualice la configuración de la base de datos SAP'
                  : 'Registre una nueva base de datos CompanyDB de SAP Business One'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">
                    CompanyDB *
                  </Label>
                  <Input
                    placeholder="SBO_DEMO"
                    value={formData.companyDb}
                    onChange={(e) => setFormData({ ...formData, companyDb: e.target.value })}
                    className="h-11 rounded-xl bg-muted/20 border-primary/5 font-mono"
                    required
                    disabled={!!editingCompany}
                  />
                  {editingCompany && (
                    <p className="text-[10px] text-muted-foreground italic">
                      El CompanyDB no se puede modificar después de crear la empresa
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">
                    Nombre Amigable *
                  </Label>
                  <Input
                    placeholder="Empresa Demo"
                    value={formData.friendlyName}
                    onChange={(e) => setFormData({ ...formData, friendlyName: e.target.value })}
                    className="h-11 rounded-xl bg-muted/20 border-primary/5"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">
                    Descripción
                  </Label>
                  <Textarea
                    placeholder="Descripción opcional de la empresa"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="h-24 rounded-xl bg-muted/20 border-primary/5 resize-none"
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl">
                  <div className="space-y-0.5">
                    <p className="font-bold text-sm text-primary">Empresa Activa</p>
                    <p className="text-[10px] text-muted-foreground font-medium">
                      Las empresas inactivas no estarán disponibles para selección
                    </p>
                  </div>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="rounded-xl gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 rounded-xl gap-2 text-white"
                >
                  <Save className="w-4 h-4" />
                  {editingCompany ? 'Actualizar' : 'Crear'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={assignmentDialogOpen} onOpenChange={setAssignmentDialogOpen}>
          <DialogContent className="rounded-2xl max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline font-bold text-primary flex items-center gap-3">
                <Users className="w-6 h-6" />
                Asignar Empresas a Usuario
              </DialogTitle>
              <DialogDescription className="font-medium">
                Seleccione las empresas SAP que el usuario podrá ver y operar
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAssignmentSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">
                    ID de Usuario *
                  </Label>
                  <Input
                    placeholder="user-123"
                    value={assignmentFormData.userId}
                    onChange={(e) =>
                      setAssignmentFormData({ ...assignmentFormData, userId: e.target.value })
                    }
                    className="h-11 rounded-xl bg-muted/20 border-primary/5 font-mono"
                    required
                  />
                </div>
                <div className="space-y-3">
                  <Label className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">
                    Empresas SAP Disponibles
                  </Label>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {companies.filter((c) => c.isActive).length === 0 ? (
                      <p className="text-sm text-muted-foreground italic p-4 bg-muted/20 rounded-xl">
                        No hay empresas activas disponibles para asignar
                      </p>
                    ) : (
                      companies
                        .filter((c) => c.isActive)
                        .map((company) => (
                          <div
                            key={company.id}
                            onClick={() => toggleCompanySelection(company.id)}
                            className={cn(
                              'flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all border',
                              assignmentFormData.companyIds.includes(company.id)
                                ? 'bg-primary/10 border-primary/30'
                                : 'bg-muted/20 border-primary/5 hover:bg-muted/30'
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                                  assignmentFormData.companyIds.includes(company.id)
                                    ? 'bg-primary border-primary'
                                    : 'border-muted-foreground'
                                )}
                              >
                                {assignmentFormData.companyIds.includes(company.id) && (
                                  <Check className="w-3 h-3 text-white" />
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-sm text-primary">
                                  {company.friendlyName}
                                </p>
                                <p className="text-[10px] text-muted-foreground font-mono">
                                  {company.companyDb}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
                {assignmentFormData.companyIds.length > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-xl border border-primary/10">
                    <Check className="w-4 h-4 text-primary" />
                    <p className="text-sm font-medium text-primary">
                      {assignmentFormData.companyIds.length}{' '}
                      {assignmentFormData.companyIds.length === 1 ? 'empresa' : 'empresas'}{' '}
                      seleccionada{assignmentFormData.companyIds.length === 1 ? '' : 's'}
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAssignmentDialogOpen(false)}
                  className="rounded-xl gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={
                    !assignmentFormData.userId || assignmentFormData.companyIds.length === 0
                  }
                  className="bg-primary hover:bg-primary/90 rounded-xl gap-2 text-white"
                >
                  <Save className="w-4 h-4" />
                  Guardar Asignación
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
