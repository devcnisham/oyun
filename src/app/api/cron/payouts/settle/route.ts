import { NextResponse } from 'next/server';
import { calculateTPlus2SettlementPeriod, createSettlementBatch, executePayoutTransfer } from '@/lib/payouts';
import { requireCronSecret } from '@/lib/cron-auth';
import { istNow } from '@/lib/time';

export async function GET(request: Request) {
  const denied = requireCronSecret(request);
  if (denied) return denied;

  try {
    const today = istNow().date;
    const { periodStart, periodEnd } = calculateTPlus2SettlementPeriod(today);

    // Create batch for eligible T+2 periods
    const batch = await createSettlementBatch(periodStart, periodEnd);
    const executionResults = [];

    for (const payout of batch) {
      const result = await executePayoutTransfer(payout.id);
      executionResults.push(result);
    }

    return NextResponse.json({
      ok: true,
      settlementDate: today,
      period: { periodStart, periodEnd },
      createdCount: batch.length,
      executions: executionResults,
    });
  } catch (err) {
    console.error('[cron/payouts/settle] Error running settlement job:', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Settlement job failed' },
      { status: 500 }
    );
  }
}
