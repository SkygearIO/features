# Multiple login IDs per key, Configurable login ID keys, Standard semantics keys

## Database Schema

- Update `_core_user.verify_info` column:
    - It is a string map keyed by login ID key,
      with verified boolean flag as value.
    - This format is incompatible with multiple login ID per login ID key.
    - Migrate to keyed for login ID instead.
    - All user would be treated as NOT verified after migration, and would need
      to be verified again.

## Configuration
- Add field `loginIDKeys` (type `LoginIDConfigMap`, optional).
    - Default value:
      ```json
      {
          "username": { "type": "raw" },
          "email": { "type": "email" },
          "phone": { "type": "phone" }
      }
      ```

- Let type `LoginIDConfigMap` be a string-keyed map,
  where keys are allowed login ID keys, with value of type `LoginIDConfig`.

- Let type `LoginIDConfig` be a string-keyed map, with entries:
    - `type`: string, required;
              The corresponding standard key, or `raw`.
    - `minimum`: integer, optional, default to 0;
                 The inclusive minimum amount of login IDs.
                 This limit will be enforced on sign up / deleting login IDs.
    - `maximum`: integer, optional, default to 1;
                 The inclusive maximum amount of login IDs.
                 This limit will be enforced on sign up / creating login IDs.

Example:
```json
{
    "loginIDKeys": {
        "phone": true,
        "login_email": {
            "type": "email",
            "minimum": 1,
            "maximum": 5
        },
        "fingerprint": {
            "maximum": 3
        }
    }
}
```

## HTTP API
- `POST /signup`
    - Change type of `login_ids` parameter to list of login IDs.
    - Example:
      ```json
        {
            "login_ids": [
                { "key": "username", "value": "test" }
            ],
            "password": "12345678"
        }
        {
            "login_ids": [
                { "key": "email", "value": "test+1@example.com" },
                { "key": "email", "value": "test+2@example.com" }
            ],
            "password": "12345678"
        }
      ```

## Auth logic

- Password Provider:
    - Require all password authenticated principals of same user
      share same password.

- Signup:
    - If login ID key is not in the list of allowed keys, reject the request.
    - If the number of login IDs does not match the configuration,
      reject the request.
    - Create a new principal for each login ID.

- User Verification:
    - Only allow verification on login ID keys that:
        - is configured to be verifiable login ID key
        - is configured as a supported standard key (`email`, `phone`)
    - Save verified login ID in as key of `_core_user.verify_info` column.

- Forgot Password:
    - Only allow password recovery email/SMS to be sent to login IDs that:
        - is configured as a supported standard key (`email`, `phone`)


## Appendix

### Standard Keys
- `email`
- `phone`
