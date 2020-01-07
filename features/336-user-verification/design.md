# User Verification

## Background

User can sign-up using arbitrary login IDs (e.g. email, phone). Developer may
want to know whether the login ID associated with the user is indeed controlled
by the user.

## Objectives

- Developers should be able to request verification of a supported login ID of
  user.
- Developers should be able to trust a verified login ID is controlled by
  the associated user.
- Developers should be able to know whether a specific login ID of user is
  verified.
- Developers should be able to manually mark a user as verified.
- Developers should be able to manually mark a login ID as verified/unverified.

## Design

### Verification State

**Verification State** are states associated with each user, indicating the
verification status of the user. Conceptually, it has this shape:
```typescript
interface VerificationState {
    verifiedLoginIDs: Set<string>;
    isManuallyVerified: bool;
    isVerified: bool;
}
```

- `verifiedLoginIDs` is the set of verified login IDs. If a verified login ID
  is no longer associated with the user, it is removed from this set.
- `isManuallyVerified` is a flag indicating whether the user is marked as
  verified user manually through admin API.
- `isVerified` is a flag indicating whether the user is a verified user. This
  flag is the result of the Verification Flag Algorithm described below.
  This flag can be overridden using `isManuallyVerified` flag.

Externally, the state is represented as following:
```typescript
user.verify_info = Object.fromEntries(state.verifiedLoginIDs.map(
    loginID => ({ [loginID]: true })
));
user.is_manually_verified = state.isManuallyVerified;
user.is_verified = state.isVerified || state.isManuallyVerified;
```

### Verified Login ID

**Verifiable Login ID Types** are login ID types that can be verified natively
by Auth Gear. Currently, these login ID types are `email` and `phone`.
- `email` login IDs would be verified by sending a Verification Code to the
  email address as a email message.
- `phone` login IDs would be verified by sending a Verification Code to the
  phone number as a SMS message.

**Verifiable Login ID Key** are login ID keys with a Verifiable Login ID Type,
AND is configured to be verifiable.

**Verifiable Login IDs** are login IDs with Verifiable Login ID Key.

## Verification Flow

The login ID verification flow can be initiated by:
- signing up using password identity provider with Verifiable Login IDs (if configured); or
- explicitly requested using API.

When the verification flow is initiated, a Verification Code would be generated,
and delivered as described above. The format of Verification Code and expiration
time can be configured by developers.

The delivered message can be configured using templates. The default template
includes a link to built-in verification page to verify the user directly.
Alternatively, developer can update the template to direct user to their app,
and verify the user using API with the Verification Code.

## Verification Flag Algorithm

The verified status of user (Verification Flag) is a boolean derived from the
set of verified login IDs of user, the set of all login IDs of user, and the
user verification configuration.

This flag is represented in Verification State as `isVerified` flag. This flag
should always represents the latest result of this algorithm.

The algorithm is described as followed:
```
Let L_v be the set of verified Login IDs of the user.
Let L_a be the set of all verifiable login IDs of the user.
Let C be the verification criteria as configured (ALL or ANY).

IF L_a is empty:
    // no verifiable login ID exists for the user
    RETURN false 

SWITCH C:
    CASE ALL:
        // all verifiable login ID is verified
        RETURN L_a = L_v 
    CASE ANY:
        // some verifiable login ID is verified
        RETURN (L_a intersects L_v) is not empty
```

## Considerations

### Verification Link in Email

It is reported that some email provider may follows the links in the email for
various purpose (e.g. anti-virus/phishing, prefetching). The built-in
verification page is triggered with GET method for simplicity, which may cause
unintentional verification. Developers are encouraged to use their own
verification page instead, and require explicit user interaction to verify.

## Appendix

- [API](./api.md)
- [Configuration](./config.md)
- [Recipes](./recipes.md)
