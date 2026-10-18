import Anthropic from '@anthropic-ai/sdk';
import config from '@/config';

// one test review is a single non-streaming call; two retries cover 429/5xx/network blips
const REQUEST_TIMEOUT_MS = 120_000;
const MAX_RETRIES = 2;

let client: Anthropic | null = null;

export const isAiEnabled = (): boolean => Boolean(config.ai.apiKey);

/** Lazily built so the API starts (with the assistant off) when no key is configured. */
export const getAiClient = (): Anthropic => {
  client ??= new Anthropic({ apiKey: config.ai.apiKey, timeout: REQUEST_TIMEOUT_MS, maxRetries: MAX_RETRIES });
  return client;
};
