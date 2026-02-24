# CRITICAL FIX: Bcrypt Password Verification

## Issue Found

The authentication was failing because:
- **Database passwords are bcrypt hashed**
- **Code was doing plain text comparison** (`user.password !== password`)
- This comparison will NEVER succeed with bcrypt hashes

## Fix Applied

### 1. Added bcryptjs Dependency

**File: `package.json`**
```json
"dependencies": {
  "bcryptjs": "^2.4.3",   // ← ADDED
  "dotenv": "^17.2.1",
  "express": "^4.19.2",
  // ...
}
```

### 2. Updated Authentication to Use Bcrypt

**File: `server/routes/auth.ts`**

Changed from:
```typescript
if (user.password !== password) {
  return res.status(401).json({ error: "Invalid credentials" });
}
```

To:
```typescript
import bcrypt from "bcryptjs";

// Compare password with bcrypt hash
const isPasswordValid = await bcrypt.compare(password, user.password);

if (!isPasswordValid) {
  console.log(`[Auth] Invalid password for: ${email}`);
  return res.status(401).json({ error: "Invalid credentials" });
}
```

## Files to Re-Transfer

You need to transfer these updated files to the VM:

1. **`package.json`** - Added bcryptjs dependency
2. **`server/routes/auth.ts`** - Fixed password verification

## Deployment Commands

```bash
# From Windows laptop - transfer files
scp package.json ticket_os_user@10.20.10.65:/application/ticketing_hub/
scp server/routes/auth.ts ticket_os_user@10.20.10.65:/application/ticketing_hub/server/routes/

# SSH to VM
ssh ticket_os_user@10.20.10.65
cd /application/ticketing_hub

# Rebuild (will install bcryptjs)
sudo docker-compose down
sudo docker-compose build --no-cache
sudo docker-compose up -d

# Monitor logs
sudo docker-compose logs -f ticketflow
```

## Expected Log Output (After Fix)

```
[Auth] Login attempt for: roshan.ramesh@bcits.in
[Auth] Session created for user 1 (roshan.ramesh@bcits.in)
[Auth] Session ID: xxxxx
[Auth] Session saved successfully for user 1
```

## Why This Happened

The original code was likely written for plain text passwords during development, but the database was set up with bcrypt hashed passwords. The mismatch caused all login attempts to fail.
