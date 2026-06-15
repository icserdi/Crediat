'use client';

import { Sidebar } from "@/components/layout/sidebar";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  UserPlus, 
  Filter, 
  ArrowUpDown, 
  TrendingUp,
  Building2,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import type { SapBusinessPartnerDto } from "@/lib/sap/types";

type Debtor = {
  id: string;
  name: string;
  email: string | null;
  balance: number;
  risk: string;
  score: number;
  status: string;
  phone: string | null;
  cellular: string | null;
  creditLine: number | null;
  groupCode: number | null;
};

export default function DebtorsPage() {
  const { toast } = useToast();
  const [activeCompanyId, setActiveCompanyId] = useState('');
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleStorageChange = () => {
      const id = localStorage.getItem('activeCompanyId') || '';
      if (id !== activeCompanyId) {
        setActiveCompanyId(id);
        loadDebtors(id);
      }
    };

    handleStorageChange();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [activeCompanyId]);

  const loadDebtors = async (companyId?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (companyId) params.append('companyId', companyId);
      params.append('top', '100');

      const response = await fetch(`/api/debtors?${params.toString()}`);
      const data = await response.json();

        if (response.ok) {
          // Transformar datos de SAP al formato interno
          const transformedDebtors: Debtor[] = data.debtors.map((bp: SapBusinessPartnerDto) => {
            const balance = bp.CurrentAccountBalance || 0;
            const creditLine = bp.CreditLimit || 0;
          
          // Calcular riesgo basado en balance y límite de crédito
          let risk = 'Bajo';
          let score = 0;
          let status = 'Activo';

          if (balance > creditLine * 0.8 && creditLine > 0) {
            risk = 'Alto';
            score = 0.85;
            status = 'Vencido';
          } else if (balance > creditLine * 0.5 && creditLine > 0) {
            risk = 'Moderado';
            score = 0.5;
            status = 'Activo';
          } else if (balance === 0) {
            risk = 'Bajo';
            score = 0.05;
            status = 'Liquidado';
          } else {
            risk = 'Bajo';
            score = 0.15;
            status = 'Activo';
          }

          return {
            id: bp.CardCode,
            name: bp.CardName,
            email: bp.EmailAddress || null,
            balance,
            risk,
            score,
            status,
            phone: bp.Phone1 || null,
            cellular: bp.Cellular || null,
            creditLine,
            groupCode: bp.GroupCode || null,
          };
        });

        setDebtors(transformedDebtors);
      } else {
        setError(data.message || 'Error al cargar deudores');
        toast({
          title: "Error al cargar deudores",
          description: data.message || 'Error desconocido',
          variant: "destructive",
        });
      }
    } catch (err) {
      setError('Error de conexión al servidor');
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con el servidor",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadDebtors(activeCompanyId);
  };

  const filteredDebtors = debtors.filter(debtor =>
    debtor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    debtor.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (debtor.email && debtor.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-4xl font-headline font-bold text-primary">Cartera de Deudores</h2>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="w-4 h-4" />
              <p className="text-lg">Gestión de cuentas para la unidad de negocio seleccionada.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleRefresh} 
              disabled={isLoading}
              variant="outline"
              className="h-11 font-semibold gap-2"
            >
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
              {isLoading ? "Cargando..." : "Recargar"}
            </Button>
            <Button className="bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20 h-11 px-6 font-bold">
              <UserPlus className="w-4 h-4 mr-2" />
              Dar de Alta Deudor
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-none">
          <div className="p-6 border-b bg-muted/5">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por nombre, ID o email..." 
                  className="pl-10 h-11 bg-white border-primary/10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="h-11 font-semibold gap-2">
                  <Filter className="w-4 h-4" />
                  Filtrar Riesgo
                </Button>
                <Button variant="outline" className="h-11 font-semibold gap-2">
                  <ArrowUpDown className="w-4 h-4" />
                  Ordenar Score
                </Button>
              </div>
            </div>
          </div>

          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-4 font-bold text-primary">Información Deudor</TableHead>
                <TableHead className="py-4 font-bold text-primary">Estado Cuenta</TableHead>
                <TableHead className="py-4 font-bold text-primary">Saldo Total</TableHead>
                <TableHead className="py-4 font-bold text-primary">Score Riesgo IA</TableHead>
                <TableHead className="py-4 font-bold text-primary text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                      <p className="text-muted-foreground font-medium">Cargando deudores desde SAP...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <AlertCircle className="w-8 h-8 text-red-500" />
                      <p className="text-red-600 font-medium">{error}</p>
                      <Button onClick={handleRefresh} variant="outline" size="sm" className="gap-2">
                        <RefreshCw className="w-4 h-4" />
                        Reintentar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredDebtors.length > 0 ? filteredDebtors.map((debtor) => (
                <TableRow key={debtor.id} className="group hover:bg-primary/5 transition-colors cursor-pointer border-primary/5">
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-sm shadow-md">
                        {debtor.name[0]}
                      </div>
                      <div>
                        <div className="font-bold text-primary text-base group-hover:text-accent transition-colors">{debtor.name}</div>
                        <div className="text-xs text-muted-foreground font-medium">
                          {debtor.email || 'Sin email'}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(
                      "px-3 py-1 font-bold",
                      debtor.status === 'Vencido' ? 'border-red-200 text-red-700 bg-red-50' : 
                      debtor.status === 'Legal' ? 'border-purple-200 text-purple-700 bg-purple-50' : 
                      debtor.status === 'Liquidado' ? 'border-green-200 text-green-700 bg-green-50' : 
                      'border-blue-200 text-blue-700 bg-blue-50'
                    )}>
                      {debtor.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono font-bold text-primary">
                    ${debtor.balance.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full transition-all duration-1000",
                            debtor.score > 0.7 ? "bg-red-500" : debtor.score > 0.4 ? "bg-orange-500" : "bg-green-500"
                          )}
                          style={{ width: `${debtor.score * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-black font-mono">{(debtor.score * 100).toFixed(0)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/debtors/${debtor.id}`}>
                      <Button variant="ghost" size="sm" className="font-bold text-primary hover:text-accent hover:bg-transparent gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Analizar
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center text-muted-foreground italic">
                    {searchQuery ? 'No se encontraron deudores que coincidan con la búsqueda.' : 'No hay deudores registrados para esta empresa.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          <div className="p-6 bg-muted/5 border-t flex justify-between items-center">
            <p className="text-sm text-muted-foreground font-medium">
              Mostrando {filteredDebtors.length} de {debtors.length} deudores
              {searchQuery && ` (filtrados de ${debtors.length} total)`}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>Anterior</Button>
              <Button variant="outline" size="sm" disabled>Siguiente</Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
