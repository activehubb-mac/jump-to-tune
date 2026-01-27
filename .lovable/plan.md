

# Plan: Fix Role Display Bug on User Profile Page

## The Problem
Your user profile page shows "Fan" instead of "Label" because you have **two roles** in the database: `label` AND `admin`. 

The `useUserProfile` hook uses `.single()` which fails when multiple rows exist, causing `roleData` to be `null` and defaulting to `"fan"`.

Meanwhile, the Navbar's `AuthContext` correctly shows "Label" because it explicitly excludes the admin role with `.neq("role", "admin")`.

## The Fix
Update the `useUserProfile` hook to match the pattern used in `AuthContext`:
- Use `.neq("role", "admin")` to exclude the admin role (admin is a privilege, not a primary role)
- Use `.maybeSingle()` instead of `.single()` for safer querying

## Technical Changes

### File: `src/hooks/useUserProfile.ts`

**Before (Lines 44-51):**
```typescript
// Get user role
const { data: roleData } = await supabase
  .from("user_roles")
  .select("role")
  .eq("user_id", userId)
  .single();

const role: UserRole = roleData?.role || "fan";
```

**After:**
```typescript
// Get user role (excluding admin - it's a separate privilege)
const { data: roleData } = await supabase
  .from("user_roles")
  .select("role")
  .eq("user_id", userId)
  .neq("role", "admin")
  .maybeSingle();

const role: UserRole = roleData?.role || "fan";
```

## Why This Happens
- Users can have multiple roles (e.g., `label` + `admin`)
- The `admin` role is meant as an additional privilege, not a primary identity
- `.single()` throws an error when it finds more than one row
- `.maybeSingle()` safely returns `null` if no rows or handles single rows properly
- Excluding `admin` ensures we get the user's primary identity role

## Result
After this fix, your profile page will correctly show "Label" instead of "Fan", matching what the navbar displays.

