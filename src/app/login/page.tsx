'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Zap, ShieldCheck, Mail, Lock, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (response.ok) {
        setStep(2);
        toast({
          title: "Código enviado",
          description: data.message || `Código enviado a ${email}`,
        });
      } else if (response.status === 403) {
        toast({
          title: "Dominio no autorizado",
          description: "Solo se permiten correos de dominios corporativos autorizados.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: data.message || 'Error al enviar código',
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con el servidor",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: code }),
      });
      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('userRole', data.role);
        localStorage.setItem('userEmail', data.email);
        toast({
          title: "Acceso concedido",
          description: `Iniciando sesión como ${data.role.toUpperCase()}...`,
        });
        router.push("/");
      } else {
        toast({
          title: "Código inválido",
          description: data.message || "El código ingresado no es correcto.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con el servidor",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecovery = () => {
    toast({
      title: "Recuperación enviada",
      description: "Si el correo está registrado, recibirá instrucciones en breve.",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary shadow-2xl shadow-primary/20 mb-4">
            <Zap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-headline font-bold text-primary">Recupera AI Pro</h1>
          <p className="text-muted-foreground font-medium uppercase tracking-widest text-[10px]">Central de Cobranza Inteligente</p>
        </div>

        <Card className="border-none shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-primary/5 p-8 border-b text-center">
            <CardTitle className="text-xl font-headline text-primary">
              {step === 1 ? "Acceso al Sistema" : "Validar Identidad"}
            </CardTitle>
            <CardDescription>
              {step === 1 
                ? "Ingresa tu correo corporativo para continuar" 
                : `Ingresa el código enviado a ${email}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            {step === 1 ? (
              <form onSubmit={handleSendCode} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Correo Institucional</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="email"
                      type="email" 
                      placeholder="usuario@serdi.com.mx" 
                      className="pl-10 h-12 rounded-xl bg-muted/20 border-primary/5 focus:ring-accent"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">Acceso restringido a dominios autorizados.</p>
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 font-bold gap-2 shadow-xl shadow-primary/20"
                  disabled={isLoading}
                >
                  {isLoading ? "Enviando código..." : "Siguiente"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="code" className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Código de Validación</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="code"
                      type="text" 
                      placeholder="000000" 
                      maxLength={6}
                      className="pl-10 h-12 rounded-xl bg-muted/20 border-primary/5 font-mono text-center tracking-[1em] text-lg focus:ring-accent"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full h-12 rounded-xl bg-accent hover:bg-accent/90 font-bold gap-2 shadow-xl shadow-accent/20"
                >
                  {isLoading ? "Validando..." : "Acceder"}
                  <ShieldCheck className="w-4 h-4" />
                </Button>
                <button 
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full text-xs text-muted-foreground hover:text-primary transition-colors font-bold"
                >
                  Regresar a email
                </button>
              </form>
            )}
          </CardContent>
          <CardFooter className="bg-muted/5 p-6 border-t flex flex-col gap-2">
            <button 
              onClick={handleRecovery}
              className="text-xs font-bold text-primary hover:text-accent transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </button>
            <div className="flex items-center gap-2 text-[9px] text-muted-foreground uppercase font-black tracking-tighter">
              <ShieldCheck className="w-3 h-3 text-green-600" />
              Brevo Email Transaccional
            </div>
          </CardFooter>
        </Card>

        <p className="text-center text-[10px] text-muted-foreground uppercase font-medium tracking-widest">
          &copy; 2026 Recupera AI Pro. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}