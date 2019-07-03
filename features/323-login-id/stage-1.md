# Implict login ID key, Login ID realm

## Database Schema

- In `_auth_provider_password` table:
    - A column `realm` (`TEXT NOT NULL`) would be added.
    - The existing unique index on `login_id` would be changed to include `realm`.

## Configuration

- Add field `allowedRealms` (list of strings, optional, default to `["default"]`).

## HTTP API
- `POST /login`:
    - Change type of `login_id` from map of strings to a plain string value.
    - Add parameter `login_id_key` (string, optional).
    - Add parameter `realm` (string, optional).
    - Example:
      ```json
        {
            "login_id_key": "username",
            "login_id": "test",
            "password": "12345678"
        }
        {
            "realm": "student",
            "login_id": "test@example.com",
            "password": "12345678"
        }
      ```
- `POST /signup`
    - Add parameter `realm` (string, optional).
    - Example:
      ```json
        {
            "realm": "teacher",
            "login_ids": {
                "email": "test@example.com"
            },
            "password": "12345678"
        }
        {
            "realm": "student",
            "login_id": {
                "email": "test@example.com"
            },
            "password": "12345678"
        }
      ```

- `POST /signup`, `POST /login`, etc.
    - Remove list of login IDs from response. Method to obtain this list would
      be specified in principal APIs later.

- `POST /verify_request`
    - Rename parameter `record_key` to `login_id_key`
    - Add parameter `login_id` (string, optional).
    - Example: 
      ```json
        {
            "login_id_key": "email",
            "login_id":"test@example.com"
        }
      ```


## Auth Logic
- Password Provider:
    - Require (login ID key, login ID, realm) to lookup single principal.
    - Allow using (login ID key, login ID) to lookup multiple principals.
- Signup:
    - If no realm is provided, default to `default`.
    - If realm is not in list of allowed realms, reject the request.
    - All provided login ID will be created with same realm.
    - If any provided login ID exists (regardless of realm), reject the request.
      (To add a new login ID in specific realm, use create login ID API (TBD))
- Login:
    - If no realm is provided, default to `default`.
    - If realm is not in list of allowed realms, reject the request.
- User Verification:
    - Login IDs to verified is matched by (login ID key, login ID).
    - Realm is ignored
    - i.e. User can verified multiple login IDs at the same time if they
      have same (login ID key, login ID), even if realms are different.
