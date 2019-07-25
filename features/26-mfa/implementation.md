# Database Tables

## _auth_authenticator

|Column|Type|
|------|----|
|id|TEXT|
|type|TEXT; `totp`, `oob`, `recovery_code`, `bearer_token`|
|user_id|TEXT; foreign key to `_core_user.id`|

## _auth_authenticator_totp

|Column|Type|
|------|----|
|id|TEXT; foreign key to `_auth_authenticator.id`|
|secret|TEXT|
|activated|BOOLEAN|
|created_at|timestamp|
|activated_at|timestamp|
|display_name|TEXT|

- `activated` default to `false`.
- Only `activated = true` is considered an authenticator.

## _auth_authenticator_oob

|Column|Type|
|------|----|
|id|TEXT; foreign key to `_auth_authenticator.id`|
|channel|TEXT; `sms` or `email`|
|phone|TEXT|
|email|TEXT|
|activated|BOOLEAN|
|created_at|timestamp|
|activated_at|timestamp|

- `activated` default to `false`.
- Only `activated = true` is considered an authenticator.

## _auth_authenticator_oob_code

|Column|Type|
|------|----|
|id|TEXT|
|user_id|TEXT; foreign key to `_core_user.id`|
|code|TEXT|
|created_at|timestamp|
|expire_at|timestamp|

- A OOB code is generated when trigger is called.
- A OOB code is valid if it does not expire yet.
- If a valid OOB code is found, no new code is generated. The valid code is delivered again.

## _auth_authenticator_recovery_code

|Column|Type|
|------|----|
|id|TEXT; foreign key to `_auth_authenticator.id`|
|code|TEXT|
|created_at|timestamp|
|consumed|BOOLEAN|

- `consumed` default to `false`.
- When a code is used to authenticated, it is marked as `consumed = true`.
- A consumed code cannot be used anymore.
- Recovery codes are never regenerated automatically. The user must regenerate themselves.

## _auth_authenticator_bearer_token

|Column|Type|
|------|----|
|id|TEXT; foreign key to `_auth_authenticator.id`|
|parent_id|TEXT; foreign key to `_auth_authenticator.id`|
|token|TEXT|
|created_at|timestamp|
|expire_at|timestamp|

- `parent_id` is the ID of the parent authenticator. If the parent is deleted, all child bearer token are deleted.
