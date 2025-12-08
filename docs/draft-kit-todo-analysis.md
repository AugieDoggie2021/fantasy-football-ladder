# Draft Kit To-Do List Analysis

## Missing Items

### 1. `getCurrentDraftState` Helper Function (Stage 2.2)
**Status:** Mentioned but not implemented  
**Location:** Should be in `web/app/actions/draft.ts` or `web/lib/draft-helpers.ts`  
**Purpose:** Returns current pick, next pick, draft status, timer info  
**Priority:** HIGH - Needed before UI work

### 2. Commissioner Draft Controls UI Component
**Status:** Missing  
**Location:** Should be `web/components/draft-controls.tsx` or similar  
**Purpose:** Buttons for Start/Pause/Resume/Complete draft (commissioner only)  
**Priority:** HIGH - Should be added in Stage 3 or early Stage 7  
**Reference:** Similar to `CommissionerScoringControls` component

### 3. Background Job/Cron Setup for Timer Expiration
**Status:** API route exists, but no cron configuration  
**Location:** 
- API route: `web/app/api/draft/check-expired-picks/route.ts` ✅
- Cron config: Missing (should be Vercel Cron or Supabase Edge Function)  
**Priority:** MEDIUM - Can work with manual polling initially, but needed for production

### 4. Draft Settings UI
**Status:** Missing  
**Purpose:** Allow commissioner to configure:
- Timer duration
- Auto-pick enabled/disabled
- Number of rounds
**Priority:** MEDIUM - Can use defaults initially

## Order Issues

### Issue 1: Timer vs Realtime Order
**Current Order:**
- Stage 4: Realtime Updates
- Stage 5: Draft Timer System

**Problem:** Timer is more fundamental. Realtime makes timer updates visible, but timer should work first.

**Recommendation:** 
- Option A: Keep current order (Realtime first) - Makes sense if you want live updates immediately
- Option B: Swap order (Timer first) - Makes sense if timer is core functionality

**Decision:** Keep current order. Realtime is valuable even without timer, and timer benefits from realtime updates.

### Issue 2: Draft Controls UI Placement
**Current:** No dedicated stage for commissioner controls UI  
**Problem:** Controls are needed early but scattered across stages

**Recommendation:** Add new stage or subsection:
- **Stage 3.4: Commissioner Draft Controls UI**
  - Start/Pause/Resume/Complete buttons
  - Draft settings configuration
  - Should come after Stage 3.3 (Permission Helpers)

### Issue 3: Queue UI Before Timer UI
**Current Order:**
- Stage 5: Timer
- Stage 6: Queue UI

**Problem:** Queue is less critical than timer, but both are independent features.

**Recommendation:** Current order is fine. Queue can work without timer.

## Suggested Additions to To-Do List

### Stage 2.5: Draft State Helper Functions (NEW)
- [ ] Create `getCurrentDraftState` helper function
  - Returns current pick details
  - Returns next pick preview
  - Returns draft status
  - Returns timer info (if active)
  - Returns team summaries
- [ ] Create `getDraftProgress` helper function
  - Returns picks made / total picks
  - Returns round progress
  - Returns team pick counts

### Stage 3.4: Commissioner Draft Controls UI (NEW)
- [ ] Create `DraftControls` component
  - Start Draft button (when scheduled)
  - Pause Draft button (when in_progress)
  - Resume Draft button (when paused)
  - Complete Draft button (when all picks made)
  - Draft settings configuration panel
- [ ] Add controls to draft page (commissioner only)
- [ ] Show draft status badge
- [ ] Show draft progress indicator

### Stage 2.6: Background Job Setup (NEW)
- [ ] Set up Vercel Cron job for timer expiration
  - Or: Create Supabase Edge Function with scheduled trigger
  - Call `/api/draft/check-expired-picks` every 5-10 seconds
- [ ] Add error handling and logging
- [ ] Add monitoring/alerting

## Revised Priority Order

### Immediate Next Steps (In Order):
1. ✅ Stage 1: Database Foundation (DONE)
2. ✅ Stage 2.1-2.4: Backend Actions (DONE)
3. ✅ Stage 3.1-3.3: Permissions (DONE)
4. **Stage 2.5: Draft State Helper Functions** (NEW - ADD THIS)
5. **Stage 3.4: Commissioner Draft Controls UI** (NEW - ADD THIS)
6. Stage 4: Realtime Updates
7. Stage 5: Draft Timer System
8. Stage 6: Draft Queue UI
9. Stage 7: Enhanced Draft Room UI
10. Stage 8: Mobile Optimization
11. Stage 9: Draft Completion
12. Stage 10: Error Handling
13. Stage 11: Testing
14. Stage 12: Analytics
15. Stage 13: Documentation
16. Stage 14: Deployment

## Summary

**Missing Critical Items:**
1. `getCurrentDraftState` helper function
2. Commissioner draft controls UI component
3. Background job/cron setup (can defer)

**Order Issues:**
- Timer vs Realtime: Current order is fine
- Draft controls UI: Should be added as Stage 3.4

**Recommendation:**
Add Stage 2.5 and Stage 3.4 before moving to Stage 4 (Realtime). This ensures:
- UI has helper functions to get draft state
- Commissioner can actually start/manage drafts
- Foundation is solid before adding realtime features

