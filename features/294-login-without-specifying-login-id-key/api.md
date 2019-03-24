For supporting login without specifying `loginID`, we have two proposals:

## Proposal 1 - auth gear find corresponding user object automatically

We can keep most of the current implementation; auth gear finds possible user objects automatically. Following is the use case:

```javascript
skygear.auth.signup({
  email: 'example@example.com', 
  username: 'example'
}, 'password');

// find corresponding user by 'example@example.com'
skygear.auth.login('example@example.com', 'password')
.then((user) => {
  console.log('login successfully');
});
```


### Problem

`loginID` could be ambiguous, consider the following scenario:

```javascript

// signup user A
skygear.auth.signup({email: 'example@example.com'}, 'password');


// signup user B
// B's username is A's email
skygear.auth.signup({username: 'example@example.com'}, 'password');

skygear.auth.login('example@example.com', 'password');
// doesn't know which user to match
// user A: {email: 'example@example.com'}
// or
// user B: {username: 'example@example.com'}
```

### Code change

Should be simple. Just brute-force find all possible principals. 

When auth gear is got a login request without specifying `loginIDMetadataKey,` auth gear will try to find all possible principals based on current `loginIDMetadataKeys` setting. 

For example, if a user login with string `"example"`, and `loginIDMetadataKeys=[["username"], ["email"], ["phone"]]`, auth principal store finds all principals which `authdata` field equals to `{username: "example"}`, `{email: "example"}` and `{phone: "example"}`.

And then login handler will check input password with principal stored password, if there is **only one** principal matched, then the user login successfully. If there are more than one principals paired, auth gear will return `AmbiguousLoginID` error to the client. 

Should also avoid ambiguous signup. Assume `loginIDMetadataKeys=[["username"], ["email"], ["phone"]]`, when `{username: 'example'}` is signing up, `{email: 'exmaple'}`, `{phone: 'example'}` should be rejected with error `AmbiguousLoginID`.


## Proposal 2 - meaningless login ID

Allow a user to signup with multiple `loginID`s, each `loginID` can be a string or an object. And to identify each `loginID`, a developer should give it a name (`loginIDSource`). 

`<loginIDSource>: <loginID>`

Then user can login with the `loginID`.

`login(loginID: String||dict, password: string)`

In response HTTP headers, it includes a header which includes current user `loginIDSource`.

```
LoginID-Source: <loginIDSource>
Passcode-ID: <passcodeID>
```

