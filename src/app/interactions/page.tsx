'use client';

import { Sidebar } from "@/components/layout/sidebar";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Phone, 
  Mail, 
  Search, 
  Paperclip, 
  Send,
  User,
  Info,
  Filter,
  Mic,
  Volume2,
  Play,
  Download,
  Clock,
  ExternalLink,
  BrainCircuit,
  Zap
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";

const interactions = [
  { 
    id: 1, 
    debtor: "Initech Systems", 
    type: "WhatsApp", 
    content: "Recordatorio IA enviado. Promesa de pago registrada para el viernes.", 
    time: "10:24 AM", 
    status: "Entregado",
    assignedTo: "Sistema IA",
    hasAttachment: false,
    messages: [
      { sender: 'client', text: 'Aún estamos esperando la aprobación del gerente regional. ¿Podemos retrasar el pago de INV-4421 hasta el próximo viernes?', time: '10:20 AM' },
      { sender: 'agent', text: 'Entendido. He actualizado su cuenta con una "Promesa de Pago" para el viernes 17 de noviembre. Tenga en cuenta que retrasos adicionales pueden afectar su score crediticio. ¿Desea el link de pago para entonces?', time: '10:24 AM', isIA: true }
    ]
  },
  { 
    id: 2, 
    debtor: "Globex Corp", 
    type: "Teléfono", 
    content: "Grabación #332: Deudor afirma que la factura fue pagada vía transferencia.", 
    time: "Ayer 15:30", 
    status: "Grabado",
    assignedTo: "Pedro Cobrador",
    hasAttachment: true,
    audioUrl: "#",
    transcript: [
      { speaker: 'Agente', text: 'Buenas tardes, hablo de Recupera AI Pro para dar seguimiento a su saldo pendiente de $125,000 MXN.' },
      { speaker: 'Deudor', text: 'Sí, precisamente les iba a llamar. Hicimos la transferencia esta mañana desde la cuenta corporativa.' },
      { speaker: 'Agente', text: 'Perfecto, ¿podría proporcionarme el número de referencia o enviar el comprobante por este medio?' }
    ]
  },
  { 
    id: 3, 
    debtor: "Hooli Inc.", 
    type: "Email", 
    content: "Carta de requerimiento oficial enviada al departamento legal.", 
    time: "Ayer 09:15", 
    status: "Abierto",
    assignedTo: "Juan Cobrador",
    hasAttachment: true,
    emailDetails: {
      subject: "URGENTE: Notificación de Adeudo - Hooli Inc. (INV-4423)",
      body: "Estimados, por medio de la presente se les notifica que la factura INV-4423 con vencimiento el 28 de Octubre sigue pendiente de pago. Adjunto encontrarán el desglose de intereses moratorios..."
    }
  },
  { 
    id: 4, 
    debtor: "Wayne Enterprises", 
    type: "WhatsApp", 
    content: "Propuesta de plan de pagos aceptada por el cliente.", 
    time: "hace 2 días", 
    status: "Leído",
    assignedTo: "Sistema IA",
    hasAttachment: false,
    messages: [
      { sender: 'agent', text: 'Hola, hemos diseñado un plan de 3 pagos mensuales para liquidar su saldo sin intereses adicionales. ¿Le interesa revisarlo?', time: 'Lunes 11:00 AM', isIA: true },
      { sender: 'client', text: 'Me parece justo. Por favor envíenme el convenio para firma electrónica.', time: 'Lunes 11:45 AM' }
    ]
  },
];

