# Overview

The following factors are supported:

- Time-Based One-Time Password [(TOTP)](https://tools.ietf.org/html/rfc6238)
- Out-of-band
  - SMS
  - Email
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
    # Enable listing the existing recovery code.
    # Some services like GitHub allow listing the existing recovery code.
    # By default listing is disabled, the user must regenerate a new set of
    # recovery code.
    list_enabled: false
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

interface GenerateOTPAuthURIOptions {
  secret: string;
  issuer: string;
  accountName: string;
}

async function createNewTOTP(displayName?: string): Promise<CreateNewTOTPResult>;
async function activateTOTP(authenticatorID: string, otp: string): Promise<ActivateTOTPResult>;
function generateOTPAuthURI(options: GenerateOTPAuthURIOptions): string;
function generateOTPAuthURIQRCodeImageURL(otpauthURI: string): string;

// Register OOB

type CreateNewOOBOptions = CreateNewOOBSMSOptions | CreateNewOOBEmailOptions;

interface CreateNewOOBSMSOptions {
  channel: "sms";
  phone: string;
}

interface CreateNewOOBEmailOptions {
  channel: "email";
  email: string;
}

interface CreateNewOOBResult {
  authenticatorID: string;
  authenticatorType: "oob";
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

interface AuthenticateResult {
  bearerToken?: string;
}

interface TOTPAuthenticateOptions {
  authenticatorID?: string;
  otp: string;
  requestBearerToken?: boolean;
}

async function authenticateWithTOTP(options: TOTPAuthenticateOptions): Promise<AuthenticateResult>;

interface OOBAuthenticateOptions {
  authenticatorID?: string;
  code: string;
  requestBearerToken?: boolean;
}

async function authenticateWithOOB(options: OOBAuthenticateOptions): Promise<AuthenticateResult>;

async function authenticateWithRecoveryCode(code: string): Promise<AuthenticateResult>;

async function authenticateWithBearerToken(token: string): Promise<void>;

// Authenticator management

type Authenticator = TOTPAuthenticator | OOBSMSAuthenticator | OOBEmailAuthenticator;

interface TOTPAuthenticator {
  id: string;
  type: "totp";
  activatedAt: Date;
  displayName: string;
}

interface OOBSMSAuthenticator {
  id: string;
  type: "oob";
  activatedAt: Date;
  channel: "sms";
  maskedPhone: string;
}

interface OOBEmailAuthenticator {
  id: string;
  type: "oob";
  activatedAt: Date;
  channel: "email";
  maskedEmail: "ab*****@example.com";
}

interface RegenerateRecoveryCodeResult {
  recoveryCodes: string[];
}

interface ListRecoveryCodeResult {
  recoveryCodes: string[];
}

async function getAuthenticators(): Promise<Authenticator[]>;
async function deleteAuthenticator(authenticatorID: string): Promise<void>;
async function regenerateRecoveryCode(): Promise<RegenerateRecoveryCodeResult>;
async function listRecoveryCode(): Promise<ListRecoveryCodeResult>;
async function revokeAllBearerTokens(): Promise<void>;
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
// Or preferably generate an otpauth URI.

const otpauthURI = skygear.auth.mfa.generateOTPAuthURI({
  secret,
  issuer: "My App",
  accountName: "user@example.com",
});

// If the developer can either generate the QR code by themselves or generate an QR code image URL.
const qrcodeImageURL = skygear.auth.mfa.generateOTPAuthURIQRCodeImageURL(otpauthURI);
image.src = qrcodeImageURL;

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

  const authenticators = await skygear.auth.mfa.getAuthenticators();
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
const authenticators = await skygear.auth.mfa.getAuthenticators();
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
//     maskedPhone: "+85223******",
//   },
// ]

const hasTOTP = authenticators.filter(a => a.type === "totp").length > 0;
const hasOOB = authenticators.filter(a => a.type === "oob").length > 0;
```

## Delete an authenticator

```typescript
const authenticators = await skygear.auth.mfa.getAuthenticators();
// Present an UI to show the list of authenticators and
// let the user to choose which one to delete.

// Suppose the user wants to delete the first one.
const { id } = authenticators[0];
await skygear.auth.mfa.deleteAuthenticator(id);
```

## Revoke all bearer tokens

```typescript
// The user can revoke all bearer tokens so that subsequent authentications
// require MFA.
await skygear.auth.mfa.revokeAllBearerTokens();
```

## List and regenerate recovery codes

```typescript
// If listing is enabled, the user can list the existing recovery code.
cpnst { recoveryCodes } = await skygear.auth.mfa.listRecoveryCode();

// Otherwise, the user must regenerate a new set of recovery code.
const { recoveryCodes } = await skygear.auth.mfa.regenerateRecoveryCode();
// Present an UI to show the list of recovery codes to the user.
```

# Access Token

The access token includes a new claim [amr](https://openid.net/specs/openid-connect-core-1_0.html).

## Mapping between existing authentication method and factor name

|Method|Factor Name|
|------|-----------|
|password|pwd|
|oauth|oauth|
|custom_token|custom_token|

If the method has defined value in [RFC8176](https://tools.ietf.org/html/rfc8176), the value is used.

When the user authenticates with one factor, the value is singleton array of the name of that factor.

When the user authenticates with MFA factor, `mfa` is included and the authenticator type is added.

In the case the authenticator is OOB, the channel is also added.

## Example

### Authenticate with password

```JSON
{
  "amr": ["pwd"]
}
```

### Authenticate with password and then TOTP

```JSON
{
  "amr": ["pwd", "mfa", "totp"]
}
```

### Authenticate with password and then OOB SMS

```JSON
{
  "amr": ["pwd", "mfa", "oob", "sms"]
}
```

### Authenticate with password and then OOB Email

```JSON
{
  "amr": ["pwd", "mfa", "oob", "email"]
}
```

### Authenticate with password and then bearer token

```JSON
{
  "amr": ["pwd", "mfa", "bearer_token"]
}
```

### Authenticate with password and then recovery code

```JSON
{
  "amr": ["pwd", "mfa", "recovery_code"]
}
```

### Authenticate with OAuth and then TOTP

```JSON
{
  "amr": ["oauth", "mfa", "totp"]
}
```

## Injection of amr into HTTP headers

The gateway injects the value of `amr` into HTTP header `x-skygear-auth-amr` as a comma separated value.

### Example

Given

```JSON
{
  "amr": ["pwd", "mfa", "oob", "sms"]
}
```

The injected header is

```
x-skygear-auth-amr: pwd,mfa,oob,sms
```

The usefulness of this injection is to allow microservice to determine whether or not the user was authenticated with MFA.
If the developer determines a given resource require MFA, they should reject the request and return an error to the client.
On client-side, the developer should detect this error and guide the user to either associate a new authenticator or
authenticate with existing authenticators.
Note that the error the developer generate generally cannot use `skygear.isMFARequiredError` because
it can only detect the error generated by the Auth gear.
