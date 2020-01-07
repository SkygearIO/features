# APIs

## User object
Updated to include verification state representation:
```diff
    "user": {
+       "is_verified": true,
+       "verify_info": {
+           "user@example.com": true
+       },
+       "is_manually_verified": false
        // ...
    }
```

## Request Verification

Function signature:
```typescript
function requestEmailVerification(email: string): Promise<void>;
function requestPhoneVerification(phone: string): Promise<void>;
```

These functions would initiate the user verification flow. The input parameter
(`email`/`phone`) must be a login ID associated with the current user. If the
function returns successfully, a verification message would be delivered to
the login ID.

## Perform Verification

Function signature:
```typescript
function verifyWithCode(code: string): Promise<void>
```

This function is used to complete the verification flow. The input parameter
(`code`) must be a valid verification code. If the function returns
successfully, the login ID associated with the code would be marked as verified,
and the verification state of the user would be updated accordingly.

## Update Verification State

Function signature:
```typescript
interface VerificationState {
    verify_info: Record<string, boolean>;
    is_manually_verified?: bool;
}
function updateVerificationState(userID: string, newState: VerificationState): Promise<void>;
```

This function must be called with Master Key. The input verification state will
replace the existing verification state of the target user (no merging is
performed). Entries in `verify_info` with `false` value would be treated as not
exist. If `is_manually_verified` is not provided, the existing state would
be used. Note that `is_verified` cannot be changed directly.
