# Firestore Security Specification and Dirty Dozen Payloads

## 1. Data Invariants

1. **Identity Integrity**: No user under any circumstance may read or modify settings, problem logs, portfolios, or reminders of another user. All resources must be owned or under the direct path of the authenticated creator.
2. **Type and Size Constraints**: All text fields must be strictly typed as strings with bounded `.size()`. Specifically, titles, descriptions, and notes must not be arbitrarily large to prevent resource exhaustion attacks.
3. **Timestamp Integrity**: `createdAt` and `updatedAt` properties must be bound exactly to the server timestamp `request.time`.
4. **Id Integrity**: Document ID path variables must match alphanumeric layout and be short (<= 128 characters).

---

## 2. The "Dirty Dozen" Malicious Payloads (Unauthorized Attacks)

### Attack 01: Hostile Setting Modification (Identity Spoofing)
- **Target**: `/users/legit_user_abc`
- **Caller**: `attacker_xyz`
- **Request**: `write` / `update`
- **Intent**: Modifying settings of another user.
- **Result**: `PERMISSION_DENIED`

### Attack 02: Impersonate Author on Write (Identity Spoofing)
- **Target**: `/users/legit_user_abc/problemLogs/some_log_id`
- **Caller**: `attacker_xyz`
- **Request**: `create`
- **Payload**: `{ "id": "some_log_id", "userId": "legit_user_abc", "name": "Fake Problem", ... }`
- **Result**: `PERMISSION_DENIED`

### Attack 03: Inject Ghost Field on User Registration (Shadow Update)
- **Target**: `/users/attacker_xyz`
- **Caller**: `attacker_xyz`
- **Request**: `create`
- **Payload**: `{ "id": "attacker_xyz", "usernames": {}, "theme": "dark", "contestReminders": true, "refreshInterval": 15, "isAdmin": true }`
- **Result**: `PERMISSION_DENIED` (Due to exact size & keys match)

### Attack 04: Infinite String Notes Injection (Resource Poisoning / Denial of Wallet)
- **Target**: `/users/attacker_xyz/problemLogs/log_123`
- **Caller**: `attacker_xyz`
- **Request**: `create`
- **Payload**: `{ "id": "log_123", "userId": "attacker_xyz", "name": "Some Problem", "notes": "A".repeat(1000000) }` (Exceeding limit)
- **Result**: `PERMISSION_DENIED`

### Attack 05: Spoof Verified Token Flag (Email Spoofing)
- **Target**: `/users/attacker_xyz`
- **Caller**: `attacker_xyz` (with email verification flag `false` or blank on their account)
- **Request**: `create` / `write`
- **Result**: `PERMISSION_DENIED` (all standard writers must have verified tokens)

### Attack 06: Forge Platform Log Creation on Arbitrary Platform (Type Safety Bypass)
- **Target**: `/users/attacker_xyz/problemLogs/log_123`
- **Caller**: `attacker_xyz`
- **Request**: `create`
- **Payload**: `{ ..., "platform": "HostileTargetPlatformThatDoesNotExist" }`
- **Result**: `PERMISSION_DENIED`

### Attack 07: Temporal Time Spoofing (Immortality & Timestamp Forgery)
- **Target**: `/users/attacker_xyz/problemLogs/log_123`
- **Caller**: `attacker_xyz`
- **Request**: `create`
- **Payload**: `{ "createdAt": "2050-01-01T00:00:00Z" }` (instead of `request.time`)
- **Result**: `PERMISSION_DENIED`

### Attack 08: Blank Title Problem Log Submission (Boundary Limits Violation)
- **Target**: `/users/attacker_xyz/problemLogs/log_123`
- **Caller**: `attacker_xyz`
- **Request**: `create`
- **Payload**: `{ ..., "name": "" }`
- **Result**: `PERMISSION_DENIED`

### Attack 09: Mutating Immutable History Item (Immortal Field Modification)
- **Target**: `/users/attacker_xyz/problemLogs/log_123`
- **Caller**: `attacker_xyz`
- **Request**: `update`
- **Payload**: Mutating `createdAt` or `userId`
- **Result**: `PERMISSION_DENIED`

### Attack 10: Inject Giant Array of Project Highlight Elements (Total Array Guarding)
- **Target**: `/users/attacker_xyz/portfolio/main`
- **Caller**: `attacker_xyz`
- **Request**: `create`
- **Payload**: `{ ..., "projects": [ ...100 project maps... ] }`
- **Result**: `PERMISSION_DENIED`

### Attack 11: Attempt blanket reading of all users (PII Leak)
- **Target**: `/users` (listing all)
- **Caller**: `attacker_xyz`
- **Request**: `list`
- **Result**: `PERMISSION_DENIED`

### Attack 12: Scheduled Reminder Hijacking
- **Target**: `/users/legit_user_abc/reminders/rem_123`
- **Caller**: `attacker_xyz`
- **Request**: `create` / `read`
- **Result**: `PERMISSION_DENIED`
