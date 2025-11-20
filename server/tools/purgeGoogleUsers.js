/* eslint-disable no-console */
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'coaching.db');
const db = new sqlite3.Database(dbPath);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this.changes || 0);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

(async () => {
  try {
    console.log('Purging Google-linked users (and related data)...');

    // Count users to purge
    const countRow = await get("SELECT COUNT(*) AS cnt FROM users WHERE google_id IS NOT NULL");
    console.log(`Google users found: ${countRow?.cnt || 0}`);

    // Delete bookings made by Google users or for sessions owned by Google coaches
    const bookingsDeleted = await run(
      `DELETE FROM bookings
       WHERE student_id IN (SELECT id FROM users WHERE google_id IS NOT NULL)
          OR session_id IN (
            SELECT id FROM sessions
            WHERE coach_id IN (SELECT id FROM users WHERE google_id IS NOT NULL)
          )`
    );
    console.log(`Bookings deleted: ${bookingsDeleted}`);

    // Delete sessions created by Google coaches
    const sessionsDeleted = await run(
      `DELETE FROM sessions
       WHERE coach_id IN (SELECT id FROM users WHERE google_id IS NOT NULL)`
    );
    console.log(`Sessions deleted: ${sessionsDeleted}`);

    // Finally delete Google users
    const usersDeleted = await run(
      `DELETE FROM users WHERE google_id IS NOT NULL`
    );
    console.log(`Users deleted: ${usersDeleted}`);

    console.log('Purge complete.');
  } catch (err) {
    console.error('Error during purge:', err);
    process.exitCode = 1;
  } finally {
    db.close();
  }
})();


