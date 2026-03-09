// Configuration — all values from environment variables

export const config = {
  databaseUrl: process.env.DATABASE_URL || '',
  dashboardPassword: process.env.DASHBOARD_PASSWORD || '',
  runsStartDate: process.env.RUNS_START_DATE || '',
  webhookSecret: process.env.WEBHOOK_SECRET || '',
};

// Validate required config
export function validateConfig(): { valid: boolean; missing: string[] } {
  const required = [
    { key: 'databaseUrl', env: 'DATABASE_URL' },
  ];

  const missing = required
    .filter(({ key }) => !config[key as keyof typeof config])
    .map(({ env }) => env);

  return { valid: missing.length === 0, missing };
}
