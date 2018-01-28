# Verify by email
The use case and requirement apply to verify-by-email and verify-by-sms.

## Use cases
* App may request the user to verify the email address/phone number upon signup.
* The app need will send an email/SMS to the user with the email address/phone number provided when logging in. The app will want to customize the content of the email/SMS.
* Both email/SMS verification supports verify by a verification code or by a verification link.
	* For verification code, the user will type the verification code from the email address/SMS an enter it to the app to complete verification.
	* For verification link, the user will be redirected to a webpage, which automatically send the code to the server to complete verification.
* The App is able to check the verification status of the user using the SDK and cloud function so that it can display other info and/or disable features.
* The developer may want to deny unverified user from accessing any server API except auth related ones.

## Requirements

* Server will have configuration options for:
	* enable/disable email verification (boolean)
	* enable/disable SMS verification (boolean)
	* set verification as required/optional (boolean)
	* smtp server settings
	* SMS gateway settings
	* email template
	* SMS template
* Server will add API for sending/resending verification email
	* when called by an admin or with master key, the API can send verification email to any unverified user, this is designed for cloud code use
	* when called by non-admin unverified user, this API resends the verification email, this is designed for app use
* Server will add API for checking email verification code
* Server will add a request preprocessor to check if the user is verified and return an error (if verification is required).
* Signup/login API to return verification status of a user
* Signup API to send verification email if verification is enabled.
* JS, iOS and Android SDK to add API for resending verification email and checking verification code.

### Criteria for Verifying a User

The developer is able to specify which information is required to be verified
in order for a user to become verified. For example, an app that requests for
email and phone may require either or both email and phone is verified before
the user become verified.

### Verification Code Persistence and Consumption

For each verification email/SMS, the code should be randomly generated and
the code will persist into the database. Each code has an associated expiry time
and can only be used once.

### Modify Authentication Keys

When modifying authentication keys (auth record keys, i.e. email or phone) using
the Record DB API, the user may become unverified. API will be provided so that
the app can decide whether to update the email or phone upon verification.

### SMS and Email Provider

SMS and email are sent via a provider, which is extensible in server code only.
Email provider will support SMTP initially and SMS will support Twilio and
Nexmo. Provider is configurable.

## Sample usage

Flow:

1. The user install an app.
2. The user sign up using email address (same for phone number) and a password.
3. The server responds with user data, which indicates if verification is required and that the user is unverified.
4. If verification is required:
	1. Show UI for verification.
	2. If the app expects the user to enter a code, allow the user to enter the code and call the check verification code API.
	3. If the app expects the user to click verification link, refresh `whoAmI` API to check if the user is verified.
	4. The UI may request for resending verification.
5. If verification is not required.
	1. Show UI for verification.
	2. Allows user to skip verification and dismiss the verification UI.

When signing up:

```javascript
// email
skygear.auth.signupWithEmail("johndoe@example.com", "password")
.then((user) => {
  console.log(skygear.auth.verified); // false
});

// phone
skygear.auth.signupWithPhone("+85221559299", "password")
.then((user) => {
  console.log(skygear.auth.verified); // false
});
```

To check if the user is verified:

```javascript
skygear.auth.whoAmI()
.then((user) => {
  console.log(skygear.auth.verified); // false
});
```

If the email/SMS is not received by the user, the app can request
for verification again.

```javascript
// email
skygear.auth.sendEmailVerification('johndoe@example.com')
.then(() => {
  // email sent
});

// SMS
skygear.auth.sendPhoneVerification('+85221559299')
.then(() => {
  // SMS sent
});
```

To check for verification:

```javascript
// verify email 
skygear.auth.verifyEmail('johndoe@example.com', '31DF2310FAA1')
.then(() => {
  console.log(skygear.auth.verified); // true
  console.log(skygear.auth.verifiedRecordKeys.keys()); // ['email']
});

// verify and update email
skygear.auth.verifyEmail('hello@example.com', '31DF2310FAA1', true)
.then((user) => {
  console.log(user.email) // 'hello@example.com'
}
```

If verification is required and the user is not verified:

```javascript
skygear.someAction()
.then(() => {
  // the promise is rejected and this callback is not called
}, (err) => {
  console.log(err.name); // 'VerificationRequired'
});
```

## Portal UI

(to be expanded)

## Future extension

The following section describe how the verify by Email/SMS API will be
extended to work with other use cases.

These use cases will be covered by future specifications.

### Login with Email/SMS

The flow for logging in with Email/SMS will be accomplished by
first requesting a verification, and then use the code to login.

The app should call `sendEmailVerification()` (or equivalent API for SMS),
and then use the obtained code to call `loginWithEmailAndVerifyCode()`, the
latter of which is a wrapper around `verifyEmail()` above. The SDK should call
the same or similar underlying server actions.

### Reset Password

The flow for reset password is accomplished by first requestign a verification
and then using the code to reset the password.

The app should call `sendEmailVerification()` (or equivalent API for SMS),
and then use the obtained code to call `resetPassword()`.
