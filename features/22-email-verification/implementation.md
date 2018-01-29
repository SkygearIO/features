# Implementation for verify by email and SMS

## Server

The server (core) will implement the following set of APIs to support
verify by email and verify by SMS

### `auth:verify:check`

#### Overview

#### Request

* `verify_key` (string)
  The auth key, either `email` or `phone`.

* `user_id` (string, optional)
  The user to verify. If the request is authenticated with access token
  only the current user is accepted. If request is authenticated with master key
  any user is accepted. Default to current user. If the request is not
  authenticated, the user will be looked up from `verify_data`.

* `verify_data` (string, optional)
  The auth key value, should be email if `verify_key` is `email` or phone
  if `verify_key` is `phone`.
  If not specified, the current email or phone is used.

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
    "verified_record_keys": {
        "email": true
    }
}
```

If code is invalid, `InvalidArgument` error is returned.

### `auth:verify:send`

#### Overview

#### Request

* `verify_key` (string)
  The auth key, either `email` or `phone`.

* `user_id` (string, optional)
  The user to verify. If the request is authenticated with access token
  only the current user is accepted. If request is authenticated with master key
  any user is accepted. Default to current user. If the request is not
  authenticated, the user will be looked up from `verify_data`.

* `verify_data` (string, optional)
  The auth key value, should be email if `verify_key` is `email` or phone
  if `verify_key` is `phone`.
  If not specified, the current email or phone is used.

#### Response

The API returns Status OK when sent successfully.

### `auth:*` that returns an authResponse

For all API that returns an authResponse, the API has to be modified
to include the following fields:

* `verified` (boolean)
  If the user is verified with one of the keys, this returns true.

* `verified_record_keys` (object, string: any)
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

The following columns are to be added to `_auth`:

* `verified` (boolean)
  Indicates whether the user is verified

* `verified_keys` (JSON, string: any)
  Indicates which record key is marked as verified

New table `_auth_challenge` for storing verification code.

* auth_id (string)
  The ID of the user who requested the challenge.

* record_key (string)
  The record key of the information that requires verification.

* record_value (string)
  The value for the record key that requires verification.

* code (string)
  The verification challenge.

* consumed (boolean)
  Whether the challenge is challenge. A consumed challenge cannot be
  reused.

* created_at (datetime)
  The date/time when the challenge is created.

* expire_at (datetime, optional)
  The date/time when the challenge will expire.

### Configuration

* `VERIFY_KEYS` (array, string)
  Which piece of auth record key is enabled for verification. Can be `email`,
  `phone` or `email,phone`. The specified auth record key must also exist in the
  `AUTH_RECORD_KEYS`.

* `VERIFY_REQUIRED` (boolean)
  Whether verification is required. When this is true, verification email/SMS
  will be sent upon signup. The user must be verified before they can call
  other APIs.

* `VERIFY_CRITERIA` (string, optional, default `any`)
  Either `any` or `all`. If `any`, the user is verified if any auth keys
  are verified. If `all`, the user is verified if all auth keys are verified.

* `VERIFY_KEYS_EMAIL`, `VERIFY_KEYS_PHONE`

  * `_REQUIRED` (boolean)

  * `_CODE_FORMAT` (string), `numeric` or `complex`

  * `_PROVIDER` (string, the provider of the verification)
    For email, it can be `smtp`. For phone, it can be SMS gateways.

  * `_PROVIDER_*` provider specific configuration.

## SDK

### AuthContainer

The AuthContainer should add these properties which should be updated
upon receiving auth response from the server.

* `verified` (boolean) whether the user is verified
* `verifiedRecordKeys` (object, string: any) which piece of information is verified

### APIs

#### Phone

```
skygear.auth.signupWithPhone("+85221559299", "passw0rd")
skygear.auth.sendPhoneVerification('+85221559299')
skygear.auth.verifyPhone('+85221559299', '123456')
```

#### Email

```
skygear.auth.signupWithEmail("johndoe@example.com", "passw0rd")
skygear.auth.sendEmailVerification('johndoe@example.com')
skygear.auth.verifyEmail('johndoe@example.com', '123456')
```


## Plugin

Handler and Lambda will be allowed to register a handler or a lambda
that requires user to be verified.

```python
@skygear.handler(name, verify_required=True)
def do_something(request):
    pass
```



