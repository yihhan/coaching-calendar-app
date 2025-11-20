# Comprehensive Testing Checklist for Subscription Feature

## ✅ Automated Tests (Completed)
- [x] Database schema validation
- [x] API endpoints structure
- [x] Frontend components
- [x] Translations (English & Chinese)
- [x] Code quality checks
- [x] Integration points

## 🧪 Manual Testing Checklist

### 1. Database & Backend Tests

#### Database Schema
- [ ] Start server and verify `coach_subscriptions` table is created
- [ ] Verify table has columns: `id`, `student_id`, `coach_id`, `created_at`
- [ ] Verify UNIQUE constraint prevents duplicate subscriptions
- [ ] Verify foreign key constraints work correctly

#### API Endpoints - POST /api/subscriptions/:coachId
- [ ] **Test as Student**: Subscribe to a coach (should succeed)
- [ ] **Test as Coach**: Try to subscribe (should return 403)
- [ ] **Test Duplicate**: Try to subscribe to same coach twice (should return 400)
- [ ] **Test Invalid Coach**: Subscribe to non-existent coach (should return 404)
- [ ] **Test Self-Subscribe**: Student tries to subscribe to themselves (should return 400)
- [ ] **Test Unauthenticated**: Make request without token (should return 401)

#### API Endpoints - DELETE /api/subscriptions/:coachId
- [ ] **Test as Student**: Unsubscribe from a coach (should succeed)
- [ ] **Test as Coach**: Try to unsubscribe (should return 403)
- [ ] **Test Non-Existent**: Unsubscribe from coach you're not following (should return 404)
- [ ] **Test Unauthenticated**: Make request without token (should return 401)

#### API Endpoints - GET /api/subscriptions
- [ ] **Test as Student**: Get list of subscriptions (should return array)
- [ ] **Test as Coach**: Try to get subscriptions (should return 403)
- [ ] **Test Empty**: Get subscriptions when none exist (should return empty array)
- [ ] **Test Data Structure**: Verify response includes coach name, description, expertise
- [ ] **Test Unauthenticated**: Make request without token (should return 401)

#### API Endpoints - GET /api/subscriptions/:coachId
- [ ] **Test Subscribed**: Check if subscribed to a coach (should return `{ subscribed: true }`)
- [ ] **Test Not Subscribed**: Check if not subscribed (should return `{ subscribed: false }`)
- [ ] **Test as Coach**: Try to check subscription (should return 403)

### 2. Email Notification Tests

#### Session Creation Notification
- [ ] **Setup**: Student subscribes to a coach
- [ ] **Action**: Coach creates a new session
- [ ] **Verify**: Student receives email notification
- [ ] **Verify Email Content**: 
  - [ ] Email contains session title
  - [ ] Email contains session description
  - [ ] Email contains date and time
  - [ ] Email contains price and capacity
  - [ ] Email contains link to booking page
- [ ] **Test Multiple Subscribers**: Multiple students subscribe, all receive emails
- [ ] **Test No Subscribers**: Coach creates session with no subscribers (no errors)
- [ ] **Test Email Disabled**: Verify graceful handling when email is not configured

### 3. Frontend Tests - Profile Component

#### Display Subscriptions
- [ ] **As Student**: Navigate to Profile page
- [ ] **Verify**: "Coach Subscriptions" section is visible
- [ ] **Verify**: Shows list of subscribed coaches
- [ ] **Verify**: Each subscription shows:
  - [ ] Coach name
  - [ ] Coach description (truncated if long)
  - [ ] Coach expertise badges
  - [ ] Subscription date
  - [ ] Unfollow button
- [ ] **Test Empty State**: When no subscriptions, shows appropriate message
- [ ] **Test Loading State**: Shows loading indicator while fetching

#### Unsubscribe Functionality
- [ ] **Click Unfollow**: Click unfollow button on a subscription
- [ ] **Verify**: Confirmation dialog appears (if implemented)
- [ ] **Confirm**: Confirm unfollow action
- [ ] **Verify**: Subscription is removed from list
- [ ] **Verify**: Success toast message appears
- [ ] **Verify**: List updates immediately
- [ ] **Test Error**: Simulate network error, verify error message

