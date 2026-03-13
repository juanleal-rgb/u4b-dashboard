import { NextRequest, NextResponse } from 'next/server';

const BATCH_URLS: Record<string, string> = {
  ES: 'https://workflows.platform.happyrobot.ai/hooks/53s0j8nzi5bv',
  US: 'https://workflows.platform.happyrobot.ai/hooks/1o5pwwt58wgk',
};

export async function POST(request: NextRequest) {
  const role = request.cookies.get('dashboard_role')?.value;
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const { country } = await request.json();

  const url = BATCH_URLS[country];
  if (!url) {
    return NextResponse.json({ error: 'Invalid country' }, { status: 400 });
  }

  try {
    await fetch(url, { method: 'POST' });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to reach batch endpoint', details: String(error) }, { status: 502 });
  }
}
