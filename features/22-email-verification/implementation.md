# Implementation for user data verification

## Server

### `user:verify_user`

This API marks the specified user as verified.

#### Request

* `user_id` (string)
  The User ID of the user to be marked as verified.

#### Response

The API returns Status OK when sent successfully.

### `user:unverify_user`

This API marks the specified user as unverified.

#### Request

* `user_id` (string)
  The User ID of the user to be marked as unverified.

#### Response

The API returns Status OK when sent successfully.

### `auth:*` that returns an authResponse

Since the verified flag is included in the user record, no special handling is
required. The profile will include the `is_verified` (boolean) field.

Example:

```
{
    "user_id": "E7BEE2DE-445B-42D7-B90A-84CB735A25D6",
    "profile": {
        "email": "johndoe@example.com",
        "is_verified": true
    },
    "access_token": "eyJhbGciOiJIUzI1Ni.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6Ikp.TJVA95OrM7E2c",
    "last_login_at": "2017-07-23T19:30:24Z",
    "verified": true
}
```

The field is only added when the relevant configuration enables auto update
schema behavior.

APIs that include authResponse are (but not limited to):

* `auth:login`
* `auth:signup`
* `me`
* `sso:oauth:login`
* `sso:oauth:signup`
* `sso:custom_token:login`

### Update preprocessors

If verification is required, request preprocessors should deny access
if the requested action requires a user. If a user is required, a new error
code with `VerificationRequired` is returned if the user is not verified. If
a user is not required, an unverified user will cause the request to be treated
as unauthenticated ones.

### Database

New table `_auth_verify` for storing verification code.

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


## Plugin (Python)

### `user:verify_code`

#### Overview

#### Request

The request should be authenticated with an access token.

* `code` (string)
  The verification code.

#### Response

The API returns Status OK when sent successfully.

If code is invalid, `InvalidArgument` error is returned.

### `user:verify_request`

#### Overview

#### Request

* `record_key` (string)
  The record key to verify.

The request should be authenticated with an access token or a master key.
If an access token is provided, the current user is the user contained
in the access token. If authenticated with master key, the current user
is the user specified by `_as_user_id`.

#### Response

The API returns Status OK when sent successfully.

### Verification Provider

Verification Provider provides an interface for requesting verification. The
verification provider is responsible
for generating and sending the verification code/link.

The code/link is inserted to the database by a component outside of the
provider, this component is responsible for checking if the code/link is
valid.

Provider should take these parameters:

* user record
* auth info
* record key to verify
* record value to verify

Provider should return these parameters:

* verification code

### Configuration

* `VERIFY_KEYS` (array, string)
  Which record key is enabled for verification. Can be any record keys on the
  `user` record.

* `VERIFY_AUTO_UPDATE` (boolean)
  Whether the user verified flag is automatically updated.

* `VERIFY_AUTO_SEND_SIGNUP` (boolean)
  Whether verification link/code is sent on signup.

* `VERIFY_AUTO_SEND_UPDATE` (boolean)
  Whether verification link/code is sent on record update.

* `VERIFY_REQUIRED` (boolean)
  Whether verification is required. When this is true, verification email/SMS
  will be sent upon signup. The user must be verified before they can call
  other APIs.

* `VERIFY_CRITERIA` (string, optional, default `any`)
  Either `any` or `all`. If `any`, the user is verified if any auth keys
  are verified. If `all`, the user is verified if all auth keys are verified.

* `VERIFY_MODIFY_SCHEMA` (boolean)
  When true, the schema is automatically updated when plugin starts. Set
  this to false to prevent the plugin from automatically updating schema.

* `VERIFY_MODIFY_ACL` (boolean)
  When true, the field ACL is automatically updated when plugin starts. Set
  this to false to prevent the plugin from automatically updating field ACL.

* `VERIFY_ERROR_REDIRECT` (string) URL to redirect to when failure, override `VERIFY_ERROR_HTML_URL`

* `VERIFY_ERROR_HTML_URL` (string) URL of HTML content template to return when failure

* `VERIFY_KEYS_<key_name>`

  * `_CODE_FORMAT` (string), `numeric` or `complex`

  * `_EXPIRY` (integer, seconds), number of seconds before created code is
    expired.

  * `_SUCCESS_REDIRECT` (string) URL to redirect to when success, override `_SUCCESS_HTML_URL`
  * `_ERROR_REDIRECT` (string) URL to redirect to when failure, override `_ERROR_HTML_URL`
  * `_SUCCESS_HTML_URL` (string) URL HTML content template to return when success

  * `_ERROR_HTML_URL` (string) URL of HTML content template to return when failure

  * `_PROVIDER` (string, the provider of the verification)
    For email, it can be `smtp`, `twilio` and `nexmo`.

  * `_PROVIDER_*` provider specific configuration.

Here are provider specific configuration:

For provider `smtp`:

* `VERIFY_KEYS_<key>_PROVIDER_SMTP_HOST` default to `SMTP_HOST`
* `VERIFY_KEYS_<key>_PROVIDER_SMTP_PORT` default to `SMTP_PORT`
* `VERIFY_KEYS_<key>_PROVIDER_SMTP_MODE` default to `SMTP_MODE`
* `VERIFY_KEYS_<key>_PROVIDER_SMTP_LOGIN` default to `SMTP_LOGIN`
* `VERIFY_KEYS_<key>_PROVIDER_SMTP_PASSWORD` default to `SMTP_PASSWORD`
* `VERIFY_KEYS_<key>_PROVIDER_SMTP_SENDER` default to `SMTP_SENDER`
* `VERIFY_KEYS_<key>_PROVIDER_SMTP_REPLY_TO` default to `SMTP_REPLY_TO`
* `VERIFY_KEYS_<key>_PROVIDER_SUBJECT` email subject line
* `VERIFY_KEYS_<key>_PROVIDER_EMAIL_TEXT_URL` email content template in plaintext
* `VERIFY_KEYS_<key>_PROVIDER_EMAIL_HTML_URL` email content template in HTML

For provider `twilio`:

* `VERIFY_KEYS_<key>_PROVIDER_TWILIO_ACCOUNT_SID` default to `TWILIO_ACCOUNT_SID`
* `VERIFY_KEYS_<key>_PROVIDER_TWILIO_AUTH_TOKEN` default to `TWILIO_AUTH_TOKEN`
* `VERIFY_KEYS_<key>_PROVIDER_TWILIO_FROM` default to `TWILIO_FROM`
* `VERIFY_KEYS_<key>_PROVIDER_SMS_TEXT_URL` message content template

For provider `nexmo`:

* `VERIFY_KEYS_<key>_PROVIDER_NEXMO_API_KEY` default to `NEXMO_API_KEY`
* `VERIFY_KEYS_<key>_PROVIDER_NEXMO_API_SECRET` default to `NEXMO_API_SECRET`
* `VERIFY_KEYS_<key>_PROVIDER_NEXMO_FROM` default to `NEXMO_FROM`
* `VERIFY_KEYS_<key>_PROVIDER_SMS_TEXT_URL` message content template

## SDK

### Get verified statuses

The verified statueses can be obtained from user record. For the current
user, the verified statuses can be obtained from `skygear.auth.currentUser`.

### APIs

```
skygear.auth.requestVerification(recordField: string)
skygear.auth.verifyUserWithCode(code: string)
```