#### Language Support
- [ ] **Switch to Chinese**: Change language to 中文
- [ ] **Verify**: All subscription-related text is in Chinese
- [ ] **Switch to English**: Change language back to English
- [ ] **Verify**: All text is in English

### 4. Frontend Tests - StudentBooking Component

#### Follow Button
- [ ] **Navigate**: Go to Book Sessions page
- [ ] **Verify**: Each session card shows coach name
- [ ] **Verify**: "Follow" button appears for coaches not yet followed
- [ ] **Click Follow**: Click follow button on a session
- [ ] **Verify**: Button shows loading state
- [ ] **Verify**: Success toast message appears
- [ ] **Verify**: Button changes to "Following" badge
- [ ] **Verify**: Badge persists after page refresh

#### Following Badge
- [ ] **Verify**: Sessions from followed coaches show "Following" badge
- [ ] **Verify**: Badge has tooltip explaining subscription
- [ ] **Verify**: Badge is styled correctly (green/success color)

#### Subscription State Management
- [ ] **Test State Sync**: Follow a coach, verify it appears in Profile
- [ ] **Test State Sync**: Unfollow from Profile, verify button reappears in Booking
- [ ] **Test Multiple**: Follow multiple coaches, verify all show correctly
- [ ] **Test Refresh**: Follow a coach, refresh page, verify state persists

#### Filter Integration
- [ ] **Test Filters**: Apply filters, verify follow buttons still work
- [ ] **Test Tab Switch**: Switch between "Available Sessions" and "My Bookings"
- [ ] **Verify**: Subscription state persists across tab switches

### 5. Integration Tests

#### End-to-End Flow
1. [ ] **Student Registration**: Create a student account
2. [ ] **Coach Registration**: Create a coach account
3. [ ] **Subscribe**: Student follows coach from booking page
4. [ ] **Verify Subscription**: Check Profile page shows subscription
5. [ ] **Create Session**: Coach creates a new session
6. [ ] **Check Email**: Student receives email notification
7. [ ] **Book Session**: Student books the session from email link
8. [ ] **Unsubscribe**: Student unfollows coach from Profile
9. [ ] **Create Another Session**: Coach creates another session
10. [ ] **Verify No Email**: Student does NOT receive email (unsubscribed)

#### Edge Cases
- [ ] **Coach Deletes Account**: What happens to subscriptions? (if applicable)
- [ ] **Student Deletes Account**: Subscriptions should be cleaned up (if applicable)
- [ ] **Concurrent Subscriptions**: Multiple students subscribe simultaneously
- [ ] **Network Failures**: Test behavior when API calls fail
- [ ] **Session Deletion**: Coach deletes session, verify no errors in subscription system

### 6. Performance Tests

- [ ] **Many Subscriptions**: Student follows 20+ coaches, verify performance
- [ ] **Many Subscribers**: Coach has 50+ subscribers, verify email sending performance
- [ ] **Large Session List**: Many sessions, verify follow buttons render quickly
- [ ] **Database Queries**: Verify subscription queries are optimized

### 7. Security Tests

- [ ] **Authorization**: Verify students can only manage their own subscriptions
- [ ] **Input Validation**: Test with invalid coach IDs (negative, non-existent, etc.)
- [ ] **SQL Injection**: Test with malicious input (should be sanitized)
- [ ] **XSS Prevention**: Verify user input is properly escaped in UI

### 8. UI/UX Tests

- [ ] **Responsive Design**: Test on mobile, tablet, desktop
- [ ] **Accessibility**: Test with screen reader, keyboard navigation
- [ ] **Visual Feedback**: Loading states, success/error messages are clear
- [ ] **Button States**: Disabled states work correctly
- [ ] **Tooltips**: Hover tooltips provide helpful information

## 🐛 Known Issues to Verify

- [ ] ESLint warnings are resolved (useCallback dependencies)
- [ ] No console errors in browser
- [ ] No console errors in server logs
- [ ] Email service handles failures gracefully
- [ ] Translations work correctly with placeholders (e.g., `{{coachName}}`)

## 📝 Test Results Template

```
Date: __________
Tester: __________

Backend Tests: ___/___ passed
Frontend Tests: ___/___ passed
Integration Tests: ___/___ passed
Email Tests: ___/___ passed

Issues Found:
1. 
2. 
3. 

Notes:
```

