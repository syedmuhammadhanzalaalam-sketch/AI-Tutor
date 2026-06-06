import { neon } from '@neondatabase/serverless';

let sql;

function getDb() {
  if (!sql) {
    sql = neon(process.env.DATABASE_URL);
  }
  return sql;
}

export async function query(sqlQuery, params = []) {
  const db = getDb();
  let i = 0;
  const pgQuery = sqlQuery.replace(/\?/g, () => `$${++i}`);
  
  if (params && params.length > 0) {
    const result = await db.query(pgQuery, params);
    return Array.isArray(result) ? result : (result?.rows || []);
  } else {
    const result = await db.query(pgQuery);
    return Array.isArray(result) ? result : (result?.rows || []);
  }
}