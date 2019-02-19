# Description

In skygear v1, auth related API in SDK often returns a `user<record>` as the result. e.g.

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

In this spec, it will describe the structure of user object in skygear next, and how the client SDK handles it.

# Glossary

- skygear next: next generation skygear.
- auth gear: skygear next component for user authentication and authorization.
- auth info: any data that may affect or affected by user authentication status or authorized status, such as disabled, last login at, roles, ..., etc.
- metadata: any user attributes that are not auth info specified, by default, it contains some pre-defined common user attributes, and a developer is allowed to add custom user attributes here .
- user object: an object combines auth info and metadata and represents as an user.

# Pre-defined common attributes

```
avatar_url text
name text
nickname text
birthday timestamp
preferred_lang text
```

- `preferred_lang` is a string in RFC 5646, ex: 'en', 'zh-TW', 'zh-CN', 'zh-HK'.

# User object response from backend

```
{
    user_id: <id>,
    created_at: <created_at>,
    updated_at: <updated_at>,
    last_seen_at: <last_seen_at>,
    verified: <verified>,
    verify_info: <verified_info>,
    roles: [<role>, <role>, <role>, ...],
    username: <username>,
    email: <email>,
    metadata: {
        avatar_url: <avatarUrl>,
        name: <name>,
        nickname: <nickname>,
        birthday: <birthday>,
        preferred_lang: <preferred_lang>,
        
        // any other custom attributes
        ...
    }
}
```

Note that, `username` and `email` key may vary because of `AUTH_RECORD_KEYS` configuration. By default, `AUTH_RECORD_KEYS` is set as `[["username"], ["email"]]`, so `username` and `email` may not in response payload at the same time.

# Changes on Client JS SDK

Because user object is not a `record` object anymore, client SDK has to treat user object as a plain object, and a user can access user attributes via regular way.

In JS SDK, `container`'s `UserRecord` is defined as

```
export const UserRecord = Record.extend('user');
```

`UserRecord` should be replaced as plain JavaScript class.

Note that auth gear and client SDK won't provide following functionalities:

1. user query
2. admin related API (disable user, change role, ...)

Such requirements can be implemented via cloud function or external user DB.

SDK will add an API to help update user metadata:

- `Promise<user> updateMetadata(<user>);`

And remove following admin APIs:

- `adminDisableUser`
- `adminEnableUser`
- `adminResetPassword`
- `assignUserRole`
- `revokeUserRole`
- `setDefaultRole`

# Changes on auth gear

For pre-defined user metadata, auth gear will add a table.

```sql=
CREATE TABLE _auth_user_metadata (
  user_id text REFERENCES _core_user(id),
  avatar_url text,
  name text,
  nickname text,
  birthday timestamp without time zone,
  preferred_lang text
  data jsonb, /* custom user attributes */
  PRIMARY KEY(user_id),
  UNIQUE (user_id)
);
```

auth gear also needs to update `AuthResponse`:

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

# More usage example

## signup

```javascript=
skygear.auth.signupWithUsername(username, password).then((user) => {
  console.log(user); // user is an user record
  console.log(user["username"]); // username of the user
}, (error) => {
  ;
});
```

## update user metadata

```javascript=
var user = skygear.auth.currentUser;
user["metadata"]["name"] = "johnny";
skygear.auth.updateMetadata(user).then((user) => {
  console.log('name is changed to: ', user["metadata"]["name"]);
  return user;
}, (error) => {
  console.error(error);
});
```

# access current user auth info and metadata

```javascript=
console.log(skygear.auth.currentUser['verified']);
console.log(skygear.auth.currentUser['disabled']);
console.log(skygear.auth.currentUser['roles']);
console.log(skygear.auth.currentUser["metadata"]["gender"]);
```
