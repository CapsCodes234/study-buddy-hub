# Backup Export/Import v2 Manual Test Checklist

## Test Scenarios

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

## Verification Requirements

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
