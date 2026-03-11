// backend/db.js
// PostgreSQL wrapper that mimics the sqlite3 API used throughout the codebase.
// This allows us to keep the existing index.js logic unchanged while switching to Render's free PostgreSQL.

const { Pool } = require('pg');

// Connection string is taken from the Render environment variable DATABASE_URL.
// For local development you can set it in a .env file or use a fallback.
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ihms';

const pool = new Pool({
  connectionString,
  // Render provides a self‑signed cert for the free tier; we disable strict verification in production.
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Helper to translate SQLite's "?" placeholders to PostgreSQL's "$1, $2, ..." syntax.
function translatePlaceholders(sql) {
  let i = 1;
  return sql.replace(/\?/g, () => `$${i++}`);
}

// Compatibility layer mimicking the sqlite3 Database object.
const db = {
  // Generic query – used rarely, but kept for completeness.
  query: (text, params, cb) => pool.query(text, params, cb),

  // db.all – returns all rows as an array.
  all: (text, params, callback) => {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    const sql = translatePlaceholders(text);
    pool.query(sql, params, (err, result) => {
      if (err) return callback(err);
      callback(null, result.rows);
    });
  },

  // db.get – returns a single row (or undefined).
  get: (text, params, callback) => {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    const sql = translatePlaceholders(text);
    pool.query(sql, params, (err, result) => {
      if (err) return callback(err);
      callback(null, result.rows[0]);
    });
  },

  // db.run – used for INSERT/UPDATE/DELETE. It simulates the sqlite3 callback context
  // where "this.lastID" holds the generated primary key for INSERT statements.
  run: (text, params, callback) => {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    let sql = text.trim();
    const isInsert = sql.toUpperCase().startsWith('INSERT');
    // Ensure INSERT statements return the generated id.
    if (isInsert && !/RETURNING\s+\w+/i.test(sql)) {
      sql += ' RETURNING id';
    }
    sql = translatePlaceholders(sql);
    pool.query(sql, params, (err, result) => {
      if (err) {
        if (callback) return callback(err);
        else return;
      }
      // Simulate the sqlite3 "this" context.
      const context = {
        lastID: isInsert && result.rows.length ? result.rows[0].id : null,
        changes: result.rowCount,
      };
      if (callback) callback.call(context, null);
    });
  },

  // db.exec – runs a batch of statements (used for schema init).
  exec: (text, callback) => {
    // Split on semicolons to execute sequentially.
    const statements = text.split(';').filter(s => s.trim().length > 0);
    const runNext = (index) => {
      if (index >= statements.length) return callback && callback(null);
      const stmt = statements[index] + ';';
      pool.query(stmt, (err) => {
        if (err) return callback && callback(err);
        runNext(index + 1);
      });
    };
    runNext(0);
  },
};

// dbReady – resolves when the schema has been created and migrations applied.
const dbReady = new Promise((resolve, reject) => {
  const fs = require('fs');
  const path = require('path');
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    return reject(new Error('schema.sql not found'));
  }
  const schema = fs.readFileSync(schemaPath, 'utf8');
  // Execute the whole schema (including seed data) sequentially.
  db.exec(schema, (err) => {
    if (err) return reject(err);
    // Verify a simple query to ensure the connection works.
    db.get('SELECT 1 AS test', [], (e, row) => {
      if (e) return reject(e);
      console.log('PostgreSQL connection ready.');
      resolve(db);
    });
  });
});

module.exports = { db, dbReady };
