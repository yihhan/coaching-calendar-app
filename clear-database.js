const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = process.env.NODE_ENV === 'production' 
  ? '/var/www/coaching-calendar-app/server/coaching.db' 
  : './coaching.db';

console.log('🗑️  Clearing local database...');
console.log('📁 Database path:', dbPath);

const db = new sqlite3.Database(dbPath);

// List of tables to clear (in order to respect foreign key constraints)
const tablesToClear = [
  'bookings',
  'sessions', 
  'credits',
  'users'
];

// Function to clear a table
const clearTable = (tableName) => {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM ${tableName}`, function(err) {
      if (err) {
        console.error(`❌ Error clearing ${tableName}:`, err.message);
        reject(err);
      } else {
        console.log(`✅ Cleared ${tableName}: ${this.changes} rows deleted`);
        resolve(this.changes);
      }
    });
  });
};

// Function to reset auto-increment counters
const resetCounters = () => {
  return new Promise((resolve, reject) => {
    const resetQueries = [
      "DELETE FROM sqlite_sequence WHERE name='users'",
      "DELETE FROM sqlite_sequence WHERE name='sessions'", 
      "DELETE FROM sqlite_sequence WHERE name='bookings'",
      "DELETE FROM sqlite_sequence WHERE name='credits'"
    ];

    let completed = 0;
    resetQueries.forEach(query => {
      db.run(query, (err) => {
        if (err) {
          console.error('❌ Error resetting counters:', err.message);
        } else {
          console.log('✅ Reset auto-increment counters');
        }
        completed++;
        if (completed === resetQueries.length) {
          resolve();
        }
      });
    });
  });
};

// Main clearing function
const clearDatabase = async () => {
  try {
    console.log('\n📊 Current database contents:');
    
    // Show current data before clearing
    for (const table of tablesToClear) {
      db.get(`SELECT COUNT(*) as count FROM ${table}`, (err, row) => {
        if (!err && row) {
          console.log(`   ${table}: ${row.count} rows`);
        }
      });
    }

    console.log('\n🧹 Starting database cleanup...');
    
    // Clear tables in order
    for (const table of tablesToClear) {
      await clearTable(table);
    }
    
    // Reset auto-increment counters
    await resetCounters();
    
    console.log('\n✅ Database cleared successfully!');
    console.log('🔄 All tables are now empty and ready for fresh data.');
    
  } catch (error) {
    console.error('❌ Error clearing database:', error);
  } finally {
    db.close((err) => {
      if (err) {
        console.error('❌ Error closing database:', err.message);
      } else {
        console.log('🔒 Database connection closed.');
      }
    });
  }
};

// Run the clearing process
clearDatabase();
