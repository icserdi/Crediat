'use client';

import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  History, 
  FileText, 
  BrainCircuit, 
  Send, 
  Phone, 
  MoreVertical,
  Paperclip,
  HandCoins,
  Zap,
  ArrowRight
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useState, use } from "react";
import { generateCollectionMessage } from "@/ai/flows/generate-collection-message-flow";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function DebtorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [llmUsed, setLlmUsed] = useState("");

  const debtor = {
    name: "Initech Systems",
    id: id || "debtor-123",
    riskScore: 0.85,
    daysOverdue: 45,
    totalDue: "$15,400.00",
    history: [
      { date: "Oct 12, 2023", event: "WhatsApp enviado", detail: "Recordatorio pago (D+15)", status: "Entregado" },
      { date: "Sep 28, 2023", event: "Llamada Agente IA", detail: "Promesa de pago para Oct 10", status: "Exitoso" },
      { date: "Sep 15, 2023", event: "Campaña Email", detail: "Estado de cuenta mensual", status: "Abierto" },
    ],
    contextualMemory: [
      "El cliente prefiere contacto vía WhatsApp entre 9am-11am.",
      "Respondió positivamente a tono 'Recordatorio Profesional' anteriormente.",
      "Mencionó problemas temporales de flujo en grabación #2234.",
      "Siempre paga facturas menores a $5k inmediato; mayores requieren ciclo aprobación."
    ]
  };

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    try {
      const result = await generateCollectionMessage({
        debtorId: debtor.id,
        riskScore: debtor.riskScore,
        daysOverdue: debtor.daysOverdue,
        invoiceAmount: 15400,
        invoiceCurrency: 'USD',
        invoiceDueDate: '2023-11-15',
        communicationChannel: 'WhatsApp'
      });
      setAiMessage(result.message);
      setLlmUsed(result.llmUsed);
    } catch (error) {
      toast({
        title: "Error de Generación",
        description: "No se pudo contactar al gestor de LLM. Revisa conexión o estado del nodo local.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center text-white text-3xl font-bold shadow-2xl shadow-primary/30">
              {debtor.name[0]}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-4xl font-headline font-bold text-primary">{debtor.name}</h2>
                <Badge className="bg-red-100 text-red-700 border-red-200 uppercase font-black tracking-tighter text-[10px]">Riesgo Crítico</Badge>
              </div>
              <p className="text-muted-foreground text-lg flex items-center gap-2 font-medium">
                ID: {debtor.id} • <span className="text-red-600 font-bold">{debtor.daysOverdue} Días de Atraso</span>
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl"><Phone className="w-5 h-5 text-primary" /></Button>
            <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl"><MoreVertical className="w-5 h-5 text-primary" /></Button>
            <Button className="bg-accent hover:bg-accent/90 shadow-xl shadow-accent/20 h-12 px-6 font-bold rounded-xl text-white">Intervención Manual</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-none shadow-xl overflow-hidden rounded-2xl bg-white">
              <CardHeader className="bg-primary/5 border-b p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary rounded-lg shadow-md shadow-primary/20">
                      <BrainCircuit className="w-5 h-5 text-white" />
                    </div>
                    <CardTitle className="text-xl font-headline text-primary">Gestor de Estrategia IA</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-black tracking-widest bg-white border-primary/20 text-primary">
                    {llmUsed || 'LISTO'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="bg-accent/5 p-6 rounded-2xl mb-8 flex gap-6 items-start border border-accent/10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Zap className="w-24 h-24 text-accent" />
                  </div>
                  <BrainCircuit className="w-12 h-12 text-accent shrink-0" />
                  <div className="text-sm space-y-3 relative z-10">
                    <p className="font-black text-accent uppercase tracking-widest text-[10px]">Recomendación Contextual</p>
                    <p className="text-primary text-base font-medium leading-relaxed">
                      "Acme Corp tiene un riesgo alto (0.85). La búsqueda semántica sugiere un mensaje de WhatsApp firme pero cooperativo. Respondieron bien a extensiones antes. Evita contacto temprano."
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-black uppercase tracking-widest text-muted-foreground">Contenido Generado por IA</label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleGenerateAI} 
                      disabled={isGenerating}
                      className="text-accent hover:text-accent hover:bg-accent/5 font-bold gap-2"
                    >
                      <Zap className={cn("w-4 h-4", isGenerating && "animate-spin")} />
                      {isGenerating ? "Razonando..." : "Regenerar Estrategia"}
                    </Button>
                  </div>
                  <div className="relative">
                    <div className="absolute top-3 right-3 flex gap-2 z-10">
                      <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20 font-bold">Urgente</Badge>
                    </div>
                    <Textarea 
                      value={aiMessage}
                      onChange={(e) => setAiMessage(e.target.value)}
                      placeholder="La IA generará un mensaje personalizado basado en el vector de memoria del deudor..."
                      className="min-h-[180px] p-6 text-base font-medium leading-relaxed bg-muted/20 border-primary/10 rounded-2xl resize-none focus:ring-accent"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex gap-2">
                      <Button variant="outline" className="rounded-xl font-bold gap-2">
                        <History className="w-4 h-4" />
                        Cambiar Tono
                      </Button>
                      <Button variant="outline" className="rounded-xl font-bold gap-2">
                        <Paperclip className="w-4 h-4" />
                        Adjuntar Factura
                      </Button>
                    </div>
                    <Button className="bg-primary hover:bg-primary/90 rounded-xl px-8 font-bold gap-3 shadow-xl shadow-primary/20 h-12 w-full sm:w-auto">
                      <Send className="w-4 h-4" />
                      Encolar a Redis
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="history">
              <TabsList className="bg-white p-1 shadow-md rounded-2xl border flex gap-1 h-14">
                <TabsTrigger value="history" className="flex-1 gap-2 rounded-xl font-bold data-[state=active]:bg-primary data-[state=active]:text-white h-12 transition-all">
                  <History className="w-4 h-4" /> Historial de Interacción
                </TabsTrigger>
                <TabsTrigger value="invoices" className="flex-1 gap-2 rounded-xl font-bold data-[state=active]:bg-primary data-[state=active]:text-white h-12 transition-all">
                  <FileText className="w-4 h-4" /> Facturas Activas
                </TabsTrigger>
                <TabsTrigger value="memory" className="flex-1 gap-2 rounded-xl font-bold data-[state=active]:bg-primary data-[state=active]:text-white h-12 transition-all">
                  <BrainCircuit className="w-4 h-4" /> Memoria Vectorial
                </TabsTrigger>
              </TabsList>
              <TabsContent value="history" className="mt-6">
                <Card className="border-none shadow-xl rounded-2xl bg-white overflow-hidden">
                  <CardContent className="p-8">
                    <div className="space-y-8">
                      {debtor.history.map((item, idx) => (
                        <div key={idx} className="flex gap-6 relative">
                          {idx !== debtor.history.length - 1 && (
                            <div className="absolute left-6 top-12 bottom-[-32px] w-px bg-border dashed" />
                          )}
                          <div className="w-12 h-12 rounded-2xl bg-muted/30 flex items-center justify-center shrink-0 border border-primary/5 shadow-sm group hover:bg-accent transition-colors">
                            {item.event.includes('WhatsApp') ? <MessageSquare className="w-6 h-6 text-primary group-hover:text-white" /> : <Phone className="w-6 h-6 text-primary group-hover:text-white" />}
                          </div>
                          <div className="flex-1 bg-muted/5 p-4 rounded-2xl border border-primary/5">
                            <div className="flex justify-between items-start mb-1">
                              <h4 className="font-bold text-primary text-lg">{item.event}</h4>
                              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">{item.date}</span>
                            </div>
                            <p className="text-sm text-muted-foreground font-medium mb-3">{item.detail}</p>
                            <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">{item.status}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="memory" className="mt-6">
                <Card className="border-none shadow-xl rounded-2xl bg-white p-8">
                   <header className="mb-8">
                    <h3 className="text-xl font-headline font-bold text-primary mb-2">Clusters de Memoria Semántica</h3>
                    <p className="text-sm text-muted-foreground font-medium italic">Patrones clave extraídos de la base de datos vectorial.</p>
                   </header>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {debtor.contextualMemory.map((mem, i) => (
                       <div key={i} className="flex gap-4 items-start p-5 bg-primary/5 rounded-2xl border border-primary/10 hover:border-accent transition-colors group">
                         <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0 group-hover:scale-150 transition-transform" />
                         <span className="text-sm text-primary/80 font-bold leading-relaxed">{mem}</span>
                       </div>
                     ))}
                   </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-8">
            <Card className="border-none shadow-2xl bg-primary text-white overflow-hidden relative rounded-3xl">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <HandCoins className="w-32 h-32" />
              </div>
              <CardHeader className="p-8 pb-0">
                <CardTitle className="text-xl font-headline tracking-widest uppercase text-accent font-black">Exposición Financiera</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6 relative z-10">
                <div className="space-y-1">
                  <span className="text-white/40 text-[10px] uppercase font-black tracking-widest">Saldo Pendiente Total</span>
                  <div className="text-5xl font-headline font-black">{debtor.totalDue}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/10 rounded-2xl border border-white/5 backdrop-blur-sm">
                    <span className="text-white/40 text-[10px] uppercase font-black tracking-widest">Índice Riesgo</span>
                    <div className="font-black text-xl text-red-400">0.85</div>
                  </div>
                  <div className="p-4 bg-white/10 rounded-2xl border border-white/5 backdrop-blur-sm">
                    <span className="text-white/40 text-[10px] uppercase font-black tracking-widest">Aporte DSO</span>
                    <div className="font-black text-xl text-accent">+12d</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl rounded-2xl bg-white overflow-hidden">
              <CardHeader className="p-6 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-primary">
                  <HandCoins className="w-4 h-4 text-accent" />
                  Próxima Promesa
                </CardTitle>
                <Badge className="bg-accent/10 text-accent text-[10px]">VERIFICADA</Badge>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="bg-orange-50 border border-orange-100 p-5 rounded-2xl space-y-2">
                  <div className="text-sm font-bold text-orange-800">Promesa de pago $5,400</div>
                  <div className="text-xs text-orange-600 font-medium">Esperado para Nov 22, 2023</div>
                  <div className="flex items-center gap-2 pt-2">
                    <div className="h-1 flex-1 bg-orange-200 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 w-[65%]" />
                    </div>
                    <span className="text-[10px] font-black text-orange-700">65% Conf.</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full rounded-xl font-bold text-xs h-10 border-primary/10">Modificar Plan</Button>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl rounded-2xl bg-white overflow-hidden">
              <CardHeader className="p-6 border-b">
                <CardTitle className="text-base font-bold text-primary">Archivo Seguro (MinIO)</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                 {[
                   { name: 'Factura_#4421.pdf', size: '1.2MB', type: 'Factura' },
                   { name: 'Captura_Pago_Oct.png', size: '450KB', type: 'Evidencia' },
                   { name: 'Notificacion_Legal.pdf', size: '2.4MB', type: 'Legal' }
                 ].map((file, i) => (
                    <div key={i} className="flex items-center justify-between p-3 hover:bg-primary/5 rounded-xl cursor-pointer group transition-all border border-transparent hover:border-primary/5">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                        <div>
                          <p className="text-sm font-bold text-primary">{file.name}</p>
                          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">{file.type} • {file.size}</p>
                        </div>
                      </div>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground group-hover:text-accent">
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                 ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
