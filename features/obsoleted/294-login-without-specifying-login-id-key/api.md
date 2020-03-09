**This document is deprecated, refer to #323 instead**

For supporting login without specifying `loginID`, we have following proposal:

Adjust current `LOGIN_ID_METADATA_KEYS` definition, rename it to `LOGIN_IDS_KEY_WHITELIST`. It is an empty list by default, which allows using any string as the `loginID` key, and `loginID` value must be a string.

```
LOGIN_IDS_KEY_WHITELIST = []
==> allows any string as loginID key

LOGIN_IDS_KEY_WHITELIST = ["username", "email"]
==> allows "username" and "email" as loginID key
```

For example, for `LOGIN_IDS_KEY_WHITELIST = []`,

```
signupWithLoginIDs({
  username: 'example',
  email: 'example@example.com'
}, 'password');
```

which creates two `loginID`s:

| loginID key:String | loginID value:String (`UNIQUE`) |
| --- | --- |
| username | example |
| email | example@example.com |

User can login by `username` **OR** `email`, but not `username` **AND** `email` to login.

```
login('example', 'password'); ==> OK
login('example@example', 'password'); ==> OK
login({
  username: 'example',
  email: 'example@example.com'
}, 'password') ==> won't support this.
```

Since `loginID` value defined with `UNIQUE` constraint, which means another user **can't** signup if

```
signupWithLoginIDs({
  username: 'example@example.com',
  email: 'example'
}, 'password') ==> error: Duplicated loginID
```

It's developer's responsibility to ensure the encoded string uniqueness ('[\\"admin\\", \\"12345\\"]' and '[\\"phone\\", \\"12345\\"]' are considered as two different `loginID`).

If `LOGIN_IDS_KEY_WHITELIST` contains some string (not empty), a user can't signup with a `loginID` key which is not in the list.

```
LOGIN_IDS_KEY_WHITELIST = ["email", "username"]

signup({
  email: 'example@example.com',
  role: 'admin'
}, 'password') ==> error: Unknown loginID Key ("role")
```

The response user object is:

```
LoginID-Key: username,
Passcode-ID: null,
{
    user_id: <id>,
    login_ids: {
      role: 'admin',
      phone: '12345',
      username: 'example',
      email: 'example@example.com'
    },
    metadata: {
      age: 18
    }
}
```

About `Passcode-ID`, refer to [#293](https://github.com/SkygearIO/features/issues/293)

### Code change

1. [skygear-server] Update `loginIDMetadataKeys` definition setting.
2. [skygear-server] Change `_auth_provider_password.authData` to `text` type and add `_auth_provider_password.source` field.
3. [skygear-JS-SDK] Update SDK APIs

   | Old | New |
   | -------- | -------- |
   | `login(authData: dict, password: String)` | `login(loginIDValue: String, password: String)`<br/>`loginWithLoginID(key: String, value: String, password: String)`|
   | `signup(authData: dict, password: String, data: dict)` | `signup(loginIDKey: String, loginIDValue: String, password: String, data: dict)` |
   | N/A | `signupWithLoginIDs(loginIDs: dict, password: String, data: dict)` |
   | N/A | `createLoginID(loginIDKey: String, loginIDValue: String)`<br/>`updateLoginID(loginIDKey: String, loginIDValue: String)`<br/>`removeLoginID(loginIDKey)` |
   | N/A | `createPasscode(loginIDKey: String, password: String, skip2FA: Boolean)`<br/>`updatePasscode(loginIDKey: String, password: String, skip2FA: Boolean`<br/>`deletePasscode(loginIDKey: String)` |
4. [skygear-server] Update signup and login handler to handle the updated `loginID` concept.
5. [skygear-server] Include `LoginID-Key` in response header.

Note that `signupWithLoginIDs` and `signup` may have different implementations for different SDK, such as different functions or function overloading on Java.

## Compare to [meaningless loginID](appendix.md#proposal-2---meaningless-login-id)

### Compound Keys

This proposal allows string loginID value only, for compound keys loginID, it needs to use a workaround, one possible workaround is using JSON formatted string. Note that a developer should careful about JSON serialization result, the JSON string output may differ from platform to platform.

Full compound keys support will be supported later, please refer [#296](https://github.com/SkygearIO/features/issues/296) for more detail.

```javascript
// loginID value must be a string
signupWithLoginIDs({
  username: 'example',
  email: 'example@example.com',
  'role-phone': '[\"example\", \"12345\"]'
}, 'password'); 

// meaningless loginID
signup({
  username: 'example',
  email: 'example@example.com',
  'role-phone': {
    role: 'example',
    phone: '123456'
  }
}, 'password')
```

### User verification

Meaningless loginID need another API (`requestVerification(LoginIDKey: String, type: ["email", "phone"])`) to find `email` or `phone` to verify user.

### SSO auto-link

Meaningless loginID need other mechanisms to find `email` of a user to support to auto-link user.

## Appendix

There are two other proposals we discussed on the feature. 

- [find corresponding user object automatically](appendix.md#proposal-1---auth-gear-find-corresponding-user-object-automatically)
- [meaningless loginID](appendix.md#proposal-2---meaningless-login-id)