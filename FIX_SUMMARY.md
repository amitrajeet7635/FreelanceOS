# Fix Summary: Extension POST Request Issue

## Problem Identified
The POST request to `/api/ext/add-lead` was failing because:

1. **Missing `user_id` column in `leads` table** - The API route was trying to insert `user_id` but the table schema didn't include it
2. **Missing `priority`, `source`, and `estimated_value` columns** - Required by the API route
3. **Field mapping confusion** - The extension was sending both `bio` and `notes`, but the API was only using `bio`
4. **Lack of error logging** - Errors weren't being properly logged for debugging

## Changes Made

### 1. Database Schema Updates (`supabase/schema.sql`)
Added the following columns to the `leads` table:
- `user_id` (UUID, FK to auth.users) - Required for multi-tenant support
- `priority` (TEXT, default 'P3') - Lead priority
- `source` (TEXT, default 'other') - Track lead source (e.g., 'instagram_extension')
- `estimated_value` (NUMERIC) - Estimated client value

### 2. Database Migration (`supabase/migrations/20260415150000_add_user_fields_to_leads.sql`)
Created migration to add the missing columns to the existing `leads` table:
```sql
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'P3',
ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'other',
ADD COLUMN IF NOT EXISTS estimated_value NUMERIC;

CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_user_username ON leads(user_id, username);
```

### 3. API Route Fix (`app/api/ext/add-lead/route.ts`)
- Changed field mapping from `bio` to `notes` (since extension sends `notes` directly)
- Added proper error logging for debugging
- Improved error handling in catch block

**Before:**
```typescript
notes: body?.bio ? String(body.bio) : null,
```

**After:**
```typescript
notes: body?.notes ? String(body.notes) : null,
```

### 4. Extension Cleanup (`chrome-extension/popup.js`)
- Removed `priority` field from payload (backend sets it automatically to 'P3')
- Removed `bio` field from payload (now using `notes` directly)
- Simplified payload to only send necessary fields:

**Fields sent by extension:**
- `username` (required)
- `followers` (optional)
- `notes` (optional)
- `profileUrl` (optional)
- `hasWebsite` (required)
- `niche` (required)

### 5. Enhanced Logging (`chrome-extension/background.js`)
Added console logging to track:
- Lead submission attempts
- API response status and payload
- Network errors

## Deployment Steps

### For Supabase Database
1. Go to Supabase Dashboard → SQL Editor
2. Run the migration SQL:
```sql
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'P3',
ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'other',
ADD COLUMN IF NOT EXISTS estimated_value NUMERIC;

CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_user_username ON leads(user_id, username);
```

### For FreelanceOS App
1. Restart the development server: `npm run dev`
2. The updated API route will automatically compile

### For Chrome Extension
1. Reload the extension in Chrome (Extensions → Reload)
2. Test the lead capture on an Instagram profile

## Testing

### Test POST Request
1. Open Extension Settings and generate/copy API key
2. Visit an Instagram profile
3. Click "Add as Lead"
4. Check:
   - Form fills correctly (username, followers, bio extracted)
   - All fields populate correctly
   - Success message appears
   - Lead appears in FreelanceOS Leads page

### Test Data Mapping
Expected data flow:
- Extension form field → API body field → Database column
- `username` → `username` → `username`
- `followers` → `followers` → `followers`
- `notes` → `notes` → `notes`
- `profileUrl` → `profileUrl` → `ig_link`
- `hasWebsite` → `hasWebsite` → `has_website`
- `niche` → `niche` → `niche`
- (automatic) → → `user_id` (from API key)
- (automatic) → → `priority` = 'P3'
- (automatic) → → `source` = 'instagram_extension'
- (automatic) → → `stage` = 'found'

## Browser Console Commands

To check if the extension is working, open Extension Background Worker Console:
1. Chrome → Extensions → FreelanceOS Instagram Lead Capture → "Details" → "Service Worker"
2. Look for logs like:
```
[Extension] Submitting lead: {username: "@username123", niche: "Fitness/Gym"}
[Extension] API response: 200 {success: true, lead: {...}}
```

## Error Messages

### 401 Unauthorized
- **Cause:** Invalid API key
- **Fix:** Generate a new key in FreelanceOS Settings

### 409 Duplicate
- **Cause:** Lead already exists
- **Fix:** Check Leads page or try different profile

### 500 Server Error
- **Cause:** Missing user_id column or other schema issue
- **Fix:** Run the migration in Supabase

### Network Error
- **Cause:** FreelanceOS not running or unreachable
- **Fix:** Start dev server: `npm run dev`
