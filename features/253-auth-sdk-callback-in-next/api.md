# Description

In skygear v1, auth related API in SDK often returns a `user<Record>` as the result. e.g.

```javascript=
skygear.auth.signupWithUsername(username, password).then((user) => {
  console.log(user); // user is an user record
  console.log(user["username"]); // username of the user
}, (error) => {
  ...
});
```

and user can update its profile via `record` API, like:

```javascript=
var user = skygear.auth.currentUser;
user["username"] = "new-username";
skygear.publicDB.save(user).then((user) => {
  console.log(user); // updated user record
  console.log('Username is changed to: ', user["username"]);
  return skygear.auth.whoami();
}, (error) => {
  console.error(error);
});
```

In this spec, it will describe the structure of user object in skygear next, and how to update user object.

# Glossary

- skygear next: next generation skygear.
- auth gear: skygear next component for user authentication and authorization.
- LOGIN_IDS_KEY_WHITELIST: a list of string which defines what string can be used as loginID key.
- login_ids: a dictionary of a user's loginIDs.
- auth info: any data that may affect or affected by user authentication status or authorized status, such as disabled, last login at, roles, ..., etc.
- metadata: any user attributes that are not auth info related.
- user object: an object combines auth info, login_ids and metadata that represents an user.

# User object overview

```
{
    user_id: <id>,
    created_at: <created_at>,
    updated_at: <updated_at>,
    last_seen_at: <last_seen_at>,
    verified: <verified>,
    verify_info: <verified_info>,
    roles: [<role>, <role>, <role>, ...],
    login_ids: {
      username: <username>,
      email: <email>,
    },
    metadata: {
      // custom user attributes
      avatar_url: <avatarUrl>,
      name: <name>,
      nickname: <nickname>,
      birthday: <birthday>,
      preferred_lang: <preferred_lang>,
    }
}
```

# `LOGIN_IDS_KEY_WHITELIST`

`LOGIN_IDS_KEY_WHITELIST` is an empty list by default, which allows to use any string as loginID key. If it contains some strings, it restricts what strings can be used as loginID key. For example, `['username', 'email']` indicates that a user can be authenticated by username or email.

```
LOGIN_IDS_KEY_WHITELIST = []
==> allows any string as loginID key

LOGIN_IDS_KEY_WHITELIST = ["username", "email"]
==> allows "username" and "email" as loginID key
```

