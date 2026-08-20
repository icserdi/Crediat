'use client';

import {
  LayoutDashboard,
  Users,
  FileText,
  MessageSquare,
  TrendingUp,
  Settings,
  ShieldCheck,
  Zap,
  LogOut,
  Building2,
  CreditCard,
  HandCoins,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useCallback } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SapCompany } from '@/lib/sap/types';

type UserRole = 'admin' | 'supervisor' | 'cobrador';

type CompanyOption = {
  id: string;
  name: string;
  companyDb: string;
};

const navItems = [
  {
    icon: CreditCard,
    label: 'Solicitudes de Crédito',
    href: '/credit/applications',
    roles: ['admin', 'supervisor'],
  },
  {
    icon: HandCoins,
    label: 'Otorgamiento de Crédito',
    href: '/credit/grant',
    roles: ['admin', 'supervisor'],
  },
  {
    icon: BarChart3,
    label: 'Reporte de Crédito',
    href: '/credit/report',
    roles: ['admin', 'supervisor'],
  },
  {
    icon: LayoutDashboard,
    label: 'Tablero Control',
    href: '/',
    roles: ['admin', 'supervisor', 'cobrador'],
  },
  {
    icon: Users,
    label: 'Cartera de Deudores',
    href: '/debtors',
    roles: ['admin', 'supervisor', 'cobrador'],
  },
  {
    icon: FileText,
    label: 'Libro de Facturas',
    href: '/invoices',
    roles: ['admin', 'supervisor', 'cobrador'],
  },
  {
    icon: MessageSquare,
    label: 'Bandeja Unificada',
    href: '/interactions',
    roles: ['admin', 'supervisor', 'cobrador'],
  },
  { icon: TrendingUp, label: 'IA Analítica', href: '/analytics', roles: ['admin', 'supervisor'] },
  { icon: ShieldCheck, label: 'Logs de Auditoría', href: '/audit', roles: ['admin'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [role, setRole] = useState<UserRole>('admin');
  const [activeCompanyId, setActiveCompanyId] = useState<string>('');
  const [userCompanies, setUserCompanies] = useState<CompanyOption[]>([]);

  const loadUserCompanies = useCallback(async () => {
    try {
      // Cargar todas las empresas SAP activas
      const response = await fetch('/api/admin/sap-companies');
      const data = await response.json();

      if (response.ok && data.companies) {
        const activeCompanies = data.companies
          .filter((c: SapCompany) => c.isActive)
          .map((c: SapCompany) => ({
            id: c.id,
            name: c.friendlyName,
            companyDb: c.companyDb,
          }));

        // En MVP, mostramos todas las empresas activas
        // En producción, filtrar por asignación de usuario
        setUserCompanies(activeCompanies);

        // Restaurar selección guardada o seleccionar la primera
        const savedCompany = localStorage.getItem('activeCompanyId');
        if (savedCompany && activeCompanies.find((c: CompanyOption) => c.id === savedCompany)) {
          setActiveCompanyId(savedCompany);
        } else if (activeCompanies.length > 0) {
          setActiveCompanyId(activeCompanies[0].id);
          localStorage.setItem('activeCompanyId', activeCompanies[0].id);
        }
      } else {
        // Fallback a datos mock si falla la API
        console.warn('Failed to load SAP companies, using fallback');
        const fallbackCompanies: CompanyOption[] = [
          { id: 'comp-1', name: 'SERDI', companyDb: 'SBO_SERDI' },
          { id: 'comp-2', name: 'HELI', companyDb: 'SBO_HELI' },
          { id: 'comp-3', name: 'MERKABYD', companyDb: 'SBO_MERKABYD' },
        ];
        setUserCompanies(fallbackCompanies);
        setActiveCompanyId(fallbackCompanies[0].id);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
      // Fallback a datos mock en caso de error
      const fallbackCompanies: CompanyOption[] = [
        { id: 'comp-1', name: 'SERDI', companyDb: 'SBO_SERDI' },
      ];
      setUserCompanies(fallbackCompanies);
      setActiveCompanyId(fallbackCompanies[0].id);
    }
  }, []);

  useEffect(() => {
    const savedRole = localStorage.getItem('userRole') as UserRole;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (savedRole) setRole(savedRole);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUserCompanies();
  }, [loadUserCompanies]);

  const handleCompanyChange = (id: string) => {
    setActiveCompanyId(id);
    localStorage.setItem('activeCompanyId', id);
    const company = userCompanies.find((c: CompanyOption) => c.id === id);
    toast({
      title: 'Empresa Cambiada',
      description: `Ahora operando en: ${company?.name || 'Empresa seleccionada'}`,
    });
    window.dispatchEvent(new Event('storage'));
  };

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('activeCompanyId');
    toast({
      title: 'Sesión cerrada',
      description: 'Has salido del sistema de forma segura.',
    });
    router.push('/login');
  };

  const filteredNavItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <div className="w-72 bg-primary text-white flex flex-col h-screen sticky top-0 shrink-0 shadow-2xl z-20 overflow-hidden">
      <div className="p-8 border-b border-white/5 relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-accent/30" />
        <Link href="/" className="flex items-center gap-3 group mb-8">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-headline font-bold leading-tight">Crediat</h1>
            <span className="text-[10px] uppercase tracking-widest font-black text-accent/80">
              {role === 'admin'
                ? 'Administrador'
                : role === 'supervisor'
                  ? 'Supervisor'
                  : 'Cobrador'}
            </span>
          </div>
        </Link>

        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">
            Unidad de Negocio
          </span>
          <Select value={activeCompanyId} onValueChange={handleCompanyChange}>
            <SelectTrigger className="w-full bg-white/5 border-white/10 h-12 rounded-xl text-white font-bold focus:ring-accent group">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-accent" />
                <SelectValue placeholder="Seleccionar Empresa" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-primary border-white/10 text-white rounded-xl">
              {userCompanies.map((c) => (
                <SelectItem
                  key={c.id}
                  value={c.id}
                  className="font-bold focus:bg-white/10 focus:text-white cursor-pointer"
                >
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 py-8 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const isActive =
            pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative',
                isActive
                  ? 'bg-white/10 text-white font-bold'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-accent rounded-r-full shadow-[0_0_10px_rgba(250,147,25,0.5)]" />
              )}
              <item.icon
                className={cn(
                  'w-5 h-5 transition-transform duration-300 group-hover:scale-110',
                  isActive ? 'text-accent' : 'text-white/40'
                )}
              />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-white/5 bg-white/5 space-y-2">
        {role === 'admin' && (
          <Link
            href="/settings"
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative',
              pathname === '/settings'
                ? 'bg-white/10 text-white font-bold'
                : 'text-white/60 hover:bg-white/5 hover:text-white'
            )}
          >
            {pathname === '/settings' && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-accent rounded-r-full shadow-[0_0_10px_rgba(250,147,25,0.5)]" />
            )}
            <Settings
              className={cn(
                'w-5 h-5 transition-transform duration-300 group-hover:scale-110',
                pathname === '/settings' ? 'text-accent' : 'text-white/40'
              )}
            />
            <span className="text-sm">Configuración Sistema</span>
          </Link>
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-white/40 hover:text-red-400 hover:bg-red-500/10"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm">Cerrar Sesión</span>
        </button>

        <div className="p-4 bg-primary/40 rounded-2xl border border-white/5 space-y-2 mt-4">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-white/30">
            <span>Seguridad On-Prem</span>
            <span className="text-green-400">Activa</span>
          </div>
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="w-[98%] h-full bg-green-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