About `Passcode-ID`, refer to [#293](https://github.com/SkygearIO/features/issues/293)

### Sample use case: signup with email

```javascript
// add `loginIDSource=email` implicitly
skygear.auth.signupWithEmail(
  'example@example.com', 'password'
);
skygear.auth.login(
  'example@example.com', 'password'
).then((user) => {
  console.log(user);
  /*
  LoginID-Source: email,
  {
      user_id: <id>,
      login_ids: {
        email: 'example@example.com',
      },
      metadata: {}
  }
  */
});
```

### Sample use case: signup with username

```javascript
// add `loginIDSource=username` implicitly
skygear.auth.signupWithUsername(
  'example', 'password'
);
skygear.auth.login(
  'example', 'password'
).then((user) => {
  console.log(user);
  /*
  LoginID-Source: username,
  {
      user_id: <id>,
      login_ids: { 
        username: 'example',
      },
      metadata: {}
  }
  */
});
```

### Sample use case: signup with custom loginID

```javascript
skygear.auth.signup({
  "role-phone": {
    role: 'example',
    phone: '8912345',
  },
  username: 'exmaple',
  email: 'example@example.com'
}, 'password', {age: 18});
// creates 3 loginIDs
// 1. username: 'example',
// 2. email: 'example@example.com'
// 3. role-phone: { role: 'example , phone: '8912345' }
skygear.auth.login(
  {
    role: 'example',
    phone: '8912345',
  }
).then((user) => {
  console.log(user);
  /*
  LoginID-Source: role-phone,
  {
      user_id: <id>,
      login_ids: {
        "role-phone": {
          role: 'example',
          phone: '8912345',
        },
        username: 'example',
        email: 'example@example.com'
      },
      metadata: {
        age: 18
      }
  }
  */
});
// or
skygear.auth.login(
  'example'
).then((user) => {
  console.log(user);
  /*
  LoginID-Source: username,
  {
      user_id: <id>,
        login_ids: {
        "role-phone": {
          role: 'example',
          phone: '8912345',
        },
        username: 'example',
        email: 'example@example.com'
      },
      metadata: {
        age: 18
      }
  }
  */
});
```

### Code change

1. [skygear-server] Remove `loginIDMetadataKeys` setting.
2. [skygear-server] Change `_auth_provider_password.authData` to `text` type and add `_auth_provider_password.source` field.
3. [skygear-JS-SDK] Update SDK APIs

   | Old | New |
   | -------- | -------- |
   | `login(authData: dict, password: String)` | `login(loginID: String/dict, password: String)` |
   | ` signup(authData: dict, password: String, data: dict)` | ` signup(loginIDs: dict, password: String, data: dict)` |
   | `requestVerification(recordKey: String)` | `requestVerification(LoginIDSource: String, type: "email, phone")` |
   | N/A | `createLoginID(loginIDSource: String, loginID: String/dict)`<br/>`updateLoginID(loginIDSource: String, loginID: String/dict)`<br/>`removeLoginID(loginIDSource: String)` |
   | N/A | `createPasscode(loginIDSource: String, password: String, skip2FA: Boolean)`<br/>`updatePasscode(loginIDSource: String, password: String, skip2FA: Boolean`<br/>`deletePasscode(loginIDSource: String)` |
4. [skygear-server] Update signup and login handler to handle the `loginID` concept.
5. [skygear-server] Include `LoginID-Source` in response header.
6. [skygear-server] Implement `requestVerification(LoginIDSource: String, type: "email"|"phone")`

### SSO auto-link

For SSO auto-link user feature, have following possible solutions:

1. assume `loginID` is email.
2. provide an extra auth-hook, which request to return `userID` by email.
3. Check if there is email information in the metadata:
   1. if there is a `sso_matching_emails`, all emails in the array of value will be matched against the SSO login.
   2. if ther is a `email`, that email will be matched against the SSO login.

Solution 3 may have uniqueness issue, i.e. two user could have identical email or overlapping email in `sso_matching_emails`.

## Proposal 3

Adjust current `LOGIN_ID_METADATA_KEYS` definition, rename it `LOGIN_IDS_KEY_WHITELIST` and allow one level string `loginID` only. `LOGIN_IDS_KEY_WHITELIST` default to empty, which allows to use any string as the `loginIDSouce`.

```
LOGIN_IDS_KEY_WHITELIST = []
==> allows any string as loginIDSouce

LOGIN_IDS_KEY_WHITELIST = ["username", "email"]
==> allows "username" and "email" as loginIDSouce
```

And `loginIDData` must be following form:

```
{
  <loginSource: String>: <loginId: String>,
  <loginSource: String>: <loginId: String>
}
```

For example, for `LOGIN_IDS_KEY_WHITELIST = []`,

```
signup({
  username: 'example',
  email: 'example@example.com'
}, 'password')
```

which creates two `loginID`s:

| login_id_source:String | login_id:String (`UNIQUE`) |
| --- | --- |
| username | example |
| email | example@example.com |

User can login by `username` **OR** `email`, but not `username` **AND** `email`.

```
login('example', 'password'); ==> OK
login('example@example', 'password'); ==> OK
login({
  username: 'example',
  email: 'example@example.com'
}, 'password') ==> won't support this.
```

Since `loginID` is defined with `UNIQUE` constraint, which means another user **can't** signup as

```
signup({
  username: 'example@example.com',
  email: 'example'
}, 'password') ==> error: Duplicated loginID
```

For app wants to use compound keys as `loginID`, we suggest it encodes compound keys to a JSON string.

```
LOGIN_IDS_KEY_WHITELIST = ["email", "role_phone"]

signup({
  email: 'example@example.com',
  role_phone: '["admin","phone"]'
}, 'password') ==> OK
```

which creates two `loginID`s:

| login_id_source:String | login_id:String (`UNIQUE`) |
| --- | --- |
| email | example@example.com |
| role_phone | ["admin","phone"] |

It's developer's responsibility to ensure the encoded string uniqueness ('["admin","phone"]' and '["phone","admin"]' are considered as two different `loginID`). 

If `LOGIN_IDS_KEY_WHITELIST ` contains some string (not empty), a user can't signup with a `loginIDSouce` not in the list.

```
LOGIN_IDS_KEY_WHITELIST = ["email", "username"]

signup({
  email: 'example@example.com',
  role_phone: '[\"admin\", \"1234567\"]'
}, 'password') ==> error: Unknow loginIDSource ("role_phone")
```

The response user object is:

```
LoginID-Source: username,
Passcode-ID: null,
{
    user_id: <id>,
    login_ids: {
      "role-phone": {
        role: 'example',
        phone: '8912345',
      },
      username: 'example',
      email: 'example@example.com'
    },
    metadata: {
      age: 18
    }
}
```

### Code change

1. [skygear-server] Update `loginIDMetadataKeys` definition setting.
2. [skygear-server] Change `_auth_provider_password.authData` to `text` type and add `_auth_provider_password.source` field.
3. [skygear-JS-SDK] Update SDK APIs

   | Old | New |
   | -------- | -------- |
   | `login(authData: dict, password: String)` | `login(loginID: String, password: String)` |
   | N/A | `createLoginID(loginIDSource: String, loginID: String)`<br/>`updateLoginID(loginIDSource: String, loginID: String)`<br/>`removeLoginID(loginIDSource)` |
   | N/A | `createPasscode(loginIDSource: String, password: String, skip2FA: Boolean)`<br/>`updatePasscode(loginIDSource: String, password: String, skip2FA: Boolean`<br/>`deletePasscode(loginIDSource: String)` |
4. [skygear-server] Update signup and login handler to handle the updated `loginID` concept.
5. [skygear-server] Include `LoginID-Source` in response header.

## Compare proposal 2 and proposal 3

### form of loginIDs

Proposal 2 allows to use free form `loginID`s, proposal 3 not.

```javascript
signup({
  username: 'exmaple',
  email: 'example@example.com',
  "role-phone": {
    role: 'example',
    phone: '8912345',
  }
}, 'password'); ===> proposal 2: OK, proposal 3: error: Incorrect loginID format
```

### Compound Keys

Proposal 3 allows String loginID only, for compound keys loginID, it needs to use a work-around.

```javascript
signup({
  username: 'exmaple',
  email: 'example@example.com',
  "role-phone": '["example", "example@example.com"]'
}, 'password'); 
```

## User verification

Proposal 2 need another API (`requestVerification(LoginIDSource: String, type: ["email", "phone"])`) to find `email` or `phone` to verify user.

### SSO auto-link

Proposal 2 need aother mechanism to find `email` of a user to support auto-link user.