Refer [#294](https://github.com/SkygearIO/features/issues/294) for more detail.

# `login_ids`

`login_ids` is a dictionary which contains loginIDs. For example:

```javascript
login_ids: {
  "username": "example",
  "email": "example@example.com",
  "nickname_business_email": "[\"john.doe\", \"john.doe@example.com\"]"
}
```

# Modify loginID

We will have following APIs to allow user to manipulate loginIDs of a user.

- `async createLoginID(loginIDKey: String, loginIDValue: String): Promise<User>`
- `async updateLoginID(loginIDKey: String, loginIDValue: String): Promise<User>`
- `async removeLoginID(loginIDKey): Promise<User>`

# Support multiple password

- `async createPasscode(passcodeID: String, loginIDKey: String, password: String, skip2FA: Boolean): Promise<User>`
- `async updatePasscode(passcodeID: String, password: String, skip2FA: Boolean): Promise<User>`
- `async deletePasscode(passcodeID: String): Promise<User>`

# `Login-ID-Key`

An additional HTTP response header carries the information about which loginIDKey the user used when login.

# `Passcode-ID`

An additional HTTP response header carries the information about which passcodeID the user used when login.

For more detail about modify loginID, supporting multiple passwords and additional HTTP headers, please refer [#293](https://github.com/SkygearIO/features/issues/293) for more information.

# `updateMetadata` 

`updateMetadata` is a newly added API for user to update its metadata, metadata is saved properly when the user invokes `updateMetadata`. For admin, they can invoke `/auth/update_metadata` endpoint with master key to update any user's metadata.

## JS SDK

`async skygear.auth.updateMetadata(metadata: Object): Promise<User>`

## auth gear

```
curl -X POST -H "Content-Type: application/json" \
     -H "X-Skygear-Api-Key: <api_key|master_key>" \
     -d @- http://<skygear>/auth/update_metadata <<EOF
{
  user_id: <user_id: String>,
  metadata: <metadata: Object>
}
```

# Changes on Client JS SDK

Because user object is not a `record` object anymore, client SDK has to treat user object as a plain object, and a user can access user attributes via regular way.

In skygear v1 JS SDK, `container`'s `UserRecord` is defined as

```
export const UserRecord = Record.extend('user');
```

Since `Record` is removed, `UserRecord` in APIs should be replaced as `User` class (a simple plain JavaScript class), they are:

- `currentUser: User`
- `async changePassword(oldPassword: String, newPassword: String, invalidate: Boolean): Promise<User>`
- `async login(loginIDValue: String, password: String): Promise<User>`
- `async loginWithEmail(email: String, password: String): Promise<User>`
- `async loginWithUsername(username: String, password: String): Promise<User>`
- `async signup(loginIDKey: String, loginIDValue: String, password: String, data: Object): Promise<User>`
- `async signupAnonymously(): Promise<User>`
- `async signupWithEmail(email: String, password: String, data: Object): Promise<User>`
- `async signupWithUsername(username: String, password: String, data: Object): Promise<User>`
- `async whoami(): Promise<User>`

## New APIs

- `async updateMetadata(<metadata>): Promise<User>`
- `async loginWithLoginID(key: String, value: String, password: String): Promise<User>`
- `async signupWithLoginIDs(loginIDs: Object, password: String, data: Object): Promise<User>`
- `async createLoginID(loginIDKey: String, loginIDValue: String): Promise<User>`
- `async updateLoginID(loginIDKey: String, loginIDValue: String): Promise<User>`
- `async removeLoginID(loginIDKey): Promise<User>`
- `async createPasscode(loginIDKey: String, password: String, skip2FA: Boolean)`
- `async updatePasscode(loginIDKey: String, password: String, skip2FA: Boolean)`
- `async deletePasscode(loginIDKey: String)`

## Removal APIs

Due to the removal of record gear, auth gear and client SDK won't provide below functionalities:

1. user query
2. admin related API (disable user, change role, ...)

And so below APIs are removed from client SDK:

| API | RESTful API |
| ------------- |-------------|
| `adminDisableUser` | `/auth/disable/set` |
| `adminEnableUser` | `/auth/disable/set` |
| `adminResetPassword` | `/auth/reset_password` |
| `assignUserRole` | `/auth/role/assign` |
| `revokeUserRole` | `/auth/role/revoke` |
| `setDefaultRole` | `/auth/role/default` |
| `setAdminRole` | `/auth/role/admin` |

Those requirements can be implemented via cloud function or external user DB.

## API argument naming changes:

- `async requestVerification(recordKey: String): Promise`  
  `async requestVerification(loginIDKey: String): Promise`
- `async login(authData: Object, password: String): Promise<Record>`  
  `async login(loginIDValue: String, password: String): Promise<User>`
- `async signup(authData: Object, password: String, data: Object): Promise<Record>`  
  `async signup(loginIDKey: String, loginIDValue: String, password: String, data: Object): Promise<User>`

# Update `AuthResponse` of skygear-server

Old:

```go=
type AuthResponse struct {
	UserID      string                  `json:"user_id,omitempty"`
	Profile     userprofile.UserProfile `json:"profile"`
	Roles       []string                `json:"roles,omitempty"`
	AccessToken string                  `json:"access_token,omitempty"`
	LastLoginAt *time.Time              `json:"last_login_at,omitempty"`
	LastSeenAt  *time.Time              `json:"last_seen_at,omitempty"`
	Verified    bool                    `json:"verified"`
	VerifyInfo  map[string]bool         `json:"verify_info"`
}
```

New:

```go=
type AuthResponse struct {
	UserID      string                   `json:"user_id,omitempty"`
	LoginIDs    map[string]string        `json:"login_ids"`
	Metadata    userprofile.UserMetadata `json:"metadata"`
	Roles       []string                 `json:"roles,omitempty"`
	AccessToken string                   `json:"access_token,omitempty"`
	CreatedAt   *time.Time               `json:"created_at,omitempty"`
	UpdatedAt   *time.Time               `json:"updated_at,omitempty"`
	LastLoginAt *time.Time               `json:"last_login_at,omitempty"`
	LastSeenAt  *time.Time               `json:"last_seen_at,omitempty"`
	Verified    bool                     `json:"verified"`
	VerifyInfo  map[string]bool          `json:"verify_info"`
}
```

# New error response of auth gear

- skyerr.NewError(skyerr.Duplicated, "duplicated loginID")
- skyerr.NewError(skyerr.BadRequest, "unknown loginID Key (%v)")