const ALLOWED_DOMAINS = ['serdi.com.mx', 'heliequiposindustriales.com', 'merkaaceros.com'];

export function validateDomain(email: string): boolean {
  const domain = email.split('@')[1];
  return ALLOWED_DOMAINS.includes(domain);
}

export function inferRole(email: string): 'admin' | 'supervisor' | 'cobrador' {
  if (email.includes('admin') || email.startsWith('admin')) return 'admin';
  if (email.includes('supervisor')) return 'supervisor';
  return 'cobrador';
}
