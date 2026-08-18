import { createOpenRouter } from '@openrouter/ai-sdk-provider';

export const MODEL_ID =
  process.env.OPENROUTER_MODEL || 'openrouter/auto';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export const model = openrouter.languageModel(MODEL_ID);