import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

import { SERVER_CONFIG } from '@/config/env';
import * as schema from '@/db/schema';

const sql = neon(SERVER_CONFIG.database.url);

export const db = drizzle(sql, { schema });
