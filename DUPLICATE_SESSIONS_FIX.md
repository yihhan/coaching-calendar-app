# Fix for Duplicate Sessions Issue

## Problem
Users reported seeing duplicate sessions by the same coach at the same time.

## Root Cause Analysis

1. **Overlap Detection Query Issue**: The original overlap detection query had redundant conditions and was checking the same overlap condition twice with swapped parameters.

2. **Race Condition**: If two session creation requests come in simultaneously, both might pass the overlap check before either is inserted into the database.

3. **No Database Constraint**: The sessions table doesn't have a unique constraint on (coach_id, start_time, end_time) to prevent duplicates at the database level.

## Fixes Applied

### 1. Improved Overlap Detection Query ✅

**Before:**
```sql
WHERE coach_id = ? 
AND status IN ('available', 'booked')
AND (
  (start_time < ? AND end_time > ?) OR
  (start_time < ? AND end_time > ?) OR
  (start_time >= ? AND end_time <= ?)
)
```

**After:**
```sql
WHERE coach_id = ? 
AND status IN ('available', 'booked')
AND start_time < ? 
AND end_time > ?
```

The standard overlap check is: Two time ranges overlap if `start1 < end2 AND end1 > start2`

### 2. Added Logging ✅

Added console logging to track when sessions are created and when overlaps are detected:
- `✅ Session created: ID {id} for coach {coach_id} at {start_time}-{end_time}`
- `⚠️  Session creation blocked: Overlap detected for coach {coach_id} at {start_time}-{end_time} (overlaps with session {id})`

### 3. Error Handling ✅

Improved error logging for database insertion failures.

## Testing

### Scripts Created

1. **find-duplicate-sessions-api.js** - Queries the API to find overlapping sessions
   ```bash
   node find-duplicate-sessions-api.js
   ```

2. **find-duplicate-sessions.js** - Directly queries the database (requires sqlite3 module)
   ```bash
   node find-duplicate-sessions.js
   ```

### Test Results

Running `find-duplicate-sessions-api.js` against www.calla.sg:
- ✅ No duplicate/overlapping sessions found in current data
- The fix should prevent new duplicates from being created

## Recommendations

### Short Term
1. ✅ **Fixed**: Improved overlap detection query
2. ✅ **Fixed**: Added logging for debugging
3. ⚠️ **Monitor**: Watch server logs for overlap detection messages

### Long Term
1. **Database Migration**: Consider adding a unique index or constraint (though this is complex for overlapping time ranges)
2. **Transaction Locking**: Implement proper transaction locking to prevent race conditions (requires refactoring callback-based code)
3. **UI Validation**: Add client-side validation to prevent users from submitting overlapping sessions
4. **Cleanup Script**: Create a script to identify and optionally remove existing duplicate sessions

## How to Verify the Fix

1. **Check Server Logs**: Look for overlap detection messages when sessions are created
2. **Run Detection Script**: Periodically run `find-duplicate-sessions-api.js` to check for duplicates
3. **Test Session Creation**: Try creating overlapping sessions - they should be blocked with a conflict message

## Files Modified

- `server/index.js` - Fixed overlap detection query and added logging
- `find-duplicate-sessions-api.js` - New script to detect duplicates via API
- `find-duplicate-sessions.js` - New script to detect duplicates via database (requires sqlite3)

## Next Steps

1. Deploy the fix to production
2. Monitor logs for overlap detection
3. If duplicates are found, create a cleanup script to remove them
4. Consider implementing transaction-based locking for better race condition prevention

