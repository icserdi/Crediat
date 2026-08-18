import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createAzure } from '@ai-sdk/azure';

/**
 * Proveedor de IA configurable vía variables de entorno.
 *
 * AI_PROVIDER:
 *   - 'openrouter' (default): usa OpenRouter (multi-modelo).
 *   - 'foundry': usa Microsoft Foundry (Azure AI Foundry).
 *
 * OpenRouter:
 *   OPENROUTER_API_KEY, OPENROUTER_MODEL (ej. 'openrouter/auto')
 *
 * Microsoft Foundry (Azure):
 *   AZURE_FOUNDRY_BASE_URL (endpoint del proyecto Foundry, ej. https://<proyecto>.services.ai.azure.com)
 *   AZURE_FOUNDRY_API_KEY (clave del modelo desplegado)
 *   AZURE_FOUNDRY_DEPLOYMENT (nombre del deployment/modelo en Foundry)
 */

export const AI_PROVIDER = process.env.AI_PROVIDER || 'openrouter';

export const MODEL_ID =
  process.env.OPENROUTER_MODEL || 'openrouter/auto';

export const FOUNDRY_DEPLOYMENT =
  process.env.AZURE_FOUNDRY_DEPLOYMENT || '';

function createModel() {
  if (AI_PROVIDER === 'foundry') {
    const azure = createAzure({
      baseURL: process.env.AZURE_FOUNDRY_BASE_URL,
      apiKey: process.env.AZURE_FOUNDRY_API_KEY,
    });
    if (!FOUNDRY_DEPLOYMENT) {
      throw new Error(
        'AZURE_FOUNDRY_DEPLOYMENT no configurado. Especifique el nombre del modelo desplegado en Microsoft Foundry.'
      );
    }
    return azure.languageModel(FOUNDRY_DEPLOYMENT);
  }

  // Default: OpenRouter
  const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
  });
  return openrouter.languageModel(MODEL_ID);
}

export const model = createModel();
