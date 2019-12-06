# Login ID Type

## Background

Skygear Auth supports login with login id and password. This document defines the types of login id.

## Validation, normalization and unique key checking

Validation and normalization are defined base on login id type. When user signup with login ids, Skygear Auth will validate the login ids and reject the signup if it won't pass. After passing the validation, Skygear Auth will store the normalized login id for login.

When user login with login id, login id key is optional. If login id key is provided, Skygear Auth will normalize the input by type, query the principal and perform the login. If login id key is not provided, Skygear Auth will walk through all login id keys, normalize the input and query the principal. If multiple principals are found, the login process will be stopped and error will be returned.

For some login id types, different login id may represent same identify. E.g. Unicode email and punycode-encoded email. In order to ensure the uniqueness of login id, unique key will be generated per type.

Original login id will be stored in db as `original_login_id` for internal reference only.

## Types

This section defines the login id types and its validation and normalization rules.

- [Email](#Email)
- [Username](#Username)
- [Phone](#Phone)
- [Raw](#Raw)

### Email

#### Validation

- [RFC 5322 address](https://tools.ietf.org/html/rfc5322#section-3.4.1) (Compulsory)
- Disallow `+` sign in the local part (Configurable, default OFF)

#### Normalization

- Case fold domain part (Compulsory)
- Case sensitive local part (Configurable, default OFF, case fold the value for case insensitive)
- Perform NFKC to the local part (Compulsory)
- Remove all `.` sign in the local part (Configurable, default OFF)

### Unique key generation

- Encode domain part of normalized email to punycode (IDNA 2008)

#### Configuration
```yaml
user_config:
  auth:
    login_id_types:
      email:
        case_sensitive: false
        block_plus_sign: false
        ignore_dot_sign: false
    login_id_keys:
      - type: email
        key: email
```

### Username

#### Validation

- Disallow username with reserved keywords listed below (Configurable, default ON)
  - https://github.com/marteinn/The-Big-Username-Blacklist/blob/master/list_raw.txt
  - https://github.com/ubernostrum/django-registration/blob/31478a8acbf705a654565105c791f1ec4cdbf581/src/django_registration/validators.py#L127
- Disallow username with user defined list (Configurable, default empty list)
- Disallow non-ASCII username (Configurable, default OFF)
- Disallow username with confusing homoglyphs (Compulsory)

#### Normalization

- Case sensitive (Configurable, default OFF, case fold the value for case insensitive)
- Perform NFKC (Compulsory)

### Unique key generation

Same as the login id

#### Configuration
```yaml
user_config:
  auth:
    login_id_types:
      username:
        block_reserved_keywords: true
        excluded_keywords:
          - skygear
          - skygeario
        ascii_only: false
        case_sensitive: false
    login_id_keys:
      - type: username
        key: username
```

### Phone

#### Validation

- Ensure phone number in E.164 format (Compulsory)

#### Normalization

Only E.164 format phone is accepted, no normalization for phone login id.

### Unique key generation

Same as the login id

### Raw

No validation and normalization for raw login id, unique key will be the same as the login id.
