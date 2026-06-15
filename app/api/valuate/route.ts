import { NextRequest, NextResponse } from 'next/server';
import { runValuationPipeline } from '@/lib/pipeline';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = process.env.UPSTASH_REDIS_REST_URL ? Redis.fromEnv() : null;
const ratelimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'),
}) : null;

export async function POST(req: NextRequest) {
  if (ratelimit) {
    try {
      const ip = req.headers.get('x-forwarded-for') ?? 'anonymous';
      const { success } = await ratelimit.limit(ip);
      if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    } catch (e) {
      console.warn("Ratelimit bypassed due to error:", e);
    }
  }

  try {
    const { carSummary, carDetails, previousRounds, isFirstCall } = await req.json();
    
    if (!carDetails || !carDetails.year || !carDetails.make || !carDetails.model) {
      return NextResponse.json({ error: 'Missing carDetails (year, make, model)' }, { status: 400 });
    }

    const result = await runValuationPipeline(carSummary, carDetails, previousRounds ?? [], isFirstCall ?? true);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || 'Valuation failed' }, { status: 500 });
  }
}
