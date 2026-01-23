#!/usr/bin/env node

/**
 * Script to find duplicate sessions by querying the API
 * This can be run against the production server
 */

const axios = require('axios');

const BASE_URL = process.env.TEST_URL || 'https://www.calla.sg';

async function findDuplicateSessions() {
  console.log(`\n🔍 Searching for duplicate sessions at ${BASE_URL}...\n`);

  try {
    // Get all sessions from the calendar endpoint
    const response = await axios.get(`${BASE_URL}/api/sessions/calendar`);
    const sessions = response.data;

    if (!Array.isArray(sessions)) {
      console.error('❌ Invalid response format');
      return;
    }

    console.log(`📊 Found ${sessions.length} total sessions\n`);

    // Group sessions by coach
    const byCoach = {};
    sessions.forEach(session => {
      const coachId = session.coach_id;
      if (!byCoach[coachId]) {
        byCoach[coachId] = {
          coach_name: session.coach_name || `Coach ${coachId}`,
          sessions: []
        };
      }
      byCoach[coachId].sessions.push(session);
    });

    // Find overlapping sessions for each coach
    const duplicates = [];
    
    Object.keys(byCoach).forEach(coachId => {
      const coach = byCoach[coachId];
      const coachSessions = coach.sessions;
      
      // Check each pair of sessions for overlap
      for (let i = 0; i < coachSessions.length; i++) {
        for (let j = i + 1; j < coachSessions.length; j++) {
          const s1 = coachSessions[i];
          const s2 = coachSessions[j];
          
          // Check if sessions overlap
          // Two time ranges overlap if: start1 < end2 AND end1 > start2
          const start1 = new Date(s1.start_time);
          const end1 = new Date(s1.end_time);
          const start2 = new Date(s2.start_time);
          const end2 = new Date(s2.end_time);
          
          if (start1 < end2 && end1 > start2) {
            duplicates.push({
              coach_id: coachId,
              coach_name: coach.coach_name,
              session1: {
                id: s1.id,
                title: s1.title,
                start_time: s1.start_time,
                end_time: s1.end_time,
                status: s1.status
              },
              session2: {
                id: s2.id,
                title: s2.title,
                start_time: s2.start_time,
                end_time: s2.end_time,
                status: s2.status
              }
            });
          }
        }
      }
    });

    if (duplicates.length === 0) {
      console.log('✅ No duplicate/overlapping sessions found!');
      return;
    }

    console.log(`⚠️  Found ${duplicates.length} overlapping session pairs:\n`);
    
    // Group by coach for display
    const byCoachDuplicates = {};
    duplicates.forEach(dup => {
      if (!byCoachDuplicates[dup.coach_id]) {
        byCoachDuplicates[dup.coach_id] = {
          coach_name: dup.coach_name,
          pairs: []
        };
      }
      byCoachDuplicates[dup.coach_id].pairs.push(dup);
    });

    // Display results
    Object.keys(byCoachDuplicates).forEach(coachId => {
      const coach = byCoachDuplicates[coachId];
      console.log(`\n👤 Coach: ${coach.coach_name} (ID: ${coachId})`);
      console.log('─'.repeat(80));
      
      coach.pairs.forEach(pair => {
        console.log(`\n  ⚠️  Overlapping Sessions:`);
        console.log(`     Session ${pair.session1.id}: ${pair.session1.start_time} - ${pair.session1.end_time} (${pair.session1.status})`);
        console.log(`     Session ${pair.session2.id}: ${pair.session2.start_time} - ${pair.session2.end_time} (${pair.session2.status})`);
        console.log(`     Title: ${pair.session1.title}`);
      });
    });

    console.log('\n\n📊 Summary:');
    console.log(`   Total overlapping pairs: ${duplicates.length}`);
    console.log(`   Coaches affected: ${Object.keys(byCoachDuplicates).length}`);
    
    // Count unique sessions involved
    const uniqueSessions = new Set();
    duplicates.forEach(dup => {
      uniqueSessions.add(dup.session1.id);
      uniqueSessions.add(dup.session2.id);
    });
    console.log(`   Unique sessions involved: ${uniqueSessions.size}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

findDuplicateSessions();

