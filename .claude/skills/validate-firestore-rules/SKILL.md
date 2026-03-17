---
name: validate-firestore-rules
description: Audit Firestore security rules against the data model and access patterns. Check for security gaps, missing rules, and role-based access correctness.
allowed-tools: Read, Grep, Glob, Agent
---

# Validate Firestore Security Rules

Audit `firestore.rules` against the actual data model and code usage patterns.

## Workflow

### Step 1: Read Current Rules and Types

Read in parallel:
- `firestore.rules`
- `packages/shared/src/types.ts` (all Firestore document types)
- `packages/web/lib/firestore.ts` (all Firestore operations)

### Step 2: Map Collections to Rules

For each Firestore collection in the types/code:

| Collection | Expected Access | Rule Exists? |
|------------|----------------|-------------|
| `users/{uid}` | Owner read/write, company read via reservation | ? |
| `companies/{id}` | Public read, owner write | ? |
| `flats/{id}` | Public read, company write | ? |
| `houses/{id}` | Public read, company write | ? |
| `buildings/{id}` | Public read, company write | ? |
| `reservations/{id}` | User/company read/write | ? |
| `conversations/{id}` | Participant read/write | ? |
| `contractors/{id}` | Public read, owner write | ? |
| `customizationRequests/{id}` | User/company read/write | ? |
| `applications/{id}` | Contractor/company read/write | ? |
| Subcollections... | Check each | ? |

### Step 3: Security Checks

For each rule, verify:

1. **Authentication**: All write operations require `request.auth != null`
2. **Authorization**: Write operations verify the user has the correct role
3. **Data validation**: Rules validate required fields and data types where possible
4. **No open writes**: No collection allows unauthenticated writes
5. **Company ownership**: Company resources check `companyId` matches the user's claim
6. **User scoping**: User resources check `userId` matches `request.auth.uid`
7. **Delete protection**: Verify `allow delete: if false` where appropriate
8. **Rate limiting**: Check if sensitive operations have any throttling

### Step 4: Cross-Reference with Code

Search `packages/web/lib/firestore.ts` for all Firestore operations:
- `setDoc`, `addDoc`, `updateDoc`, `deleteDoc` — each needs a corresponding write rule
- `getDoc`, `getDocs`, `onSnapshot` — each needs a corresponding read rule
- Check for operations on collections not covered by rules

### Step 5: Report

```
Firestore Security Audit

  Collections covered:  <count> / <total>
  Subcollections:       <count> / <total>

  Security Checks:
    Authentication:     PASS | <n> gaps
    Authorization:      PASS | <n> gaps
    Data validation:    PASS | <n> missing
    Delete protection:  PASS | <n> missing

  Uncovered Operations:
    - deleteDoc("buildings/{id}") called in code but no delete rule
    - addDoc("applications") but no write rule for contractors

  Recommendations:
    1. Add delete protection for reservations collection
    2. Add field validation for price > 0 on flats
    3. ...

Overall: SECURE | NEEDS_ATTENTION
```

## Important

- This is a READ-ONLY audit — don't modify firestore.rules without asking
- Flag critical security issues prominently
- Distinguish between "security risk" and "nice to have validation"
- Check `storage.rules` too if there are storage-related concerns
