# Manual Test Checklist

## Part A: Subject Data Management - Selective Clearing

### A1. Clear Syllabus Only
- [ ] Go to Settings → Data Management → Clear Data by Subject
- [ ] Click "Clear" for a subject that has syllabus bullets AND past papers
- [ ] Select "Clear syllabus only" option
- [ ] Confirm the clear operation
- [ ] Verify: Syllabus bullets are deleted for that subject
- [ ] Verify: Past paper attempts remain unchanged
- [ ] Verify: Component metadata (paper components) are NOT deleted
- [ ] Verify: Component dropdown still works in "Log Paper" dialog

### A2. Clear Past Papers Only
- [ ] Click "Clear" for a subject with past papers
- [ ] Select "Clear past paper logs only" option
- [ ] Confirm the clear operation
- [ ] Verify: Past paper attempts are deleted
- [ ] Verify: Syllabus bullets remain unchanged
- [ ] Verify: Component metadata are NOT deleted
- [ ] Verify: Component dropdown still works in "Log Paper" dialog

### A3. Clear Both Syllabus + Past Papers
- [ ] Click "Clear" for a subject with both syllabus and papers
- [ ] Select "Clear both" option
- [ ] Confirm the clear operation
- [ ] Verify: Both bullets and papers are deleted
- [ ] Verify: Component metadata are NOT deleted
- [ ] Verify: Analytics update correctly with no stale data

---

## Part B: Past Paper CRUD Operations

### B1. Edit Past Paper Attempt
- [ ] Navigate to a Subject's Past Papers page
- [ ] Click the "⋮" menu on any paper row
- [ ] Click "Edit"
- [ ] Verify: Edit modal opens with current paper data prefilled
- [ ] Change attempt status (Started ↔ Completed)
- [ ] Update raw score and verify percentage recalculates
- [ ] Update notes/comment
- [ ] Save changes
- [ ] Verify: Toast shows "Paper Updated"
- [ ] Verify: Paper row updates immediately without page refresh
- [ ] Verify: No duplicate entries created

### B2. Delete Past Paper Attempt
- [ ] Click the "⋮" menu on any paper row
- [ ] Click "Delete"
- [ ] Verify: Confirmation modal appears with paper details
- [ ] Confirm deletion
- [ ] Verify: Toast shows "Paper Deleted" with Undo button
- [ ] Verify: Paper row disappears immediately
- [ ] Test Undo: Click "Undo" in toast
- [ ] Verify: Paper is restored

### B3. Started vs Completed Validation
- [ ] Open "Log Paper" dialog
- [ ] Select "Started" attempt status
- [ ] Verify: Raw score field shows as optional
- [ ] Save without entering a score
- [ ] Verify: Paper logs successfully with "Started" badge
- [ ] Open "Log Paper" dialog again
- [ ] Select "Completed" attempt status
- [ ] Try to save without entering raw score
- [ ] Verify: Validation error prevents saving
- [ ] Enter valid raw score
- [ ] Verify: Paper logs with percentage calculated

---

## Part C: Backup Export/Import v3

### C0. Pre-Requisites
- [ ] Clear all data and start fresh if needed
- [ ] Import a syllabus CSV that generates components
- [ ] Add some past papers using the component dropdown

### 1. Import CSV that generates components
- [ ] Import syllabus CSV with component columns
- [ ] Verify components are extracted and stored in localStorage
- [ ] Check components appear in UI after import
- [ ] Confirm component count matches expected

### 2. Add past papers
- [ ] Add multiple past papers with different subjects/years
- [ ] Include papers with components linked
- [ ] Verify papers appear in analytics correctly
- [ ] Check component associations are maintained

### 3. Export on tablet → import on laptop
- [ ] Export backup from tablet (iPad Safari/Chrome or Android tablet)
- [ ] Verify Web Share API tries first
- [ ] Test fallback download if Web Share fails/cancelled
- [ ] Transfer backup file to laptop
- [ ] Import backup on laptop
- [ ] Verify all data transfers correctly
- [ ] Check component counts match

### 4. Export on laptop → import on tablet
- [ ] Export backup from laptop (desktop Chrome/Edge)
- [ ] Verify download works correctly
- [ ] Transfer backup file to tablet
- [ ] Import backup on tablet
- [ ] Verify all data transfers correctly
- [ ] Check responsive layout doesn't affect functionality

### 5. Component dropdown after fresh import
- [ ] Clear Subject Data for a subject
- [ ] Import backup (same one exported earlier)
- [ ] Navigate to Past Papers for that subject
- [ ] Click "Log Paper" button
- [ ] **CRITICAL**: Verify component dropdown shows options (not "no components")
- [ ] Verify component count matches pre-clear state

### 6. CSV re-import deduplication
- [ ] Import the same syllabus CSV for a subject twice
- [ ] Verify no duplicate bullets are created
- [ ] Verify no duplicate components are created
- [ ] Check integrity checker shows no duplicates

### Data Integrity Checks
- [ ] pastPapers count matches before/after export/import
- [ ] components count matches before/after export/import
- [ ] analytics stats remain consistent
- [ ] no duplicates exist after import
- [ ] subject associations are preserved
- [ ] component-paper links are maintained

### Cross-Device Compatibility
- [ ] Export works identically on tablet and laptop
- [ ] Import works identically on tablet and laptop
- [ ] Web Share API functions correctly on supported devices
- [ ] Download fallback works on all devices
- [ ] File format is consistent across platforms

### Error Handling
- [ ] Large file rejection works (>10MB)
- [ ] Invalid JSON rejection works
- [ ] Corrupted file rejection works
- [ ] User cancellation (AbortError) handled gracefully
- [ ] No error toast for cancelled share operations

## Test Results Summary

### Issues Found
- [ ] None
- [ ] Document any issues discovered during testing

### Final Verification
- [ ] All test scenarios pass
- [ ] Cross-device functionality confirmed
- [ ] Data integrity maintained
- [ ] Ready for production deployment
