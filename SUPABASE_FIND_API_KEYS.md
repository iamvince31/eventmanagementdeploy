# How to Find Your Supabase API Keys
## Step-by-Step Visual Guide

---

## Step 1: Go to Your Supabase Project

1. Open your browser and go to: **https://supabase.com**
2. Click **"Sign In"** (top right)
3. Log in with your account
4. You'll see your **Dashboard** with all your projects

---

## Step 2: Select Your Project

1. Click on your **"event-management-system"** project
2. You'll be taken to the project dashboard

---

## Step 3: Navigate to API Settings

### Option A: Using the Sidebar
1. Look at the **left sidebar**
2. Scroll down to find the **⚙️ Settings** section (near the bottom)
3. Click on **"API"** under Settings

### Option B: Using the Settings Icon
1. Click the **⚙️ gear icon** at the bottom left
2. Select **"API"** from the menu

---

## Step 4: Find Your API Keys

Once you're on the **API Settings** page, you'll see:

### 📍 Section 1: Project URL
```
┌─────────────────────────────────────────┐
│ Project URL                              │
│ https://xxxxxxxxxxxxx.supabase.co       │
│ [Copy] button                            │
└─────────────────────────────────────────┘
```
- This is at the **top** of the page
- Click the **[Copy]** button to copy it
- **Use this for**: Both frontend and backend `.env` files

### 📍 Section 2: Project API Keys

Scroll down a bit, you'll see a section called **"Project API keys"**:

```
┌─────────────────────────────────────────────────────────┐
│ Project API keys                                         │
│                                                          │
│ anon public                                              │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdX... │
│ [Copy] [Reveal]                                          │
│                                                          │
│ This key is safe to use in a browser if you have        │
│ enabled Row Level Security for your tables and          │
│ configured policies.                                     │
└─────────────────────────────────────────────────────────┘
```
- Click **[Copy]** to copy the `anon public` key
- **Use this for**: Frontend `.env` as `VITE_SUPABASE_ANON_KEY`
- **Use this for**: Backend `.env` as `SUPABASE_ANON_KEY`

```
┌─────────────────────────────────────────────────────────┐
│ service_role secret                                      │
│ ••••••••••••••••••••••••••••••••••••••••••••••••••••••• │
│ [Copy] [Reveal]                                          │
│                                                          │
│ ⚠️ This key has the ability to bypass Row Level         │
│ Security. Never share it publicly.                       │
└─────────────────────────────────────────────────────────┘
```
- Click **[Reveal]** first to see the key
- Then click **[Copy]** to copy the `service_role` key
- **Use this for**: Backend `.env` as `SUPABASE_SERVICE_ROLE_KEY`
- **⚠️ NEVER use this in frontend!**

### 📍 Section 3: JWT Secret (Optional but Recommended)

Scroll down more to find **"JWT Settings"**:

```
┌─────────────────────────────────────────────────────────┐
│ JWT Settings                                             │
│                                                          │
│ JWT Secret                                               │
│ ••••••••••••••••••••••••••••••••••••••••••••••••••••••• │
│ [Copy] [Reveal]                                          │
└─────────────────────────────────────────────────────────┘
```
- Click **[Reveal]** first
- Then click **[Copy]**
- **Use this for**: Backend `.env` as `SUPABASE_JWT_SECRET`

---

## Step 5: Copy Keys to Your .env Files

### Backend (.env)
Open `backend/.env` and paste:

```env
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...
SUPABASE_JWT_SECRET=your-super-secret-jwt-token-with-at-least-32-characters-long
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
Open `frontend/.env` and paste:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...
VITE_API_URL=http://localhost:8000/api
```

---

## Quick Reference Table

| What You Need | Where to Find It | Which .env File | Variable Name |
|---------------|------------------|-----------------|---------------|
| Project URL | API Settings → Top | Both | `SUPABASE_URL` / `VITE_SUPABASE_URL` |
| anon public key | API Settings → Project API keys | Both | `SUPABASE_ANON_KEY` / `VITE_SUPABASE_ANON_KEY` |
| service_role key | API Settings → Project API keys (click Reveal) | Backend only | `SUPABASE_SERVICE_ROLE_KEY` |
| JWT Secret | API Settings → JWT Settings (click Reveal) | Backend only | `SUPABASE_JWT_SECRET` |

---

## Visual Navigation Path

```
Supabase Dashboard
    ↓
Your Project (event-management-system)
    ↓
⚙️ Settings (left sidebar, bottom)
    ↓
API
    ↓
Copy all the keys!
```

---

## Troubleshooting

### "I don't see the Settings option"
- Make sure you're inside your project (not on the main dashboard)
- Look at the very bottom of the left sidebar
- The gear icon ⚙️ should be there

### "I can't find JWT Secret"
- It's in the same API page
- Scroll down past the API keys section
- Look for "JWT Settings" section

### "The keys are hidden with dots"
- Click the **[Reveal]** button next to each key
- Then click **[Copy]** to copy it

### "I accidentally copied the wrong key"
- No worries! Just go back and copy the correct one
- The keys are labeled clearly:
  - `anon public` = Safe for frontend
  - `service_role secret` = Backend only, keep secret!

---

## Security Reminders

✅ **DO:**
- Use `anon public` key in frontend
- Use `service_role` key only in backend
- Keep `.env` files in `.gitignore`
- Never commit keys to git

❌ **DON'T:**
- Share your `service_role` key publicly
- Use `service_role` key in frontend code
- Commit `.env` files to version control
- Share keys in screenshots or videos

---

## Test Your Setup

After adding the keys, test if they work:

### Test 1: Check Backend Configuration
```bash
curl http://localhost:8000/api/auth/supabase/status
```

Expected response:
```json
{
  "configured": true,
  "message": "Supabase is configured and ready"
}
```

### Test 2: Check Frontend (in browser console)
```javascript
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Has anon key:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
```

Should show your URL and `true` for the key check.

---

## Next Steps

Once you've copied all the keys:
1. ✅ Restart your Laravel server (if running)
2. ✅ Restart your React dev server (if running)
3. ✅ Test the backend status endpoint
4. ✅ Let me know, and I'll continue with frontend integration!

---

## Still Stuck?

If you're having trouble finding the keys:
1. Take a screenshot of your Supabase dashboard
2. Make sure you're logged into Supabase
3. Make sure you've created a project
4. Check that you're inside the project (not on the main dashboard)

The API settings page should look like this:
- Top: Project URL with copy button
- Middle: Two API keys (anon and service_role)
- Bottom: JWT Settings

All keys will have **[Copy]** buttons next to them!
