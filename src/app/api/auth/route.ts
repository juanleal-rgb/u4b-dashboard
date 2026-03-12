import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const dashboardPassword = process.env.DASHBOARD_PASSWORD;
    const adminPassword = process.env.ADMIN_PASSWORD;

    let role: string | null = null;

    if (!dashboardPassword) {
      // No password configured — allow access as admin
      role = 'admin';
    } else if (adminPassword && password === adminPassword) {
      role = 'admin';
    } else if (password === dashboardPassword) {
      role = 'viewer';
    }

    if (!role) {
      return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true, role });
    response.cookies.set('dashboard_role', role, {
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    return response;
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
}
