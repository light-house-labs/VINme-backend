import { NextRequest, NextResponse } from 'next/server';
import { decodeVIN } from '@/lib/vehicle/nhtsa';
import { Redis } from '@upstash/redis';

const redis = process.env.UPSTASH_REDIS_REST_URL ? Redis.fromEnv() : null;

export async function GET(req: NextRequest, { params }: { params: Promise<{ vin: string }> }) {
  const { vin } = await params;
  
  if (redis) {
    const cached = await redis.get(`vin:${vin}`);
    if (cached) return NextResponse.json(typeof cached === 'string' ? JSON.parse(cached) : cached);
  }

  try {
    const decoded = await decodeVIN(vin);
    if (redis) {
      try {
        await redis.set(`vin:${vin}`, JSON.stringify(decoded), { ex: 86400 }); // 24hr cache
      } catch (e) {
        console.warn("Redis cache set bypassed due to error:", e);
      }
    }
    return NextResponse.json(decoded);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to decode VIN', details: error.message }, { status: 500 });
  }
}
