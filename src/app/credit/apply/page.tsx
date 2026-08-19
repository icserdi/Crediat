'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useCreditApplications } from '@/hooks/use-credit-applications';
import { REQUIRED_DOCUMENTS, type PersonType } from '@/lib/credit/application';
import { CheckCircle2, FileText, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

type FormState = {
  personType: PersonType;
  fullName: string;
  city: string;
  state: string;
  advisor: string;
  email: string;
  phone: string;
  rfc: string;
  files: File[];
};

const initialForm: FormState = {
  personType: 'fisica',
  fullName: '',
  city: '',
  state: '',
  advisor: '',
  email: '',
  phone: '',
  rfc: '',
  files: [],
};

const ADVISORS = ['SERDI', 'Cobranza', 'Ventas', 'Otro'];

export default function CreditApplyPage() {
  const { toast } = useToast();
  const { create, isSubmitting } = useCreditApplications();
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitted, setSubmitted] = useState(false);

  const documents = REQUIRED_DOCUMENTS[form.personType];

  const update = (field: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setForm((prev) => ({ ...prev, files }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await create({
      personType: form.personType,
      fullName: form.fullName,
      city: form.city,
      state: form.state,
      advisor: form.advisor,
      email: form.email,
      phone: form.phone,
      rfc: form.rfc,
      files: form.files,
    });

    if (result.ok) {
      setSubmitted(true);
      toast({
        title: 'Solicitud enviada',
        description: 'Su solicitud de crédito ha sido registrada correctamente.',
      });
    } else {
      toast({
        title: 'Error',
        description: result.message || 'No se pudo enviar la solicitud.',
        variant: 'destructive',
      });
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-lg border-none shadow-2xl">
          <CardContent className="p-10 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-headline font-bold text-primary">Solicitud Enviada</h2>
            <p className="text-muted-foreground">
              Gracias por enviar su solicitud de crédito. Nuestro equipo la revisará y se pondrá en
              contacto con usted lo antes posible.
            </p>
            <Button
              onClick={() => {
                setSubmitted(false);
                setForm(initialForm);
              }}
              className="mt-4"
            >
              Nueva Solicitud
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary">
            Solicitud de Crédito
          </h1>
          <p className="text-muted-foreground">
            Antes de llenar el formulario, lea cuidadosamente la lista de documentos requeridos.
          </p>
        </header>

        {/* Requisitos según tipo de persona */}
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <FileText className="w-5 h-5" />
              Documentos requeridos (
              {form.personType === 'fisica' ? 'Persona Física' : 'Persona Moral'})
            </CardTitle>
            <CardDescription>
              Deberá adjuntarlos escaneados. Puede seleccionar varios archivos o comprimirlos en
              .zip/.rar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {documents.map((doc) => (
                <li key={doc} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span>{doc}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-primary">Formulario de Solicitud de Crédito</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Tipo de persona */}
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">
                  Tipo de persona *
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {(['fisica', 'moral'] as PersonType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => update('personType', t)}
                      className={cn(
                        'p-4 rounded-xl border text-sm font-semibold transition-all',
                        form.personType === t
                          ? 'bg-primary text-white border-primary'
                          : 'bg-muted/20 border-primary/10 text-muted-foreground hover:bg-muted/30'
                      )}
                    >
                      {t === 'fisica' ? 'Persona Física' : 'Persona Moral'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground">
                  Nombre Completo o Razón Social *
                </Label>
                <Input
                  value={form.fullName}
                  onChange={(e) => update('fullName', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">RFC</Label>
                <Input
                  placeholder="Ej. GARC840101HDFRRN01"
                  value={form.rfc}
                  onChange={(e) => update('rfc', e.target.value)}
                  maxLength={13}
                />
                <p className="text-[10px] text-muted-foreground">
                  Opcional. Se valida formato y, si hay proveedor configurado, estatus fiscal.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">
                    Ciudad *
                  </Label>
                  <Input
                    value={form.city}
                    onChange={(e) => update('city', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">
                    Estado *
                  </Label>
                  <Input
                    value={form.state}
                    onChange={(e) => update('state', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">
                  Asesor(a) que le atiende *
                </Label>
                <Input
                  list="advisors"
                  value={form.advisor}
                  onChange={(e) => update('advisor', e.target.value)}
                  required
                />
                <datalist id="advisors">
                  {ADVISORS.map((a) => (
                    <option key={a} value={a} />
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">
                    Correo electrónico *
                  </Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">
                    Teléfono *
                  </Label>
                  <Input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => update('phone', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">
                  Archivos adjuntos
                </Label>
                <Input type="file" multiple onChange={handleFileChange} />
                {form.files.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {form.files.length} archivo(s) seleccionado(s):{' '}
                    {form.files.map((f) => f.name).join(', ')}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary/90 h-12 font-bold gap-2"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Enviando...' : 'Enviar solicitud'}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Favor de llenar todos los campos y adjuntar los archivos correspondientes, de lo
                contrario la solicitud será rechazada. Para dudas o apoyo, escriba a
                atencion.aclientes@serdi.com.mx
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
