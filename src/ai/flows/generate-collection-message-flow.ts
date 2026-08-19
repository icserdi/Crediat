'use server';
/**
 * @fileOverview Agente de IA que genera mensajes de cobranza personalizados en español.
 * Usa Vercel AI SDK + OpenRouter.
 */

import { generateText, tool, isStepCount } from 'ai';
import { z } from 'zod';
import { model, MODEL_ID } from '@/ai/model';

const GenerateCollectionMessageInputSchema = z.object({
  debtorId: z.string().describe('ID único del deudor.'),
  riskScore: z.number().min(0).max(1).describe('Score de riesgo del deudor (0 a 1).'),
  daysOverdue: z.number().min(0).describe('Días de atraso de la factura.'),
  invoiceAmount: z.number().positive().describe('Monto de la factura pendiente.'),
  invoiceCurrency: z.string().default('MXN').describe('Moneda de la factura.'),
  invoiceDueDate: z.string().describe('Fecha de vencimiento en formato ISO 8601.'),
  communicationChannel: z.enum(['WhatsApp', 'Email']).describe('Canal de comunicación.'),
});
export type GenerateCollectionMessageInput = z.infer<typeof GenerateCollectionMessageInputSchema>;
// El schema de entrada solo se usa como fuente de tipo.
void GenerateCollectionMessageInputSchema;

const GenerateCollectionMessageOutputSchema = z.object({
  message: z.string().describe('Mensaje de cobranza generado por la IA en español de México.'),
  llmUsed: z.string().describe('Nombre del modelo LLM utilizado.'),
});
// El tipo de salida se deriva del schema (usado como tipo).
export type GenerateCollectionMessageOutput = z.infer<typeof GenerateCollectionMessageOutputSchema>;

void GenerateCollectionMessageOutputSchema;

const getDebtorHistory = tool({
  description:
    'Recupera fragmentos históricos de conversaciones y resultados para un deudor específico.',
  inputSchema: z.object({
    debtorId: z.string().describe('ID único del deudor.'),
  }),
  execute: async ({ debtorId }) => {
    if (debtorId === 'debtor-123') {
      return [
        {
          conversationSnippet:
            'El deudor solicitó extensión de 7 días por flujo. Prometió pagar el 2023-10-15.',
          outcome: 'promesa',
          date: '2023-10-01',
        },
        {
          conversationSnippet: 'Recordatorio enviado. Pagó en 2 días.',
          outcome: 'pagado',
          date: '2023-09-20',
        },
      ];
    }
    return [];
  },
});

export async function generateCollectionMessage(
  input: GenerateCollectionMessageInput
): Promise<GenerateCollectionMessageOutput> {
  const result = await generateText({
    model,
    tools: { getDebtorHistory },
    stopWhen: isStepCount(5),
    system: `Eres un experto en cobranza y recuperación de cartera para el mercado mexicano.
Tu objetivo es redactar un mensaje efectivo, profesional y empático en español de México (tú/usted según el riesgo).`,
    prompt: `Deudor: ${input.debtorId}
Riesgo: ${input.riskScore} (0=bajo, 1=alto)
Días Atraso: ${input.daysOverdue}
Monto Factura: ${input.invoiceCurrency} ${input.invoiceAmount.toFixed(2)}
Vencimiento: ${input.invoiceDueDate}
Canal: ${input.communicationChannel}

Usa la herramienta getDebtorHistory para recuperar el historial del deudor antes de redactar.

Instrucciones:
- Si el riesgo es bajo, sé amable y servicial.
- Si el riesgo es alto o tiene muchos días de atraso, sé firme pero siempre respetuoso y profesional.
- Indica claramente el monto y la fecha de vencimiento.
- Sugiere un siguiente paso claro (ej. reportar pago, contactar para convenio).
- Para WhatsApp, sé breve. Para Email, sé más formal y detallado.
- Usa español de México estándar.

Devuelve el mensaje generado y el nombre del modelo LLM utilizado.`,
  });

  return {
    message: result.text?.trim() || 'Error al generar mensaje.',
    llmUsed: MODEL_ID || 'OpenRouter',
  };
}
