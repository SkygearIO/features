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

Allow a user to signup with arbitrary string with an arbitrary key as `loginIDMetadataKey`, and then the user can use the string to do authentication. 

`<loginIDMetadataKey>: <loginID>`

### Sample use case: signup with email

```javascript
// user can signup with arbitrary string
// `loginIDMetadataKey=email` is inserted implicitly
skygear.auth.signupWithEmail('example@example.com', 'password');
skygear.auth.login(
  'example@example.com', 'password'
).then((user) => {
  console.log(user);
  /*
  {
      user_id: <id>,
      loginID_source: 'email'
      metadata: {
        email: 'example@example.com',
      }
  }
  */
});
```

### Sample use case: signup with username

```javascript
// `loginIDMetadataKey=username` is inserted implicitly
skygear.auth.signupWithUsername('example', 'password');
skygear.auth.login(
  'example', 'password'
).then((user) => {
  console.log(user);
  /*
  {
      user_id: <id>,
      loginID_source: 'username'
      metadata: {
        // loginIDs
        username: 'example',
      }
  }
  */
});
```

### Sample use case: signup with custom loginID

```javascript
// signup with a dict of loginIDs
skygear.auth.signup({
  role: 'example',
  phone: '8912345',
}, 'password');
skygear.auth.login(
  'example', 'password'
).then((user) => {
  console.log(user);
  /*
  {
      user_id: <id>,
      loginID_source: 'role'
      metadata: {
        // loginIDs
        role: 'example',
        phone: '8912345'
      }
  }
  */
});
skygear.auth.login(
  '8912345', 'password'
).then((user) => {
  console.log(user);
  /*
  {
      user_id: <id>,
      loginID_source: 'phone'
      metadata: {
        // loginIDs
        role: 'example',
        phone: '8912345'
      }
  }
  */
});
```

As shown in above, the user object will list all `loginID`s in `metadata`.

### Code change

1. [skygear-server] Remove `loginIDMetadataKeys` setting.
2. [skygear-server] Change `_auth_provider_password.authData` to `text` type and add `_auth_provider_password.source` field.
3. [skygear-JS-SDK] Update SDK APIs

   | Old | New |
   | -------- | -------- |
   | `login(authData: Object, password: String)` | `login(loginID: String, password: String)` |
   | `loginWithEmail(email: String, password: String)` | Remove |
   | `loginWithUsername(username: String, password: String)` | Remove |
   | `requestVerification(recordKey: String)` | `requestVerificationByEmail(email: String)`<br/>`requestVerificationByPhone(phone: String)` |
   |  | `createPasscode(loginIDSource: String, password: String, skip2FA: Boolean)`<br/>`updatePasscode(loginIDSource: String, password: String, skip2FA: Boolean`<br/>`deletePasscode(loginIDSource: String)` |
4. [skygear-server] Update login handler to handle the new form of the `loginID`.
5. Implement `createPasscode`, `updatePasscode` and `deletePasscode` to allow user to add `loginID` to an existing user.

### SSO auto-link

For SSO auto-link user feature, have following possible solutions:

1. assume `loginID` is email.
2. provide an extra auth-hook, which request to return `userID` by email.
3. Check if there is email information in the metadata:
   1. if there is a `sso_matching_emails`, all emails in the array of value will be matched against the SSO login.
   2. if ther is a `email`, that email will be matched against the SSO login.

Solution 3 may have uniqueness issue, i.e. two user could have identical email or overlapping email in `sso_matching_emails`.

### Login with a dict

In V1, with proper setting, user can login with a dictionary, for example:

```javascript
loginIDMetadataKeys=[["username", "email"]]

skygear.auth.signup({
  username: 'example',
  email: 'example@example.com',
}, 'password');

// auth gear saves: {username: 'example', email: 'example@example.com'} as the authData

skygear.auth.login({
  username: 'example',
  email: 'example@example.com',
}, 'password');
```

For supporting this proposal, user may modify as:

```javascript
skygear.auth.signup({
  username_email: 'example_example@example.com',
}, 'password');

skygear.auth.login('example_example@example.com', 'password');
console.log(skygear.auth.currentUser);
/*
{
    user_id: <id>,
    loginID_source: 'username_email'
    metadata: {
      // loginIDs
      username_email: 'example_example@example.com',
    }
}
*/
```
