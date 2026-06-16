import { groq } from './groq';
import { buildSystemPrompt, buildRoundPrompt } from './prompts';
import { fetchBaselineMarketPrice } from './vehicle/market';

export async function runValuationPipeline(
  carSummary: string,
  carDetails: { year: number; make: string; model: string },
  previousRounds: any[],
  isFirstCall: boolean
) {
  // 1. Fetch baseline price
  const baselinePrice = await fetchBaselineMarketPrice(
    carDetails.year,
    carDetails.make,
    carDetails.model
  );

  // 2. Build prompt
  const userPrompt = buildRoundPrompt(carSummary, baselinePrice, previousRounds, isFirstCall);

  // 3. Call Groq
  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      { role: 'system', content: buildSystemPrompt() },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.2,
    max_tokens: 500,
    response_format: { type: 'json_object' },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error('Empty Groq response');

  const result = JSON.parse(raw);

  // Programmatic guardrail: no vehicle is worth $0, even a worst-case
  // "needs work / high mileage / major accident" car still has scrap/parts value.
  const SCRAP_VALUE_FLOOR = 500;
  if (result.priceRange) {
    result.priceRange.low = Math.max(result.priceRange.low ?? 0, SCRAP_VALUE_FLOOR);
    result.priceRange.high = Math.max(result.priceRange.high ?? 0, result.priceRange.low);
  }

  // Programmatic guardrail to force stop after 4 rounds of Q&A (4 answers received)
  if (previousRounds && previousRounds.length >= 4) {
    result.nextQuestion = null;
    result.questionCategory = null;
    if (result.confidence < 85) {
      result.confidence = 85;
    }
  }

  return result;
}

