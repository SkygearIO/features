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
smtp:
    sender: 'admin@example.com'
    reply_to: 'support@example.com'

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
    secondary_authenticators: [totp, oob, bearer_token]

authenticator:
    password:
        policy:
            min_length: 8
    totp:
        maximum: 1
    oob:
        sms:
            maximum: 0
            subject: SMS one-time password
            subject#zh: SMS 一次性密碼
        email:
            maximum: 1
            subject: Email one-time password
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
- `primary_authenticators`: string list, must be non-empty.
                            List of primary authenticator types.
- `secondary_authenticators`: string list, can be empty.
                              List of secondary authenticator types.

Identity and authenticator types must be included in one of the lists to be
enabled. There must be no duplicated authenticators across primary and
secondary authenticator types.
