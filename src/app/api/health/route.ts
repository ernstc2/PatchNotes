import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    await sql`SELECT 1`;
    return Response.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (error) {
    return Response.json(
      { status: 'error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
