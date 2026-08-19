'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Cpu,
  Save,
  Server,
  Users,
  UserPlus,
  MoreVertical,
  Link2,
  Zap,
  Mail,
  Building2,
  TrendingUp,
  PhoneCall,
  Plus,
  Settings2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const initialCompanies = [
  { id: 'comp-1', name: 'Serdi S.A. de C.V.', domain: 'serdi.com.mx', status: 'Activa' },
  {
    id: 'comp-2',
    name: 'Heli Equipos Industriales',
    domain: 'heliequiposindustriales.com',
    status: 'Activa',
  },
  { id: 'comp-3', name: 'Merkaaceros', domain: 'merkaaceros.com', status: 'Activa' },
];

const mockUsers = [
  {
    id: 'usr-001',
    name: 'Admin Principal',
    email: 'admin@serdi.com.mx',
    role: 'Administrador',
    status: 'Activo',
    companyIds: ['comp-1', 'comp-2', 'comp-3'],
  },
  {
    id: 'usr-002',
    name: 'Laura Supervisor',
    email: 'l.supervisor@serdi.com.mx',
    role: 'Supervisor',
    status: 'Activo',
    companyIds: ['comp-1', 'comp-2'],
  },
  {
    id: 'usr-003',
    name: 'Juan Cobrador',
    email: 'j.cobranza@merkaaceros.com',
    role: 'Cobrador',
    status: 'Activo',
    companyIds: ['comp-3'],
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTestingSAP, setIsTestingSAP] = useState(false);
  const [activeCompanyId, setActiveCompanyId] = useState('comp-1');
  const [companies] = useState(initialCompanies);

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (role !== 'admin') {
      router.push('/');
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsAdmin(true);
    }

    const handleStorageChange = () => {
      setActiveCompanyId(localStorage.getItem('activeCompanyId') || 'comp-1');
    };
    handleStorageChange();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [router]);

  const selectedCompany = companies.find((c) => c.id === activeCompanyId);
  const filteredUsers = mockUsers.filter((u) => u.companyIds.includes(activeCompanyId));

  const handleTestSAP = () => {
    setIsTestingSAP(true);
    setTimeout(() => {
      setIsTestingSAP(false);
      toast({
        title: `Conexión SAP Exitosa: ${selectedCompany?.name}`,
        description: 'Handshake Service Layer HANA v9.2 verificado.',
      });
    }, 1500);
  };

  const handleSave = () => {
    toast({
      title: 'Configuración Guardada',
      description: `Parámetros para ${selectedCompany?.name} actualizados en el nodo local.`,
    });
  };

  if (!isAdmin) return null;

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="space-y-1">
            <h2 className="text-4xl font-headline font-bold text-primary">Configuración Maestro</h2>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="w-4 h-4 text-primary" />
              <p className="text-lg">
                Configurando entorno para:{' '}
                <span className="text-primary font-bold">{selectedCompany?.name}</span>
              </p>
            </div>
          </div>
          <Button
            onClick={handleSave}
            className="bg-primary hover:bg-primary/90 rounded-xl h-12 px-8 font-bold gap-3 shadow-xl shadow-primary/20 text-white"
          >
            <Save className="w-5 h-5" /> Guardar Todo
          </Button>
        </header>

        <Tabs defaultValue="infra" className="space-y-8">
          <TabsList className="bg-white p-1 shadow-md rounded-2xl border flex flex-row gap-1 h-14 w-full md:w-fit overflow-hidden">
            <TabsTrigger
              value="entities"
              className="flex-1 md:w-44 gap-2 rounded-xl font-bold data-[state=active]:bg-primary data-[state=active]:text-white h-12 transition-all px-6"
            >
              <Building2 className="w-4 h-4" /> Entidades
            </TabsTrigger>
            <TabsTrigger
              value="infra"
              className="flex-1 md:w-44 gap-2 rounded-xl font-bold data-[state=active]:bg-primary data-[state=active]:text-white h-12 transition-all px-6"
            >
              <Server className="w-4 h-4" /> Infraestructura
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="flex-1 md:w-44 gap-2 rounded-xl font-bold data-[state=active]:bg-primary data-[state=active]:text-white h-12 transition-all px-6"
            >
              <Users className="w-4 h-4" /> Colaboradores
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="entities"
            className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300"
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-headline font-bold text-primary">
                  Directorio de Empresas
                </h3>
                <p className="text-muted-foreground font-medium">
                  Gestiona las razones sociales autorizadas en el sistema.
                </p>
              </div>
              <Button className="bg-accent hover:bg-accent/90 rounded-xl gap-2 font-bold shadow-lg shadow-accent/20 h-12 px-6 text-white">
                <Plus className="w-4 h-4" /> Nueva Empresa
              </Button>
            </div>
            <Card className="border-none shadow-xl rounded-2xl bg-white overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-bold py-5">Nombre de la Entidad</TableHead>
                    <TableHead className="font-bold py-5">Dominio Corporativo</TableHead>
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
                            {company.name[0]}
                          </div>
                          <span className="font-bold text-primary text-base">{company.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        @{company.domain}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-50 text-green-700 border-green-200 uppercase text-[9px] tracking-widest">
                          {company.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-xl hover:bg-primary/5"
                        >
                          <Settings2 className="w-5 h-5 text-muted-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent
            value="infra"
            className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-8">
                {/* SAP Configuration */}
                <Card className="border-none shadow-xl rounded-2xl bg-white overflow-hidden border-l-4 border-accent">
                  <CardHeader className="bg-accent/5 p-6 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-accent rounded-xl shadow-lg shadow-accent/20">
                          <Link2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl font-headline text-primary">
                            ERP: SAP B1 (HANA)
                          </CardTitle>
                          <CardDescription className="font-medium">
                            URL y credenciales Service Layer.
                          </CardDescription>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-700 border-green-200 uppercase tracking-tighter text-[9px]">
                        Sincronizado
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">
                          URL Destino (HANA)
                        </Label>
                        <Input
                          placeholder="https://sap-server.local:50000/b1s/v1"
                          className="h-11 rounded-xl bg-muted/20 border-primary/5"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">
                            Sociedad / DB
                          </Label>
                          <Input
                            defaultValue={`SBO_${selectedCompany?.name.split(' ')[0].toUpperCase()}_PROD`}
                            className="h-11 rounded-xl bg-muted/20 border-primary/5"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">
                            Timeout
                          </Label>
                          <Input
                            type="number"
                            defaultValue="30000"
                            className="h-11 rounded-xl bg-muted/20 border-primary/5"
                          />
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleTestSAP}
                      disabled={isTestingSAP}
                      className="w-full h-11 rounded-xl font-bold border-accent/20 text-accent hover:bg-accent/5 gap-2"
                    >
                      <Zap className={cn('w-4 h-4', isTestingSAP && 'animate-pulse')} />
                      {isTestingSAP ? 'Procesando Handshake...' : 'Probar Handshake SAP'}
                    </Button>
                  </CardContent>
                </Card>

                {/* 3CX / Telephony Configuration */}
                <Card className="border-none shadow-xl rounded-2xl bg-white overflow-hidden border-l-4 border-primary">
                  <CardHeader className="bg-primary/5 p-6 border-b">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary rounded-xl shadow-lg shadow-primary/20">
                        <PhoneCall className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-headline text-primary">
                          Telefonía: 3CX Cloud
                        </CardTitle>
                        <CardDescription className="font-medium">
                          Servidor de voz y respuesta automática.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">
                          FQDN / Webclient URL
                        </Label>
                        <Input
                          placeholder="empresa.3cx.mx:5001"
                          className="h-11 rounded-xl bg-muted/20 border-primary/5"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">
                            API Secret Key
                          </Label>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            className="h-11 rounded-xl bg-muted/20 border-primary/5"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">
                            Extensión IA
                          </Label>
                          <Input
                            placeholder="900"
                            className="h-11 rounded-xl bg-muted/20 border-primary/5"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10">
                        <div className="space-y-0.5">
                          <p className="font-bold text-sm text-primary flex items-center gap-2">
                            <Zap className="w-4 h-4 text-accent" /> IA Voice Response
                          </p>
                          <p className="text-[10px] text-muted-foreground font-medium italic">
                            Gemini 2.5 Flash TTS habilitado para llamadas.
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-8">
                {/* Brevo Configuration */}
                <Card className="border-none shadow-xl rounded-2xl bg-white overflow-hidden border-l-4 border-blue-500">
                  <CardHeader className="bg-blue-50 p-6 border-b">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20">
                        <Mail className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-headline text-primary">
                          Brevo (Email & WhatsApp)
                        </CardTitle>
                        <CardDescription className="font-medium">
                          Canal de comunicación masiva.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">
                          API Key (v3)
                        </Label>
                        <Input
                          type="password"
                          placeholder="xkeysib-..."
                          className="h-11 rounded-xl bg-muted/20 border-primary/5"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">
                          Remitente Autorizado
                        </Label>
                        <Input
                          defaultValue={`cobranza@${selectedCompany?.domain}`}
                          className="h-11 rounded-xl bg-muted/20 border-primary/5"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* AI / NLP Intelligence */}
                <Card className="border-none shadow-xl rounded-2xl bg-white overflow-hidden">
                  <CardHeader className="bg-primary/5 p-6 border-b">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary rounded-xl shadow-lg shadow-primary/20">
                        <Cpu className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-headline text-primary">
                          Motor IA & RAG
                        </CardTitle>
                        <CardDescription className="font-medium">
                          Configuración de razonamiento semántico.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl">
                        <div className="space-y-0.5">
                          <p className="font-bold text-sm text-primary">Privacidad Dinámica</p>
                          <p className="text-[10px] text-muted-foreground font-medium">
                            Ofuscación de datos antes de enviar a Gemini.
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl">
                        <div className="space-y-0.5">
                          <p className="font-bold text-sm text-primary">Memoria Vectorial</p>
                          <p className="text-[10px] text-muted-foreground font-medium">
                            Indexación de conversaciones pasadas.
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent
            value="users"
            className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300"
          >
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h3 className="text-2xl font-headline font-bold text-primary">Gestión de Acceso</h3>
                <p className="text-muted-foreground font-medium">
                  Colaboradores con acceso a{' '}
                  <span className="text-primary font-bold">{selectedCompany?.name}</span>
                </p>
              </div>
              <Button className="bg-accent hover:bg-accent/90 rounded-xl gap-2 font-bold shadow-lg shadow-accent/20 h-12 px-6 text-white">
                <UserPlus className="w-4 h-4" /> Registrar Usuario
              </Button>
            </div>

            <Card className="border-none shadow-xl rounded-2xl bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/10">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-bold py-5">Colaborador</TableHead>
                      <TableHead className="font-bold py-5">Rol</TableHead>
                      <TableHead className="font-bold py-5">Estado</TableHead>
                      <TableHead className="font-bold py-5 text-right pr-8">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <TableRow
                          key={user.id}
                          className="hover:bg-primary/5 transition-colors border-primary/5"
                        >
                          <TableCell className="py-4">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary shadow-sm">
                                {user.name[0]}
                              </div>
                              <div>
                                <div className="font-bold text-primary text-base">{user.name}</div>
                                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge
                              className={cn(
                                'font-bold uppercase text-[9px] tracking-widest px-3 py-1',
                                user.role === 'Administrador'
                                  ? 'bg-primary text-white'
                                  : user.role === 'Supervisor'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-200 text-slate-700'
                              )}
                            >
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-2">
                              <div
                                className={cn(
                                  'w-2 h-2 rounded-full',
                                  user.status === 'Activo'
                                    ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'
                                    : 'bg-slate-300'
                                )}
                              />
                              <span className="text-xs font-bold text-primary/70">
                                {user.status}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right py-4 pr-8">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-10 w-10 rounded-xl hover:bg-primary/5"
                                >
                                  <MoreVertical className="w-5 h-5 text-muted-foreground" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="rounded-xl border-primary/10 w-48 p-2"
                              >
                                <DropdownMenuItem className="rounded-lg font-bold gap-2 focus:bg-primary/5 focus:text-primary cursor-pointer">
                                  <TrendingUp className="w-4 h-4" /> Desempeño
                                </DropdownMenuItem>
                                <DropdownMenuItem className="rounded-lg font-bold gap-2 focus:bg-primary/5 focus:text-primary cursor-pointer">
                                  <Building2 className="w-4 h-4" /> Gestionar Empresas
                                </DropdownMenuItem>
                                <DropdownMenuItem className="rounded-lg font-bold gap-2 text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer">
                                  Suspender Cuenta
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="py-20 text-center text-muted-foreground italic font-medium"
                        >
                          Sin usuarios vinculados a esta empresa.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
