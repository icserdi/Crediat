'use server';
/**
 * @fileOverview Agente de IA que predice el flujo de caja futuro en español.
 * Usa Vercel AI SDK + OpenRouter.
 */

import { generateObject } from 'ai';
import { z } from 'zod';
import { model } from '@/ai/model';

const PredictCashFlowInputSchema = z.object({
  historicalData: z.array(
    z.object({
      date: z.string().describe('Fecha de cobranza en formato YYYY-MM-DD.'),
      amount: z.number().describe('Monto cobrado en esa fecha.'),
    })
  ).describe('Datos históricos de cobranza.'),
  predictionHorizonDays: z.number().int().positive().describe('Días a futuro para predecir.'),
  additionalContext: z.string().optional().describe('Contexto adicional (ej. pagos grandes próximos).'),
});
export type PredictCashFlowInput = z.infer<typeof PredictCashFlowInputSchema>;
// El schema de entrada solo se usa como fuente de tipo.
void PredictCashFlowInputSchema;

const PredictCashFlowOutputSchema = z.object({
  predictedCollections: z.array(
    z.object({
      date: z.string().describe('Fecha predicha YYYY-MM-DD.'),
      amount: z.number().describe('Monto predicho.'),
    })
  ).describe('Array de cobranzas predichas.'),
  confidenceScore: z.number().min(0).max(1).describe('Nivel de confianza (0-1).'),
  summary: z.string().describe('Resumen explicativo de la predicción en español.'),
});
export type PredictCashFlowOutput = z.infer<typeof PredictCashFlowOutputSchema>;

export async function predictCashFlow(input: PredictCashFlowInput): Promise<PredictCashFlowOutput> {
  const { object } = await generateObject({
    model,
    schema: PredictCashFlowOutputSchema,
    system: 'Eres un experto analista financiero especializado en pronóstico de cobranza.',
    prompt: `Predice los montos de cobranza futuros basándote en el historial y el contexto proporcionado.

Datos Históricos:
${input.historicalData.map((d) => `- Fecha: ${d.date}, Monto: ${d.amount}`).join('\n')}

Horizonte de Predicción: Pronosticar los próximos ${input.predictionHorizonDays} días.

${input.additionalContext ? `Contexto Adicional: ${input.additionalContext}` : ''}

Proporciona una predicción precisa. La salida debe cumplir con el esquema 'PredictCashFlowOutputSchema'. El resumen debe estar en español de México.`,
  });

  return object;
}
