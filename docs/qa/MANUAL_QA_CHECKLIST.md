# Manual QA Checklist
## Study Buddy Hub - Pre-Deployment Testing

Use this checklist before every deployment to ensure app stability and correctness.

---

## Pre-Deployment System Checks

- [ ] Run `npm run build` - Should complete without errors
- [ ] Run `npm run lint` - Should have 0 errors (warnings OK)
- [ ] Run `npx tsc --noEmit` - Should have 0 errors
- [ ] Run `npm audit` - Review vulnerabilities (dev deps OK)
- [ ] Run `npx vitest run` - Critical tests should pass

---

## 1. Syllabus Import & Management

### CSV Import
- [ ] Import syllabus CSV file
- [ ] Verify all topics appear in the UI
- [ ] Verify chapters appear only once (no duplicates)
- [ ] Check chapter counts match CSV row count
- [ ] Verify progress tracking works (mark topics as done)
- [ ] Navigate away and back - data persists
- [ ] Refresh page - data persists, no duplicates

### Topic Management
- [ ] Add new topic manually
- [ ] Edit existing topic
- [ ] Delete topic
- [ ] Bulk update topics (status changes)
- [ ] Verify analytics update correctly

---

## 2. Past Papers Management

### Adding Papers
- [ ] Add past paper manually
- [ ] Add multiple past papers for same subject
- [ ] Add papers for different subjects
- [ ] Verify papers appear in list
- [ ] Check filtering works (by subject, year, completion)
- [ ] Check sorting works (by year, session)
- [ ] Verify analytics update (completion counts, percentages)

### Paper Operations
- [ ] Mark paper as completed
- [ ] Update paper score/percentage
- [ ] Edit paper details
- [ ] Delete paper
- [ ] Navigate away and back - data persists
- [ ] Refresh page - no duplicates appear

---

## 3. Import/Export Functionality

### Export Backup
- [ ] Go to Settings → Export Backup
- [ ] Verify JSON file downloads
- [ ] Open file - verify it's valid JSON
- [ ] Check file contains all data (bullets, papers, subjects)

### Import Backup
- [ ] Export current data as backup
- [ ] Clear all data (or clear one subject)
- [ ] Import the backup
- [ ] **CRITICAL:** Verify NO duplicates appear
- [ ] **CRITICAL:** Verify analytics counts are correct (not inflated)
- [ ] Check all subjects restored
- [ ] Check all bullets restored
- [ ] Check all past papers restored

### Repeated Imports
- [ ] Import same backup twice
- [ ] Verify no duplicates created
- [ ] Verify counts remain correct
- [ ] Check deduplication message appears if duplicates removed

---

## 4. Data Clearing

### Clear All Data
- [ ] Go to Settings → Clear All Data
- [ ] Confirm action
- [ ] Verify app returns to initial state
- [ ] Verify onboarding appears (if not completed)
- [ ] Check localStorage is cleared (DevTools → Application)
- [ ] Verify no data remains in IndexedDB

### Clear Data by Subject
- [ ] Add data for multiple subjects (bullets, papers)
- [ ] Go to Settings → Clear Data by Subject
- [ ] Select one subject to clear
- [ ] Confirm action
- [ ] **CRITICAL:** Verify cleared subject has no bullets
- [ ] **CRITICAL:** Verify cleared subject has no past papers
- [ ] **CRITICAL:** Verify other subjects are NOT affected
- [ ] Check chapter completion celebrations cleared for that subject
- [ ] Check components cleared for that subject
- [ ] Check theme overrides cleared for that subject

### Re-import After Clear
- [ ] Clear data for one subject
- [ ] Export backup (before clearing)
- [ ] Import the backup
- [ ] **CRITICAL:** Verify NO duplicates appear
- [ ] **CRITICAL:** Verify cleared subject data is restored
- [ ] **CRITICAL:** Verify other subjects remain intact
- [ ] Check analytics counts are correct

---

## 5. PWA / Offline Functionality

### Service Worker
- [ ] Install PWA (if supported)
- [ ] Clear all data
- [ ] Go offline
- [ ] Verify cleared state persists (not restored from cache)
- [ ] Go online
- [ ] Verify data remains cleared

### Offline Cache
- [ ] Load app with data
- [ ] Go offline
- [ ] Clear data while offline
- [ ] Go online
- [ ] Verify data remains cleared (not restored from cache)

---

## 6. Data Integrity

### Duplicate Detection
- [ ] Manually create duplicate bullets (same subject, topic, text)
- [ ] Refresh page
- [ ] Verify duplicates are automatically cleaned
- [ ] Check console for integrity warnings
- [ ] Verify analytics counts are correct

### Import Deduplication
- [ ] Create backup with duplicate data
- [ ] Import backup
- [ ] Verify duplicates are removed
- [ ] Check deduplication message appears
- [ ] Verify counts are correct

---

## 7. Analytics & Statistics

### After Import
- [ ] Note current bullet count
- [ ] Note current paper count
- [ ] Import backup (with same data)
- [ ] **CRITICAL:** Verify counts do NOT double
- [ ] Verify percentages remain correct
- [ ] Check subject progress bars

### After Clear
- [ ] Note counts for each subject
- [ ] Clear one subject
- [ ] Verify that subject's counts go to 0
- [ ] Verify other subjects' counts unchanged
- [ ] Re-import data
- [ ] Verify counts restore correctly (not inflated)

---

## 8. Edge Cases

### Empty States
- [ ] Clear all data
- [ ] Verify app handles empty state gracefully
- [ ] Import empty backup
- [ ] Verify no errors occur

### Large Datasets
- [ ] Import backup with 1000+ bullets
- [ ] Verify performance is acceptable
- [ ] Check no duplicates appear
- [ ] Verify all data loads correctly

### Invalid Data
- [ ] Try importing corrupted JSON
- [ ] Verify error message appears
- [ ] Verify app state not corrupted
- [ ] Try importing backup from different version
- [ ] Verify graceful handling

---

## 9. Cross-Browser Testing

- [ ] Test in Chrome/Edge
- [ ] Test in Firefox
- [ ] Test in Safari (if available)
- [ ] Verify localStorage works
- [ ] Verify PWA install works (if supported)

---

## 10. Performance

### Load Times
- [ ] Initial app load < 3 seconds
- [ ] Import large backup < 5 seconds
- [ ] Clear operations complete immediately
- [ ] No UI freezing during operations

### Memory
- [ ] Monitor memory usage (DevTools)
- [ ] Verify no memory leaks after multiple imports
- [ ] Check localStorage size (should be reasonable)

---

## Critical Paths (Must Pass)

These are the most important flows - **ALL must pass** before deployment:

1. ✅ Import backup → No duplicates
2. ✅ Clear subject data → Other subjects unaffected
3. ✅ Clear + Re-import → No duplicates
4. ✅ Analytics counts accurate after all operations
5. ✅ PWA cache doesn't restore deleted data

---

## Sign-Off

**Tester Name:** _________________  
**Date:** _________________  
**All Critical Paths Passed:** [ ] Yes [ ] No  
**Ready for Deployment:** [ ] Yes [ ] No  

**Notes:**
_________________________________________________
_________________________________________________
_________________________________________________

---

## Quick Test Script

For rapid testing, run this sequence:

1. Export backup
2. Clear one subject
3. Import backup
4. Verify no duplicates
5. Check analytics counts
6. ✅ PASS / ❌ FAIL

**Time Required:** ~5 minutes

