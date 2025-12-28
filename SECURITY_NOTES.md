# Security Notes — Study Buddy Hub

This document summarizes security considerations and client-side API key handling for this project.

---

## Client-Side API Keys

### AI API Key (`OPENROUTER_API_KEY`)

**Location:** `src/ai/aiClient.ts` (lines 275-276, 312-313)

**Status:** ⚠️ Intentionally client-side for local-first personal use

**Current Behavior:**
- API key is loaded via `import.meta.env.OPENROUTER_API_KEY`
- Used for OpenRouter API calls for syllabus extraction and AI summaries
- Key is stored in user's browser environment (`.env.local`)

**Why This Is Acceptable (for this app):**
This is a **local-first personal study tool**. Users optionally provide their *own* API key for their *own* use — they are not exposing someone else's key. The app has no shared backend or multi-user functionality.

**For Production Multi-Tenant Apps:**
If this app were to become multi-tenant or deployed as a service, you MUST:
1. Move AI API calls to Edge Functions or backend proxy
2. Implement server-side authentication to control AI access
3. Use session-based tokens instead of direct API keys
4. Add rate limiting per user/session
5. Monitor usage and implement cost controls

### Files Containing Environment Variable References

| File | Variables | Purpose |
|------|-----------|---------|
| `src/ai/aiClient.ts` | `OPENROUTER_API_KEY`, `VITE_AI_PROVIDER` | AI provider configuration |
| `src/ai/summarizer.ts` | `OPENROUTER_API_KEY` | Error messages |
| `src/components/settings/Settings.tsx` | `VITE_AI_PROVIDER` | Display current provider |

---

## Input Validation

### CSV Import Validation

**Location:** `src/lib/storage.ts`, `src/lib/validation.ts`

**Status:** ✅ Implemented

- CSV rows are validated with Zod schemas (`csvBulletSchema`)
- Size limits: max 50KB file, max 1000 rows
- String sanitization applied to all text fields
- Invalid rows are rejected with validation errors

### localStorage Validation

**Location:** `src/lib/storage.ts`

**Status:** ✅ Implemented

- All localStorage loads use `safeJSONParse` wrapper
- App state is validated with `appStateSchema` after parsing
- Malformed data returns null and triggers safe defaults

### AI Response Validation

**Location:** `src/ai/aiClient.ts`

**Status:** ✅ Implemented

- AI-generated JSON is parsed with `safeJSONParse`
- Extracted syllabus data is validated with `validateExtractedSyllabus`
- Invalid responses return empty arrays with console warnings

---

## Recommended Security Enhancements

### Priority: Medium
1. **Add CSP headers** — Implement Content Security Policy to restrict inline scripts
2. **Subresource Integrity** — Add SRI hashes for external CDN resources

### Priority: Low (for personal use)
3. **Rate limiting** — Add client-side rate limiting for AI API calls
4. **Usage tracking** — Track AI API usage to prevent accidental cost overruns

---

## Server-Side Migration Path

If deploying as a multi-user service:

1. Enable Lovable Cloud or Supabase
2. Create an Edge Function to proxy AI requests:
   ```typescript
   // supabase/functions/ai-proxy/index.ts
   serve(async (req) => {
     const { messages } = await req.json();
     const API_KEY = Deno.env.get("AI_API_KEY"); // Server-side only
     // ... proxy to OpenRouter
   });
   ```
3. Remove `OPENROUTER_API_KEY` from client code
4. Update `aiClient.ts` to call the Edge Function instead
5. Add user authentication before allowing AI access

---

## Dependency Audit

Run `npm audit --audit-level=high` periodically to check for vulnerable dependencies.

Last audit: See CI/CD pipeline for latest results.

---

*Generated: 2025-12-27*
