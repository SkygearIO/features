# Implementation for verify by email and SMS

## Server

The server (core) will implement the following set of APIs to support
verify by email and verify by SMS

### `auth:verify:check`

#### Overview

#### Request

* `user_id` (string, optional)
  The user to verify. If the request is authenticated with access token
  only the current user is accepted. If request is authenticated with master key
  any user is accepted. Default to current user.
* `verify_record_key` (string, `email` or `phone`)
  The auth record key that requires verification.
* `code` (string)
  The verification code.

#### Response

If verification is a success, a `authResponse` is returned.

Example:

```
{
    "user_id": "E7BEE2DE-445B-42D7-B90A-84CB735A25D6",
    "profile": {
        "email": "johndoe@example.com"
    },
    "access_token": "eyJhbGciOiJIUzI1Ni.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6Ikp.TJVA95OrM7E2c",
    "last_login_at": "2017-07-23T19:30:24Z",
    "verified": true,
    "verified_data": {
        "email": true
    }
}
```

If code is invalid, `InvalidArgument` error is returned.

If the user is already verified for the `verify_record_key`, `Duplicated` error is
returned.

### `auth:verify:resend`

#### Overview

#### Request

* `user_id` (string, optional)
  The user to verify. If the request is authenticated with access token
  only the current user is accepted. If request is authenticated with master key
  any user is accepted. Default to current user.
* `verify_record_key` (string, `email` or `phone`)
  The auth record key field that requires verification.

#### Response

The API returns Status OK for successful resend.

If the user is already verified for the `verify_record_key`, `Duplicated` error is
returned.

### `auth:*` that returns an authResponse

For all API that returns an authResponse, the API has to be modified
to include the following fields:

* `verified` (boolean)
  If the user is verified with one of the keys, this returns true.

* `verified_record_keys` (array, string)
  Returns which piece of auth record key is verified.

APIs that include authResponse are (but not limited to):

* `auth:login`
* `auth:signup`
* `me`

#### Signup

When signing up, the user should have `verified=false`, even if verification
is not enabled.

#### Response

See `auth:verify:check` above.

### `VerificationRequired` preprocessor

If verification is required, this preprocessor will reject user request
if the user is not verified. A new error code with `VerificationRequired`
is returned if the user is not verified.

This preprocessor is to be added to all handlers that may require verification.
This preprocessor is also inserted to plugin handlers and lambdas that
supply `verify_required` in registration info.

### Database

The following columns to be added to `_auth`:

* `verified` (boolean)
* `verified_keys` (JSON)

### Configuration

* `VERIFY_ENABLED` (boolean)
  Whether verification is enabled. The verification API is only enabled if this is true.

* `VERIFY_RECORD_KEYS` (array, string)
  Which piece of auth record key is required for verification. Can be `email`,
  `phone` or both. The specified auth record key must also exist in the
  `AUTH_RECORD_KEYS`.

* `VERIFY_CODE_FORMAT`: (string)
  The verification code format. Can be `numeric` or `complex`.

* `VERIFY_KEY_EMAIL`, `VERIFY_KEY_PHONE`

  * `_ENABLED` (boolean)

  * `_PROVIDER` (string, the provider of the verification)
    For email, it can be `smtp`. For phone, it can be SMS gateways.

  * `_PROVIDER_*` provider specific configuration.

## SDK

### AuthContainer

The AuthContainer should add these properties which should be updated
upon receiving auth response from the server.

* `verified` (boolean) whether the user is verified
* `verifiedRecordKeys` (array, string) which piece of information is verified


### APIs

#### Phone

```
skygear.auth.signupWithPhone("+85221559299", "passw0rd")
skygear.auth.loginWithPhone("+85221559299", "passw0rd")
skygear.auth.verifyPhone('123456')
skygear.auth.resendVerifyPhone()
```

#### Email

```
skygear.auth.signupWithEmail("johndoe@example.com", "passw0rd")
skygear.auth.loginWithEmail("johndoe@example.com", "passw0rd")
skygear.auth.verifyEmail('123456')
skygear.auth.resendVerifyEmail()
```


## Plugin

Handler and Lambda will be allowed to register a handler or a lambda
that requires user to be verified.
