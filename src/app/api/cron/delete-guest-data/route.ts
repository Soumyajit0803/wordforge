import { NextResponse } from 'next/server';
import { and, or, lt, sql } from 'drizzle-orm';
import { db } from '@/app/db/index'; 
import { challenges } from '@/app/db/schema'; 

export async function GET(request: Request) {
  // 1. Cron Authentication Protection
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // 2. Fetch and parse the retention interval in MINUTES (defaults to 5 if not set)
    const retentionMinutes = 2;

    if (isNaN(retentionMinutes)) {
      throw new Error('GUEST_RETENTION_MINUTES must be a valid number');
    }

    // 3. Calculate the cutoff date by subtracting minutes
    const cutoffDate = new Date();
    cutoffDate.setMinutes(cutoffDate.getMinutes() - retentionMinutes);

    // 4. Execute the delete query
    const deletedRows = await db
      .delete(challenges)
      .where(
        and(
          lt(challenges.createdAt, cutoffDate),
          or(
            sql`${challenges.creatorId} ~ '^[A-Z]'`,
            sql`${challenges.opponentId} ~ '^[A-Z]'`
          )
        )
      )
      .returning({ id: challenges.id });

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${deletedRows.length} guest challenges older than ${retentionMinutes} minutes.`,
    });
  } catch (error) {
    console.error('Failed to run guest cleanup cron:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}