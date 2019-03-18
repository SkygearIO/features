For supporting login without specifying `loginID`, have two proposals:

## Proposal 1 - auth gear find corresponding user object automatically

Keeping most of current implementation, auth gear finds possible user object automatically. Consider following use case:

```javascript
skygear.auth.signup({
  email: 'example@example.com', 
  username: 'example'
}, 'password');

// new:
skygear.auth.login('example@example.com', 'password')
.then((user) => {
  console.log('login successfully');
});
```


### Possible Problem

If user signup with incorrect `loginIDMetadataKeys`, it may cause user identify miss assign. Consider following scenario:

```javascript

// signup user A
skygear.auth.signup({
  email: 'example@example.com', 
  username: 'example'
}, 'password');


// signup user B
// B's username is A's email
skygear.auth.signup({
  username: 'example@example.com', 
  email: 'example'
}, 'password');

// doesn't know which user to match
// user A: {email: 'example@example.com'}
// user B: {username: 'example@example.com'}
skygear.auth.login('example@example.com', 'password');
```

### Code change

Just brute force and find all possible principals. 

When auth gear is got a login request without specifying `loginIDMetadataKey`, auth gear will try to find all possible principals based on current `loginIDMetadataKeys` setting. 

For example, if a user login with string `"example"`, and `loginIDMetadataKeys=[["username"], ["email"], ["phone"]]`, auth principal store finds all principals which has `{username: "example"}`, `{email: "example"}` and `{phone: "example"}` in `authdata` field.

And then login handler will check input password with stored password, if **only one** of the principals matched, then the user login successfully. If there are more than one principals matched, auth gear will return `Ambiguous loginID` error to the client. 

The major drawback of this solution is the API UX is not good, basically just throw the problem back to the app developer. But the situation of two users uses same password with interchanged `loginID` should be a rare case.


## Proposal 2 - meaningless login ID

Allow a user to signup with arbitrary string, then user can use the string to do authentication. Consider following scenario:

```javascript
skygear.auth.signup('example@example.com', 'password');
skygear.auth.login('example@example.com', 'password');

// or signup with a list of loginID
skygear.auth.signup([
  'example',
  'example@example.com',
], 'password');
// then user login with the arbitrary to login
skygear.auth.login('example@example.com', 'password');
skygear.auth.login('example', 'password');
```

### Code change

1. [skygear-server] Remove `loginIDMetadataKeys`
2. [skygear-server] Change `_auth_provider_password.authData` to `text` type.
3. [skygear-JS-SDK] Update SDK APIs
   - `login(authData: Object, password: String)`
   - `loginWithEmail(email: String, password: String)`
   - `loginWithUsername(username: String, password: String)`
   - `signup(authData: Object, password: String, data: Object)`
   - `signupWithEmail(email: String, password: String, data: Object)`
   - `signupWithUsername(username: String, password: String, data: Object)`
   - `requestVerification(recordKey: String)`  
   to
   - `login(loginID: String, password: String)`
   - `signup(loginID: String, password: String, data: Object)`
   - `signupWithLoginIDs(loginIDs: Array: password: String)`
   - `requestVerificationByEmail(email: String)`
   - `requestVerificationByPhone(phone: String)`
4. [skygear-server] Update login handler to handle the new form of the `loginID`.

### SSO auto-link

For SSO auto-link user feature, have following possible solutions:

1. assume `loginID` is email.
2. provide an extra auth-hook, which request to return `userID` by email.
3. force developer to add `email` in user's `metadata` (or by some configured method to indicate the attribute `key` in the `metadata`).
