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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Filter, 
  FileDown, 
  AlertCircle, 
  Clock, 
  CheckCircle2,
  MoreHorizontal,
  Mail
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

const invoices = [
  { id: 'INV-4421', debtor: 'Initech Systems', amount: 12400, dueDate: '2023-11-15', status: 'Vencida', daysOverdue: 45 },
  { id: 'INV-4422', debtor: 'Massive Dynamic', amount: 5200, dueDate: '2023-12-20', status: 'Pagada', daysOverdue: 0 },
  { id: 'INV-4423', debtor: 'Hooli Inc.', amount: 22000, dueDate: '2023-11-28', status: 'Vencida', daysOverdue: 32 },
  { id: 'INV-4424', debtor: 'Stark Industries', amount: 45000, dueDate: '2024-01-05', status: 'Pendiente', daysOverdue: 0 },
  { id: 'INV-4425', debtor: 'Wayne Enterprises', amount: 8900, dueDate: '2023-12-10', status: 'Vencida', daysOverdue: 20 },
  { id: 'INV-4426', debtor: 'Globex Corp', amount: 3100, dueDate: '2023-10-05', status: 'Vencida', daysOverdue: 86 },
];

export default function InvoicesPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-headline font-bold text-primary">Ledger de Facturación</h2>
            <p className="text-muted-foreground">Monitoreo automatizado de cuentas por cobrar y antigüedad de saldos.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2">
              <FileDown className="w-4 h-4" />
              Exportar (CSV)
            </Button>
            <Button className="bg-accent hover:bg-accent/90">
              Acción de Cobro Masivo
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Vencido Crítico</p>
              <h3 className="text-2xl font-headline font-bold text-primary">$46,400.00</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-full">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Mora Temprana</p>
              <h3 className="text-2xl font-headline font-bold text-primary">$18,200.00</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Pagado este mes</p>
              <h3 className="text-2xl font-headline font-bold text-primary">$104,500.00</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-none">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar por ID de factura, cliente..." className="pl-10" />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Filtros
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>ID Factura</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Fecha Venc.</TableHead>
                <TableHead>Antigüedad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id} className="group">
                  <TableCell className="font-mono font-medium text-primary">
                    {inv.id}
                  </TableCell>
                  <TableCell className="font-semibold">{inv.debtor}</TableCell>
                  <TableCell className="font-mono font-bold">${inv.amount.toLocaleString()}</TableCell>
                  <TableCell className="text-muted-foreground">{inv.dueDate}</TableCell>
                  <TableCell>
                    {inv.daysOverdue > 0 ? (
                      <span className="text-red-600 font-semibold">{inv.daysOverdue} días</span>
                    ) : (
                      <span className="text-green-600">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      inv.status === 'Vencida' ? 'destructive' : 
                      inv.status === 'Pagada' ? 'secondary' : 'outline'
                    } className={inv.status === 'Pagada' ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}>
                      {inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2">
                          <Mail className="w-4 h-4" /> Reenviar Factura
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <AlertCircle className="w-4 h-4" /> Forzar Cobranza IA
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600 gap-2">
                          Anular Factura
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
}
