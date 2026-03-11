import { NextResponse } from 'next/server';
import { getPool, initDb } from '@/lib/db';

// Coerce "true"/"false" string to boolean
function parseBool(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return false;
}

// Coerce a string/number to integer
function parseInt2(value: unknown): number {
  if (typeof value === 'number') return Math.round(value);
  if (typeof value === 'string') {
    const n = parseInt(value, 10);
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

// Parse meeting: empty string → null, otherwise try to parse as date
function parseMeeting(value: unknown): string | null {
  if (!value || value === '') return null;
  if (typeof value === 'string') {
    try {
      const d = new Date(value);
      if (isNaN(d.getTime())) return null;
      return d.toISOString();
    } catch {
      return null;
    }
  }
  return null;
}

let dbInitialized = false;

export async function POST(request: Request) {
  try {
    // Initialize DB schema once
    if (!dbInitialized) {
      await initDb();
      dbInitialized = true;
    }

    // Optional webhook secret validation
    const webhookSecret = process.env.WEBHOOK_SECRET;
    if (webhookSecret) {
      const authHeader = request.headers.get('authorization');
      const providedSecret = authHeader?.replace('Bearer ', '') ?? request.headers.get('x-webhook-secret');
      if (providedSecret !== webhookSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const body = await request.json();

    const { phone, name, company, status, qualified, meeting, summary, attempt, duration, call_url, country } = body;

    // Validate required fields
    if (!phone || typeof phone !== 'string') {
      return NextResponse.json({ error: 'Missing required field: phone' }, { status: 400 });
    }
    if (!status || typeof status !== 'string') {
      return NextResponse.json({ error: 'Missing required field: status' }, { status: 400 });
    }

    const db = getPool();

    const result = await db.query(
      `INSERT INTO calls (phone, name, company, status, qualified, meeting, summary, attempt, duration, call_url, country)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id`,
      [
        phone.trim(),
        name ? String(name).trim() : null,
        company ? String(company).trim() : null,
        String(status).trim(),
        parseBool(qualified),
        parseMeeting(meeting),
        summary ? String(summary).trim() : '',
        parseInt2(attempt),
        parseInt2(duration),
        call_url ? String(call_url).trim() : null,
        country ? String(country).toUpperCase().trim() : 'ES',
      ]
    );

    const insertedId = result.rows[0]?.id;

    return NextResponse.json({ success: true, id: insertedId });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook', details: String(error) },
      { status: 500 }
    );
  }
}
