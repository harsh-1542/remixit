import { DatabaseService } from './types';
import { fileStorageDb, FileStorageDatabaseService } from './file-storage';
import { SupabaseDatabaseService } from './supabase-adapter';

function resolveDatabaseService(): DatabaseService {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (
    supabaseUrl &&
    supabaseKey &&
    supabaseUrl !== 'https://your-project.supabase.co' &&
    supabaseKey !== 'your-anon-or-service-role-key'
  ) {
    try {
      console.log('[Remix DB] Using Supabase PostgreSQL persistent storage.');
      return new SupabaseDatabaseService(supabaseUrl, supabaseKey);
    } catch (err) {
      console.warn('[Remix DB] Failed to initialize Supabase client, falling back to persistent file storage:', err);
    }
  }

  console.log('[Remix DB] Using persistent local JSON/file database adapter (data/remix-store.json).');
  return fileStorageDb;
}

export const db: DatabaseService = resolveDatabaseService();
export { fileStorageDb };
export * from './types';
