'use server';
/**
 * @fileOverview Flujo Genkit para generar mensajes de cobranza personalizados en español.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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

const GenerateCollectionMessageOutputSchema = z.object({
  message: z.string().describe('Mensaje de cobranza generado por la IA en español de México.'),
  llmUsed: z.string().describe('Nombre del modelo LLM utilizado.'),
});
export type GenerateCollectionMessageOutput = z.infer<typeof GenerateCollectionMessageOutputSchema>;

const getDebtorHistoryTool = ai.defineTool(
  {
    name: 'getDebtorHistory',
    description: 'Recupera fragmentos históricos de conversaciones y resultados para un deudor específico.',
    inputSchema: z.object({
      debtorId: z.string().describe('ID único del deudor.'),
    }),
    outputSchema: z.array(z.object({
      conversationSnippet: z.string().describe('Resumen de conversación pasada.'),
      outcome: z.string().describe('Resultado (ej. "pagado", "promesa", "disputa").'),
      date: z.string().describe('Fecha en ISO 8601.'),
    })).describe('Array de interacciones históricas.'),
  },
  async (input) => {
    if (input.debtorId === 'debtor-123') {
      return [
        { conversationSnippet: 'El deudor solicitó extensión de 7 días por flujo. Prometió pagar el 2023-10-15.', outcome: 'promesa', date: '2023-10-01' },
        { conversationSnippet: 'Recordatorio enviado. Pagó en 2 días.', outcome: 'pagado', date: '2023-09-20' },
      ];
    }
    return [];
  }
);

const llmManagerGenerateMessageTool = ai.defineTool(
  {
    name: 'llmManagerGenerateMessage',
    description: 'Genera el mensaje de cobranza seleccionando dinámicamente el mejor modelo.',
    inputSchema: z.object({
      debtorId: z.string(),
      riskProfile: z.object({
        riskScore: z.number(),
        daysOverdue: z.number(),
      }),
      invoiceDetails: z.object({
        invoiceAmount: z.number(),
        invoiceCurrency: z.string(),
        invoiceDueDate: z.string(),
      }),
      communicationChannel: z.enum(['WhatsApp', 'Email']),
      debtorHistory: z.array(z.object({
        conversationSnippet: z.string(),
        outcome: z.string(),
        date: z.string(),
      })),
    }),
    outputSchema: z.object({
      message: z.string(),
      llmUsed: z.string(),
    }),
  },
  async (input) => {
    const modelToUse = 'googleai/gemini-2.5-flash';
    const llmName = 'Gemini-2.5-Flash';

    const historyFormatted = input.debtorHistory.length > 0
      ? `\n--- Historial del Deudor ---\n` +
        input.debtorHistory.map(h => `- El ${h.date}: "${h.conversationSnippet}". Resultado: "${h.outcome}".`).join('\n') +
        `\n----------------------------\n`
      : 'Sin historial significativo.';

    const promptText = `
    Eres un experto en cobranza y recuperación de cartera para el mercado mexicano. 
    Tu objetivo es redactar un mensaje efectivo, profesional y empático en español de México (tú/usted según el riesgo).

    Deudor: ${input.debtorId}
    Riesgo: ${input.riskProfile.riskScore} (0=bajo, 1=alto)
    Días Atraso: ${input.riskProfile.daysOverdue}
    Monto Factura: ${input.invoiceDetails.invoiceCurrency} ${input.invoiceDetails.invoiceAmount.toFixed(2)}
    Vencimiento: ${input.invoiceDetails.invoiceDueDate}
    Canal: ${input.communicationChannel}

    ${historyFormatted}

    Instrucciones:
    - Si el riesgo es bajo, sé amable y servicial.
    - Si el riesgo es alto o tiene muchos días de atraso, sé firme pero siempre respetuoso y profesional.
    - Indica claramente el monto y la fecha de vencimiento.
    - Sugiere un siguiente paso claro (ej. reportar pago, contactar para convenio).
    - Para WhatsApp, sé breve. Para Email, sé más formal y detallado.
    - Usa español de México estándar.

    Mensaje Generado:
    `;

    const { text } = await ai.generate({
      model: modelToUse,
      prompt: promptText,
    });

    return {
      message: text?.trim() || 'Error al generar mensaje.',
      llmUsed: llmName,
    };
  }
);

const generateCollectionMessageFlow = ai.defineFlow(
  {
    name: 'generateCollectionMessageFlow',
    inputSchema: GenerateCollectionMessageInputSchema,
    outputSchema: GenerateCollectionMessageOutputSchema,
  },
  async (input) => {
    const debtorHistory = await getDebtorHistoryTool({ debtorId: input.debtorId });
    const result = await llmManagerGenerateMessageTool({
      debtorId: input.debtorId,
      riskProfile: { riskScore: input.riskScore, daysOverdue: input.daysOverdue },
      invoiceDetails: { 
        invoiceAmount: input.invoiceAmount, 
        invoiceCurrency: input.invoiceCurrency, 
        invoiceDueDate: input.invoiceDueDate 
      },
      communicationChannel: input.communicationChannel,
      debtorHistory: debtorHistory,
    });
    return result;
  }
);

export async function generateCollectionMessage(input: GenerateCollectionMessageInput): Promise<GenerateCollectionMessageOutput> {
  return generateCollectionMessageFlow(input);
}
