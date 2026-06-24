import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

import { APP_CONFIG } from '@/config';
import * as schema from '@/db/schema';

const sql = neon(APP_CONFIG.env.DATABASE_URL);

export const db = drizzle(sql, { schema });
