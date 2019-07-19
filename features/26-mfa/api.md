# Overview

The following factors are supported:

- Time-Based One-Time Password [(TOTP)](https://tools.ietf.org/html/rfc6238)
- Out-of-band
  - SMS
- Recovery code
- Bearer token

In the future, the below factors will be supported:

- [WebAuthn with CTAP2 or FIDO U2F](https://fidoalliance.org/specifications/)

The developer can configure the enforcement of MFA.

The access token contains how the user was authenticated.

# Configuration

```yaml
mfa:
  # 'optional' or 'required'
  #
  # 'optional' means the user is free to register a new authenticator.
  # When a user has at least one active authenticator, the user must login with MFA.
  # This is like how other online services such as Google and Facebook offer MFA.
  #
  # 'required' means the user must login with MFA.
  # APIs like change password will return MFA required error.
  # This is like how banking services offer MFA.
  #
  # Default is 'optional'
  enforcement: 'optional'
  bearer_token:
    # How many days the bearer token is valid. Default is 30.
    expire_in_days: 30
  recovery_code:
    # How many recovery code should be generated. Default is 16.
    count: 16
```

# SDK API

The following functions are all in the namespace `skygear.auth.mfa`.

```typescript
// Register TOTP

interface CreateNewTOTPResult {
  authenticatorID: string;
  authenticatorType: "totp";
  secret: string;
}

interface ActivateTOTPResult {
  recoveryCodes?: string[];
}

async function createNewTOTP(displayName?: string): Promise<CreateNewTOTPResult>;
async function activateTOTP(authenticatorID: string, otp: string): Promise<ActivateTOTPResult>;

// Register OOB

interface CreateNewOOBOptions {
  channel?: "sms";
  phone: string;
}

interface CreateNewOOBResult {
  authenticatorID: string;
  authenticatorType: "oob";
  channel: "sms";
  phone: string;
}

interface ActivateOOBResult {
  recoveryCodes?: string[];
}

async function createNewOOB(options: CreateNewOOBOptions): Promise<CreateNewOOBResult>;
async function triggerOOB(authenticatorID?: string): Promise<void>;
async function activateOOB(authenticatorID: string, code: string): Promise<ActivateOOBResult>;

// Error inspection

function isMFARequiredError(err: unknown): boolean;

// Authenticate

interface AuthenticateExtraOptions {
  requestBearerToken?: boolean;
}

interface AuthenticateResult {
  bearerToken?: string;
}

interface TOTPAuthenticateOptions {
  authenticatorID?: string;
  otp: string;
}

async function authenticateWithTOTP(options: TOTPAuthenticateOptions, extraOptions?: AuthenticateExtraOptions): Promise<AuthenticateResult>;

interface OOBAuthenticateOptions {
  authenticatorID?: string;
  code: string;
}

async function authenticateWithOOB(options: OOBAuthenticateOptions, extraOptions?: AuthenticateExtraOptions): Promise<AuthenticateResult>;

async function authenticateWithRecoveryCode(code: string, extraOptions?: AuthenticateExtraOptions): Promise<AuthenticateResult>;

async function authenticateWithBearerToken(token: string): Promise<void>;

// Authenticator management

type Authenticator = TOTPAuthenticator | OOBAuthenticator | RecoveryCodeAuthenticator | BearerTokenAuthenticator;

interface TOTPAuthenticator {
  id: string;
  type: "totp";
  activatedAt: Date;
  displayName: string;
}

interface OOBAuthenticator {
  id: string;
  type: "oob";
  activatedAt: Date;
  channel: "sms";
  phone: string;
}

interface RecoveryCodeAuthenticator {
  id: string;
  type: "recovery_code";
  createdAt: Date;
}

interface BearerTokenAuthenticator {
  id: string;
  type: "bearer_token";
  createdAt: Date;
  expireAt: Date;
}

interface RegenerateRecoveryCodeResult {
  recoveryCodes: string[];
}

async function listAuthenticators(): Promise<Authenticator[]>;
async function deleteAuthenticator(authenticatorID: string): Promise<void>;
async function regenerateRecoveryCode(): Promise<RegenerateRecoveryCodeResult>;
```

# Use Cases

## Registration

```typescript
try {
  await skygear.auth.login("user@example.com", "password");
} catch (e) {
  if (skygear.isMFARequiredError(e)) {
    navigateToRegisterMFAScreen();
    return;
  }
  // Handle any other error.
}
```

```typescript
// Present an UI to let the user to choose authenticator.
// Suppose the user chose TOTP.

// Present AN UI to let the user to optionally name the TOTP authenticator.

const displayName = textInput.value;
const { authenticatorID, secret } = await skygear.auth.mfa.createNewTOTP(displayName);

// Present to the secret to the user and let the user
// to add the secret to their TOTP application, such as Authy and Google Authenticator.

// Present an UI to instruct the user to input the OTP.
const otp = textInput.value;
const { recoveryCodes } = await skygear.auth.mfa.activateTOTP(authenticatorID, otp);
```

```typescript
// Present an UI to let the user to choose authenticator.
// Suppose the user chose OOB.

// Present an UI to instruct the user to input a phone number.
const e164number = textInput.value;
const { authenticatorID } = await skygear.auth.mfa.createNewOOB({ phone: e164number });

// Present an UI to instruct the user to check SMS.

// Present an UI to offer the user to trigger again in case the delivery failed.
await triggerOOB(authenticatorID);

// Present an UI to instruct the user to input the recevied code.
const code = textInput.value;
const { recoveryCodes } = await skygear.auth.mfa.activateOOB(authenticatorID, code);
```

```typescript
// Check if recoveryCodes is present and present them to the user.
// Ask the user to remember them and keep them safe.
if (recoveryCodes) {
  navigateToDisplayRecoveryCodeScreen(recoveryCodes);
}
```

## Authentication

```typescript
try {
  await skygear.auth.login("user@example.com", "password");
} catch (e) {
  // Re-raise other error.
  if (!skygear.isMFARequiredError(e)) {
    throw e;
  }

  let done = false;

  const bearerToken = await getBearerToken();
  if (bearerToken) {
    try {
      await skygear.auth.mfa.authenticateWithBearerToken(bearerToken);
      done = true;
    } catch (ee) {
      if (!skygear.isMFARequiredError(ee)) {
        throw ee;
      }
    }
  }

  if (done) {
    return;
  }

  const authenticators = await skygear.auth.mfa.listAuthenticators();
  // Present the authenticators to the user and let them choose
  // which one they want to use.

  // Suppose they chose OOB
  await skygear.mfa.triggerOOB(authenticators[0].id);

  // Present an UI to instruct the user to check SMS.
  // Present an UI to offer the user to trigger resend.
  // Present an UI to instruct the user to input the received code.
  // Present an UI to offer the user to skip MFA for 30 days.

  const code = textInput.value;
  const { bearerToken } = await skygear.auth.mfa.authenticateWithOOB({ authenticatorID, code }, { requestBearerToken: true});

  // Persist the bearer token
  if (bearerToken) {
    await storeBearerToken(bearerToken);
  }
}
```

The above example demonstrates the flow of authenitcation in details.
The bearer token should be handled transparently by the SDK so the actual code written by the developer should not need to be aware of bearer token.

## List authenticators in settings screen

```typescript
const authenticators = await skygear.auth.mfa.listAuthenticators();
// [
//   {
//     id: "1",
//     type: "totp",
//     activatedAt: new Date("2019-07-19T00:00:00.000Z"),
//     displayName: "totp-2edfdca2-3f05-41d2-bfd8-502725ee09a6",
//   },
//   {
//     id: "2",
//     type: "oob",
//     activatedAt: new Date("2019-07-19T00:00:00.000Z"),
//     channel: "sms",
//     phone: "+85223456789",
//   },
//   {
//     id: "3",
//     type: "recovery_code",
//     createdAt: new Date("2019-07-19T00:00:00.000Z"),
//   },
//   {
//     id: "4",
//     type: "recovery_code",
//     createdAt: new Date("2019-07-19T00:00:00.000Z"),
//   },
//   {
//     id: "5",
//     type: "recovery_code",
//     createdAt: new Date("2019-07-19T00:00:00.000Z"),
//   },
//   {
//     id: "5",
//     type: "recovery_code",
//     createdAt: new Date("2019-07-19T00:00:00.000Z"),
//   },
//   {
//     id: "6",
//     type: "bearer_token",
//     createdAt: new Date("2019-07-19T00:00:00.000Z"),
//     expireAt: new Date("2019-08-19T00:00:00.000Z"),
//   }
// ]

const numberOfRecoveryCodes = authenticators.filter(a => a.type === "recovery_code").length;
const hasTOTP = authenticators.filter(a => a.type === "totp").length > 0;
const hasOOB = authenticators.filter(a => a.type === "oob").length > 0;
```

## Delete an authenticator

```typescript
const authenticators = await skygear.auth.mfa.listAuthenticators();
// Present an UI to show the list of authenticators and
// let the user to choose which one to delete.

// Suppose the user wants to delete the first one.
const { id } = authenticators[0];
await skygear.auth.mfa.deleteAuthenticator(id);

// The user can also delete a bearer token if they believe
// the device storing it has been compromised.
const bearerTokens = authenticators.filter(a => a.type === "bearer_token");
const { id } = bearerTokens[0];
await skygear.auth.mfa.deleteAuthenticator(id);
```

## Regenerate recovery codes

```typescript
const { recoveryCodes } = await skygear.auth.mfa.regenerateRecoveryCode();
// Present an UI to show the list of recovery codes to the user.
```

# Access Token

The access token includes a new claim [amr](https://openid.net/specs/openid-connect-core-1_0.html).

## Mapping between existing authentication method and factor name

|Method|Factor Name|
|------|-----------|
|password|password|
|oauth|oauth|
|custom_token|custom_token|

When the user authenticates with one factor, the value is singleton array of the name of that factor.

When the user authenticates with MFA factor, the authenticator type is added.

## Example

### Authenticate with password

```JSON
{
  "amr": ["password"]
}
```

### Authenticate with password and then TOTP

```JSON
{
  "amr": ["password", "totp"]
}
```

### Authenticate with password and then OOB

```JSON
{
  "amr": ["password", "oob"]
}
```

### Authenticate with password and then bearer token

```JSON
{
  "amr": ["password", "bearer_token"]
}
```

### Authenticate with password and then recovery code

```JSON
{
  "amr": ["password", "recovery_code"]
}
```

### Authenticate with OAuth and then TOTP

```JSON
{
  "amr": ["oauth", "totp"]
}
```

## Injection of amr into HTTP headers

The gateway injects the value of `amr` into HTTP header `x-skygear-auth-amr` as a comma separated value.

### Example

Given

```JSON
{
  "amr": ["password", "oob"]
}
```

The injected header is

```
x-skygear-auth-amr: password, oob
```

The usefulness of this injection is to allow microservice to determine whether MFA is required.
The developer is expected to detect as condition in client-side and guide the user to
associate a new authenticator. Such detection cannot use `skygear.isMFARequiredError` because
it can only detect the error generated by the Auth gear.
