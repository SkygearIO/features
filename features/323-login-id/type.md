# Login ID Type

## Background

Skygear Auth supports login with login id and password. This document defines the types of login id.

## Validation and Normalization

Validation and normalization are defined base on login id type. When user signup with login ids, Skygear Auth will validate the login ids and reject the signup if it won't pass. After passing the validation, Skygear Auth will store the normalized login id for login.

When user login with login id, login id key is optional. If login id key is provided, Skygear Auth will normalize the input by type, query the principal and perform the login. If login id key is not provided, Skygear Auth will walk through all login id keys, normalize the input and query the principal. If multiple principals are found, the login process will be stopped and error will be returned.

## Types

This section defines the login id types and its validation and normalization rules.

- [Email](#Email)
- [Username](#Username)
- [Phone](#Phone)
- [Raw](#Raw)

### Email

#### Validation

- [RFC 5322 address](https://tools.ietf.org/html/rfc5322#section-3.4.1) (Compulsory)

#### Normalization

- Case fold and encode the domain part to punycode (Compulsory)
- Case sensitive local part (Configurable, default OFF, case fold the value for case insensitive)
- Perform NFKC to the local part (Compulsory)
- Remove words after `+` sign in the local part (Configurable, default OFF)
- Remove all `.` sign in the local part (Configurable, default OFF)

#### Configuration
```yaml
user_config:
  auth:
    login_id_handling:
      email:
        case_sensitive: false
        ignore_local_part_after_plus_sign: false
        ignore_dot: false
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

#### Configuration
```yaml
user_config:
  auth:
    login_id_handling:
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

### Raw

No validation and normalization for raw login id.