export default function InteractionsPage() {
  const [role, setRole] = useState('admin');
  const [selectedId, setSelectedId] = useState(1);
  
  useEffect(() => {
    const savedRole = localStorage.getItem('userRole') || 'admin';
    setRole(savedRole);
  }, []);

  const selectedInteraction = useMemo(() => 
    interactions.find(i => i.id === selectedId) || interactions[0], 
  [selectedId]);

  const filteredInteractions = useMemo(() => interactions.filter(i => {
    if (role === 'cobrador') return i.assignedTo === 'Juan Cobrador' || i.assignedTo === 'Sistema IA';
    return true; 
  }), [role]);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="p-8 border-b bg-white">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-3xl font-headline font-bold text-primary">Bandeja Unificada</h2>
              <p className="text-muted-foreground">
                {role === 'cobrador' 
                  ? 'Gestionando tus deudores asignados.' 
                  : 'Monitoreo de gestión del equipo (Supervisión Activa).'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2 rounded-xl font-bold border-primary/10">
                <Filter className="w-4 h-4" />
                Filtrar Equipo
              </Button>
              <Button className="bg-accent hover:bg-accent/90 rounded-xl font-bold shadow-lg shadow-accent/20">
                Nuevo Mensaje Saliente
              </Button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por cliente, canal o palabra clave..." className="pl-10 max-w-xl rounded-xl border-primary/5 bg-muted/20" />
          </div>
        </header>

        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Listado de Interacciones */}
          <div className="lg:col-span-4 border-r bg-white overflow-hidden flex flex-col">
            <ScrollArea className="flex-1">
              <div className="divide-y divide-primary/5">
                {filteredInteractions.map((msg) => (
                  <div 
                    key={msg.id} 
                    onClick={() => setSelectedId(msg.id)}
                    className={cn(
                      "p-5 hover:bg-muted/30 cursor-pointer transition-all border-l-4",
                      selectedId === msg.id ? "bg-primary/5 border-primary" : "border-transparent"
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-primary text-base">{msg.debtor}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{msg.time}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className="text-[10px] px-2 h-5 gap-1.5 font-bold border-primary/10">
                        {msg.type === 'WhatsApp' && <MessageSquare className="w-3 h-3 text-green-500" />}
                        {msg.type === 'Teléfono' && <Phone className="w-3 h-3 text-blue-500" />}
                        {msg.type === 'Email' && <Mail className="w-3 h-3 text-orange-500" />}
                        {msg.type}
                      </Badge>
                      {(role === 'admin' || role === 'supervisor') && (
                        <Badge variant="secondary" className="text-[9px] px-2 h-5 bg-muted/50 font-black tracking-tighter text-primary/60">
                          {msg.assignedTo === 'Sistema IA' ? <Zap className="w-2.5 h-2.5 mr-1 text-accent" /> : <User className="w-2.5 h-2.5 mr-1" />}
                          {msg.assignedTo}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-medium">
                      {msg.content}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Detalle de Interacción */}
          <div className="lg:col-span-8 bg-background/30 flex flex-col overflow-hidden">
            <div className="p-6 bg-white border-b flex justify-between items-center shadow-sm relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center font-bold text-white shadow-lg shadow-primary/20">
                  {selectedInteraction.debtor[0]}
                </div>
                <div>
                  <h4 className="font-headline font-bold text-primary text-lg">{selectedInteraction.debtor}</h4>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <p className="text-xs text-green-600 font-bold uppercase tracking-widest text-[10px]">Gestión Activa • {selectedInteraction.assignedTo}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="rounded-xl"><Download className="w-5 h-5 text-primary" /></Button>
                <Button variant="ghost" size="icon" className="rounded-xl"><Info className="w-5 h-5 text-primary" /></Button>
              </div>
            </div>

            <ScrollArea className="flex-1 p-8">
              <div className="max-w-3xl mx-auto space-y-8">
                
                {/* Visualización para WhatsApp */}
                {selectedInteraction.type === 'WhatsApp' && selectedInteraction.messages?.map((m, idx) => (
                  <div key={idx} className={cn("flex gap-4", m.sender === 'agent' ? "flex-row-reverse" : "")}>
                    <div className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-md",
                      m.sender === 'agent' ? "bg-accent" : "bg-primary"
                    )}>
                      {m.isIA ? <BrainCircuit className="w-5 h-5 text-white" /> : <User className="w-5 h-5 text-white" />}
                    </div>
                    <div className={cn(
                      "p-5 rounded-3xl max-w-[85%] shadow-sm border",
                      m.sender === 'agent' 
                        ? "bg-primary text-white rounded-tr-none border-primary/5" 
                        : "bg-white text-primary rounded-tl-none border-primary/5"
                    )}>
                      <p className="text-sm font-medium leading-relaxed">{m.text}</p>
                      <div className={cn(
                        "text-[9px] mt-2 font-bold uppercase tracking-widest",
                        m.sender === 'agent' ? "text-white/40 text-right" : "text-primary/40"
                      )}>
                        {m.isIA ? "Generado por IA • " : ""}{m.time}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Visualización para Teléfono */}
                {selectedInteraction.type === 'Teléfono' && (
                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-primary/5 shadow-xl">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                            <Mic className="w-6 h-6" />
                          </div>
                          <div>
                            <h5 className="font-bold text-primary">Grabación de Llamada #332</h5>
                            <p className="text-xs text-muted-foreground">Duración: 2m 45s • Calidad: HD</p>
                          </div>
                        </div>
                        <Button variant="outline" className="rounded-xl gap-2 font-bold text-xs">
                          <Download className="w-4 h-4" /> MP3
                        </Button>
                      </div>
                      <div className="bg-muted/20 h-16 rounded-2xl flex items-center px-6 gap-4 border border-primary/5">
                         <Play className="w-6 h-6 text-primary fill-primary" />
                         <div className="flex-1 h-1.5 bg-primary/10 rounded-full relative overflow-hidden">
                           <div className="absolute left-0 top-0 h-full w-[45%] bg-primary" />
                         </div>
                         <span className="text-[10px] font-mono font-bold text-primary">01:12 / 02:45</span>
                         <Volume2 className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h6 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <MessageSquare className="w-3 h-3" /> Transcripción Automática (Voz-a-Texto)
                      </h6>
                      <div className="bg-white/50 p-6 rounded-3xl border border-dashed border-primary/20 space-y-4">
                        {selectedInteraction.transcript?.map((line, i) => (
                          <div key={i} className="flex gap-4">
                            <span className="w-20 text-[10px] font-black text-primary/40 uppercase tracking-tighter pt-1">{line.speaker}</span>
                            <p className="text-sm font-medium text-primary/80 leading-relaxed italic">"{line.text}"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Visualización para Email */}
                {selectedInteraction.type === 'Email' && selectedInteraction.emailDetails && (
                  <div className="bg-white rounded-3xl border border-primary/5 shadow-2xl overflow-hidden">
                    <div className="bg-muted/10 p-6 border-b space-y-3">
                      <div className="flex justify-between items-start">
                        <h5 className="font-headline font-bold text-primary text-xl leading-tight">
                          {selectedInteraction.emailDetails.subject}
                        </h5>
                        <Badge className="bg-orange-50 text-orange-600 border-orange-200">Importante</Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-primary">De:</span> {selectedInteraction.assignedTo} (Recupera AI Pro)
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3" /> {selectedInteraction.time}
                        </div>
                      </div>
                    </div>
                    <div className="p-8 space-y-8">
                       <div className="prose prose-sm text-primary/80 font-medium leading-relaxed">
                          {selectedInteraction.emailDetails.body}
                       </div>
                       <div className="pt-8 border-t border-dashed">
                         <h6 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Archivos Adjuntos (2)</h6>
                         <div className="flex gap-3">
                           <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-2xl border border-primary/5 cursor-pointer hover:bg-muted/50 transition-colors">
                             <div className="p-2 bg-red-100 rounded-lg"><Mail className="w-4 h-4 text-red-600" /></div>
                             <div>
                               <p className="text-xs font-bold text-primary">Estado_Cuenta.pdf</p>
                               <p className="text-[10px] text-muted-foreground font-mono">1.2 MB</p>
                             </div>
                           </div>
                           <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-2xl border border-primary/5 cursor-pointer hover:bg-muted/50 transition-colors">
                             <div className="p-2 bg-blue-100 rounded-lg"><ExternalLink className="w-4 h-4 text-blue-600" /></div>
                             <div>
                               <p className="text-xs font-bold text-primary">Detalle_Facturas.xlsx</p>
                               <p className="text-[10px] text-muted-foreground font-mono">450 KB</p>
                             </div>
                           </div>
                         </div>
                       </div>
                    </div>
                  </div>
                )}

              </div>
            </ScrollArea>

            {/* Input de Respuesta */}
            <div className="p-6 bg-white border-t shadow-[0_-4px_10px_rgba(0,0,0,0.02)] relative z-10">
              <div className="max-w-4xl mx-auto space-y-4">
                <div className="flex items-center gap-4">
                  <Button variant="outline" size="icon" className="shrink-0 rounded-2xl h-12 w-12 border-primary/10">
                    <Paperclip className="w-5 h-5 text-primary" />
                  </Button>
                  <div className="relative flex-1 group">
                    <Input 
                      placeholder="Escribe una respuesta o usa /ai para generar sugerencia..." 
                      className="h-14 rounded-2xl bg-muted/20 border-primary/5 pr-12 focus:ring-accent font-medium" 
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-black bg-white/50 text-accent border-accent/20">AI</Badge>
                    </div>
                  </div>
                  <Button className="bg-primary hover:bg-primary/90 shrink-0 h-14 w-14 rounded-2xl shadow-xl shadow-primary/20">
                    <Send className="w-6 h-6" />
                  </Button>
                </div>
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-2">
                  <div className="flex items-center gap-4">
                    <span>Enviando por: {selectedInteraction.type}</span>
                    <span>•</span>
                    <span>Grabando en Ledger Auditoría</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-accent" />
                    Asistente Gemini 2.5 Flash Activo
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
