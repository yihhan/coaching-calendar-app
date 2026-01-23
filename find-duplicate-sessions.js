#!/usr/bin/env node

/**
 * Script to find duplicate sessions by the same coach at the same time
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Try to use server's node_modules first, then fallback to root
let sqlite3Module;
try {
  sqlite3Module = require(path.join(__dirname, 'server', 'node_modules', 'sqlite3'));
} catch (e) {
  sqlite3Module = require('sqlite3');
}

const dbPath = path.join(__dirname, 'server', 'coaching.db');

const db = new sqlite3Module.verbose().Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to database');
});

console.log('\n🔍 Searching for duplicate sessions...\n');

// Find sessions by the same coach that overlap in time
const query = `
  SELECT 
    s1.id as session1_id,
    s1.coach_id,
    u.name as coach_name,
    s1.title,
    s1.start_time,
    s1.end_time,
    s1.status,
    s2.id as session2_id,
    s2.start_time as session2_start,
    s2.end_time as session2_end,
    s2.status as session2_status
  FROM sessions s1
  JOIN sessions s2 ON s1.coach_id = s2.coach_id AND s1.id < s2.id
  JOIN users u ON s1.coach_id = u.id
  WHERE s1.status IN ('available', 'booked')
    AND s2.status IN ('available', 'booked')
    AND (
      (s1.start_time < s2.end_time AND s1.end_time > s2.start_time)
    )
  ORDER BY s1.coach_id, s1.start_time
`;

db.all(query, [], (err, rows) => {
  if (err) {
    console.error('❌ Error querying database:', err.message);
    db.close();
    process.exit(1);
  }

  if (rows.length === 0) {
    console.log('✅ No duplicate/overlapping sessions found!');
    db.close();
    process.exit(0);
  }

  console.log(`⚠️  Found ${rows.length} overlapping session pairs:\n`);
  
  // Group by coach
  const byCoach = {};
  rows.forEach(row => {
    if (!byCoach[row.coach_id]) {
      byCoach[row.coach_id] = {
        coach_name: row.coach_name,
        sessions: []
      };
    }
    byCoach[row.coach_id].sessions.push(row);
  });

  // Display results
  Object.keys(byCoach).forEach(coachId => {
    const coach = byCoach[coachId];
    console.log(`\n👤 Coach: ${coach.coach_name} (ID: ${coachId})`);
    console.log('─'.repeat(80));
    
    coach.sessions.forEach(session => {
      console.log(`\n  ⚠️  Overlapping Sessions:`);
      console.log(`     Session ${session.session1_id}: ${session.start_time} - ${session.end_time} (${session.status})`);
      console.log(`     Session ${session.session2_id}: ${session.session2_start} - ${session.session2_end} (${session.session2_status})`);
      console.log(`     Title: ${session.title}`);
    });
  });

  console.log('\n\n📊 Summary:');
  console.log(`   Total overlapping pairs: ${rows.length}`);
  console.log(`   Coaches affected: ${Object.keys(byCoach).length}`);
  
  // Count unique sessions involved
  const uniqueSessions = new Set();
  rows.forEach(row => {
    uniqueSessions.add(row.session1_id);
    uniqueSessions.add(row.session2_id);
  });
  console.log(`   Unique sessions involved: ${uniqueSessions.size}`);

  db.close();
});

