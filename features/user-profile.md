# API Design Overview

This document introduces the new Skygear User Record (Profile), which is
re-designed from user record and user object, utilizing user profile discovery.
The design depends on [the field-based ACL](field-based-acl.md) feature.

## New User Record

The newly designed user record contains different information of user.By
setting field-based ACL, user record can serve as both public profile and
private profile.

The following table gives an example of the field-based ACL of user record
fulfilling: 1) both username and email are readable and discoverable; 2) status
and profile photo are readable, but not queryable; 3) game score is queryable;
and 4) birthday is private:

| Class | UserRole |    Field    | AccessLevel | DiscoveryLevel |
|-------|----------|-------------|-------------|----------------|
| *     | Public   | *           | ReadWrite   | Queryable      |
| User  | Public   | *           | NoAccess    | NotQueryable   |
| User  | Owner    | *           | ReadWrite   | Queryable      |
| User  | AnyUser  | username    | ReadOnly    | Discoverable   |
| User  | AnyUser  | email       | ReadOnly    | Discoverable   |
| User  | AnyUser  | status      | ReadOnly    | NotQueryable   |
| User  | AnyUser  | profile_pic | ReadOnly    | NotQueryable   |
| User  | AnyUser  | game_score  | ReadOnly    | Queryable      |
| User  | AnyUser  | birthday    | NoAccess    | NotQueryable   |

## Authentication Object

The new authentication object (i.e. `_auth` object) is to replace the old
 `_user` object, to avoid ambiguity with the user record.

The authentication object contains the following fields:

- `id (text)`: should be the same as `user._id` as a convention
- `password (text)`: the password for authentication
- `provider_info (jsonb)`: the authentication information from Authentication
  Provider
- `token_valid_since`: the timestamp limit the validity of the authentication
  token
- `last_login_at`: the timestamp when the user last login
- `last_seen_at`: the timestamp when user last perform an action

## New User Discovery API

After revamping the user record and authentication object, a new user discovery
API is proposed as a helper method query user records.

The API signature will be `container.discoverUser(discoverData)` while
`discoverData` is an object where each key-value pair will be transformed to
an equality query predicate. The following snippet shows how it is transformed:

```js
const skygear = require('skygear');

// the new User Discovery API
skygear.discoverUser({ gender: 'male' })
.then((users) => {
  console.log(`${users.length} users founded`);
});

// the above equals to:
const User = skygear.Record.extend('User');
const q = skygear.Query(User);
q.equalTo('gender', 'male');
skygear.publicDB.query(q)
.then((users) => {
  console.log(`${users.length} users founded`);
});
```

Also, the following user discovery methods are proposed as they are commonly
used:

- `container.discoverUserByUsername(username)`
- `container.discoverUserByUsernames(usernames)`
- `container.discoverUserByEmail(email)`
- `container.discoverUserByEmails(emails)`

## New Sign Up and Log In API

The new sign up API is proposed to enable: 1) sign up with custom data;
2) update user profile during sign up. The new sign up API will perform:

1. Discover user with the provided data
1. Sign up with the provided data and password, if no user is found
1. Update user record as profile

The function signature will be `container.signup(authData, password, profile)`
while `authData` is used to discover user. The following sign up API will be
kept as helper methods:

- `container.signupWithUsername(username, password)`
- `container.signupWithEmail(email, password)`
- `container.signupAnonymously()`

The similar signature is also proposed to log in API to enable log in with
custom data: `container.login(authData, password)`.  The new log in API will
perform:

1. Discover user with the provided data
1. Log in with the provided data and password, if only one user is found

The current log in API will be kept as helper methods:

- `container.loginWithUsername(username, password)`
- `container.loginWithEmail(email, password)`

# Sample Codes for Use Cases

<!--
  TODO: Give some sample code demonstrate how field-based ACL is set on
        user record
-->

<!--
  TODO: Give some sample code demonstrate how information in user record can
        be discovered.
-->

# Changes on SDK

The SDKs would be expected to have the following changes:

- All log in / sign up method would returns **a user record**, instead of
  a `_user` object.
- remove `getUserByEmails()`, `getUserByUsernames()`, `discoverUserByEmails()`
  and `discoverUserByUsernames()` in Skygear Container. These operations can be
  replaced by record query operation on user record
- remove `saveUser()` method. It can be replaced by record save operation on
  user record.

# Database Scheme

<!-- TODO: Provide migration SQL -->

1. Rename `_user` table to `_auth`
1. Move `username` and `email` from `_auth` to `user`
1. Insert correct field-based ACL on `user` record
