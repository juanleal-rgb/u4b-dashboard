import { NextResponse } from 'next/server';
import { getPool, initDb } from '@/lib/db';
import { groupCallsIntoLeads, computeStats, type CallRecord } from '@/lib/api';
import { validateConfig } from '@/lib/config';

let dbInitialized = false;

export async function GET(request: Request) {
  // Validate config
  const configValidation = validateConfig();
  if (!configValidation.valid) {
    return NextResponse.json(
      {
        error: 'Missing configuration',
        missing: configValidation.missing,
        hint: 'Set these environment variables in your .env.local or Docker environment',
      },
      { status: 500 }
    );
  }

  try {
    if (!dbInitialized) {
      await initDb();
      dbInitialized = true;
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');

    const db = getPool();

    let query = `
      SELECT
        id,
        phone,
        name,
        company,
        status,
        qualified,
        meeting,
        summary,
        attempt,
        duration,
        call_url AS "callUrl",
        created_at AS "createdAt",
        country
      FROM calls
    `;
    const params: (string | undefined)[] = [];

    if (startDate && endDate) {
      query += ` WHERE created_at >= $1::date AND created_at < ($2::date + INTERVAL '1 day')`;
      params.push(startDate, endDate);
    } else if (startDate) {
      query += ` WHERE created_at >= $1::date`;
      params.push(startDate);
    }

    query += ' ORDER BY created_at DESC';

    const result = await db.query(query, params);

    const calls: CallRecord[] = result.rows.map(row => ({
      id: row.id,
      phone: row.phone,
      name: row.name,
      company: row.company,
      status: row.status,
      qualified: row.qualified,
      meeting: row.meeting ? new Date(row.meeting).toISOString() : null,
      summary: row.summary ?? '',
      attempt: row.attempt,
      duration: row.duration,
      callUrl: row.callUrl ?? null,
      createdAt: new Date(row.createdAt).toISOString(),
      country: row.country ?? 'ES',
    }));

    const leads = groupCallsIntoLeads(calls);
    const stats = computeStats(calls);

    // Get the earliest call date across ALL calls (unfiltered) for the "All time" range
    const minResult = await db.query(`SELECT MIN(created_at) AS min_date FROM calls`);
    const globalMinDate: string | null = minResult.rows[0]?.min_date
      ? new Date(minResult.rows[0].min_date).toISOString().split('T')[0]
      : null;

    return NextResponse.json({ leads, stats, calls, globalMinDate });
  } catch (error) {
    console.error('Error fetching calls:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calls', details: String(error) },
      { status: 500 }
    );
  }
}
