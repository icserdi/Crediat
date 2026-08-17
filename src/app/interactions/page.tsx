'use client';

import { Sidebar } from "@/components/layout/sidebar";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Phone, 
  Mail, 
  Search, 
  Send,
  User,
  Zap,
  BrainCircuit,
  RefreshCw,
  AlertCircle,
  Building2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useInteractions } from "@/hooks/use-interactions";
import { useActiveCompany } from "@/hooks/use-active-company";

const companyIcons: Record<string, typeof MessageSquare> = {
  WhatsApp: MessageSquare,
  Teléfono: Phone,
  Email: Mail,
};

export default function InteractionsPage() {
  const { toast } = useToast();
  const { activeCompanyId } = useActiveCompany();
  const { interactions, isLoading, error, isSending, reload, send } = useInteractions(activeCompanyId);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');

  const handleSend = async () => {
    const ok = await send(newMessage);
    if (ok) {
      setNewMessage('');
      toast({
        title: "Mensaje enviado",
        description: "La interacción ha sido registrada en el sistema.",
      });
    } else {
      toast({
        title: "Error al enviar",
        description: "No se pudo registrar la interacción.",
        variant: "destructive",
      });
    }
  };

  const filteredInteractions = interactions.filter(i =>
    i.debtor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedInteraction = filteredInteractions[0];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="p-8 border-b bg-white">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-3xl font-headline font-bold text-primary">Bandeja Unificada</h2>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="w-4 h-4" />
                <p className="text-lg">Gestiones registradas en el sistema.</p>
              </div>
            </div>
            <Button
              onClick={reload}
              disabled={isLoading}
              variant="outline"
              className="gap-2 rounded-xl font-bold border-primary/10"
            >
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
              {isLoading ? "Cargando..." : "Recargar"}
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente o contenido..."
              className="pl-10 max-w-xl rounded-xl border-primary/5 bg-muted/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </header>

        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Listado de Interacciones */}
          <div className="lg:col-span-4 border-r bg-white overflow-hidden flex flex-col">
            <ScrollArea className="flex-1">
              {isLoading ? (
                <div className="p-20 text-center flex flex-col items-center gap-3">
                  <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                  <p className="text-muted-foreground font-medium">Cargando interacciones...</p>
                </div>
              ) : error ? (
                <div className="p-20 text-center flex flex-col items-center gap-3">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                  <p className="text-red-600 font-medium">{error}</p>
                </div>
              ) : filteredInteractions.length === 0 ? (
                <div className="p-20 text-center text-muted-foreground italic font-medium">
                  {searchQuery ? 'No se encontraron resultados.' : 'No hay interacciones registradas. Envíe un mensaje para comenzar.'}
                </div>
              ) : (
                <div className="divide-y divide-primary/5">
                  {filteredInteractions.map((msg) => {
                    const Icon = companyIcons[msg.type] || MessageSquare;
                    return (
                      <div
                        key={msg.id}
                        className="p-5 hover:bg-muted/30 cursor-pointer transition-all border-l-4 border-transparent"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-primary text-base">{msg.debtor_name}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {new Date(msg.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="outline" className="text-[10px] px-2 h-5 gap-1.5 font-bold border-primary/10">
                            <Icon className="w-3 h-3 text-green-500" />
                            {msg.type}
                          </Badge>
                          <Badge variant="secondary" className="text-[9px] px-2 h-5 bg-muted/50 font-black tracking-tighter text-primary/60">
                            {msg.assigned_to === 'Sistema IA' ? (
                              <Zap className="w-2.5 h-2.5 mr-1 text-accent" />
                            ) : (
                              <User className="w-2.5 h-2.5 mr-1" />
                            )}
                            {msg.assigned_to}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-medium">
                          {msg.content}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Detalle de Interacción */}
          <div className="lg:col-span-8 bg-background/30 flex flex-col overflow-hidden">
            {selectedInteraction ? (
              <div className="p-6 bg-white border-b flex justify-between items-center shadow-sm relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center font-bold text-white shadow-lg shadow-primary/20">
                    {selectedInteraction.debtor_name[0]}
                  </div>
                  <div>
                    <h4 className="font-headline font-bold text-primary text-lg">{selectedInteraction.debtor_name}</h4>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <p className="text-xs text-green-600 font-bold uppercase tracking-widest text-[10px]">
                        {selectedInteraction.assigned_to}
                      </p>
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] font-black bg-white">
                  {selectedInteraction.type}
                </Badge>
              </div>
            ) : (
              <div className="p-6 bg-white border-b shadow-sm">
                <p className="text-muted-foreground italic text-center py-10">
                  Seleccione una interacción para ver el detalle
                </p>
              </div>
            )}

            <ScrollArea className="flex-1 p-8">
              {selectedInteraction && (
                <div className="max-w-3xl mx-auto">
                  <div className="flex gap-4 flex-row-reverse">
                    <div className="w-10 h-10 rounded-2xl bg-accent flex items-center justify-center shrink-0 shadow-md">
                      <BrainCircuit className="w-5 h-5 text-white" />
                    </div>
                    <div className="p-5 rounded-3xl max-w-[85%] shadow-sm border bg-primary text-white rounded-tr-none border-primary/5">
                      <p className="text-sm font-medium leading-relaxed">{selectedInteraction.content}</p>
                      <div className="text-[9px] mt-2 font-bold uppercase tracking-widest text-white/40 text-right">
                        {selectedInteraction.assigned_to === 'Sistema IA' ? "Generado por IA • " : ""}
                        {new Date(selectedInteraction.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </ScrollArea>

            {/* Input de Respuesta */}
            <div className="p-6 bg-white border-t shadow-[0_-4px_10px_rgba(0,0,0,0.02)] relative z-10">
              <div className="max-w-4xl mx-auto flex items-center gap-4">
                <div className="relative flex-1 group">
                  <Input
                    placeholder="Escribe una respuesta o usa /ai para generar sugerencia..."
                    className="h-14 rounded-2xl bg-muted/20 border-primary/5 pr-12 focus:ring-accent font-medium"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                    disabled={isSending}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] font-black bg-white/50 text-accent border-accent/20">AI</Badge>
                  </div>
                </div>
                <Button
                  onClick={handleSend}
                  disabled={isSending || !newMessage.trim()}
                  className="bg-primary hover:bg-primary/90 shrink-0 h-14 w-14 rounded-2xl shadow-xl shadow-primary/20"
                >
                  <Send className="w-6 h-6" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
