'use server';
/**
 * @fileOverview Agente de IA que predice el flujo de caja futuro en español.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

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
  return predictCashFlowFlow(input);
}

const predictCashFlowPrompt = ai.definePrompt({
  name: 'predictCashFlowPrompt',
  input: { schema: PredictCashFlowInputSchema },
  output: { schema: PredictCashFlowOutputSchema },
  prompt: `Eres un experto analista financiero especializado en pronóstico de cobranza.
Tu tarea es predecir los montos de cobranza futuros basados en el historial y el contexto proporcionado.

Datos Históricos:
{{#each historicalData}}
- Fecha: {{this.date}}, Monto: {{this.amount}}
{{/each}}

Horizonte de Predicción: Pronosticar los próximos {{{predictionHorizonDays}}} días.

{{#if additionalContext}}
Contexto Adicional: {{{additionalContext}}}
{{/if}}

Proporciona una predicción precisa. La salida debe ser un objeto JSON que cumpla con 'PredictCashFlowOutputSchema'. El resumen debe estar en español de México.`,
});

const predictCashFlowFlow = ai.defineFlow(
  {
    name: 'predictCashFlowFlow',
    inputSchema: PredictCashFlowInputSchema,
    outputSchema: PredictCashFlowOutputSchema,
  },
  async (input) => {
    const { output } = await predictCashFlowPrompt(input);
    if (!output) {
      throw new Error('Error al generar predicción de flujo.');
    }
    return output;
  }
);
