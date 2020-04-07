# Configuration

Configurations are refactored to better match the current identity model:

## Change Summary
- Email sender & reply-to become a global option, applying to all email
  messages. Each features have individual config to override global default
  settings.
- Email subjects can be localized like OIDC client metadata.
- Identity conflict policy is grouped together as a configuration group.
- MFA config are generalized to authenticator configs.
- Identity type configs are grouped together.

# Sample Configuration
```yaml
messages:
    email:
        sender: 'admin@example.com'
        reply_to: 'support@example.com'
    sms_provider: nexmo
    sms:
        sender: '+85212345678'

auth_api:
    enabled: true
    on_identity_conflict:
        login_id:
            allow_create_new_user: false
        oauth:
            allow_create_new_user: true
            allow_auto_merge_user: false

authentication:
    identities: [login_id, oauth, anonymous]
    primary_authenticators: [password, oauth]
    secondary_authenticators: [otp, bearer_token]
    secondary_authentication_mode: if_requested
    secret: authn_secret

authenticator:
    password:
        policy:
            min_length: 8
            # ...
    totp:
        maximum: 1
    oob:
        sms:
            maximum: 0
            message:
                sender: '+85288888888'
        email:
            maximum: 1
            message:
                subject: Email one-time password
                subject#zh: Email 一次性密碼
                sender: 'no-reply@example.com'
                reply_to: 'no-reply@example.com'
    bearer_token: {} # ...
    recovery_code: {} # ...

identity:
    login_id:
        types: {} # ...
        keys: {} # ...
    oauth:
        providers: {} # ...
```

# Authentication configuration
The authentication configuration is in `authentication` key. It describes
the authentication flow in Auth UI.

- `identities`: string list, must be non-empty.
                List of usable identity types.
                Default to `[oauth, login_id]`.
- `primary_authenticators`: string list, must be non-empty.
                            List of primary authenticator types.
                            Order in list represents priority in UI.
                            Default to `[oauth, password]`.
- `secondary_authenticators`: string list, can be empty.
                              List of secondary authenticator types.
                              Default to `[otp, bearer_token]`.
- `secondary_authentication_mode`:
    enum of `required`, `if_requested`, or `if_exists`.
    Determine behavior of secondary authentication during authentication
    process.
    Default to `if_exists`.


Identity and authenticator types must be included in one of the lists to be
enabled. There must be no duplicated authenticators across primary and
secondary authenticator types.

# Message configuration
Message sent (e.g. SMS, email) can be configured with global default and local
override.

Global default configuration is in `messages` key:
- `email`: Email message configuration.
- `sms_provider`: SMS provider. Can be `nexmo` or `twilio`.
- `sms`: SMS message configuration.

Each feature that sends messages has local override configuration to override
global email/SMS message configuration.

Email messages can be configured:
- `sender`: Sender email address.
- `subject`: Email message subject.
- `reply_to`: Reply-to email address.

SMS messages can be configured:
- `sender`: Sender phone number.

Email/SMS message configurations can be localized by adding a key in format of
`<key to localized>#<BCP 47 language tag>`. If the required localization does
not exists, the main key would be used. For example:
```yaml
email:
    subject: Email Verification
    subject#zh-HK: 驗證電郵地址
```
- If locale is `zh-HK`: `驗證電郵地址` would be the subject.
- Otherwise: `Email Verification` would be the subject.
