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
* The email is sent via SMTP protocol that is configurable. The SMS is sent via a SMS gateway that is configurable.
* Server  will add API for checking email verification code
* Server will add a request preprocessor to check if the user is verified and return an error (if verification is required).
* Signup/login API to return verification status of a user
* Signup API to send verification email if verification is enabled.
* JS, iOS and Android SDK to add API for resending verification email and checking verification code.

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
skygear.auth.signupWithEmail("johndoe@example.com", "password")
.then((user) => {
  console.log(skygear.auth.verified); // false
});
```

```javascript
skygear.auth.signupWithPhone("johndoe@example.com", "password")
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

When resending verification email:

```javascript
skygear.auth.resendEmailVerification()
.then(() => {
  // email sent
});
```

When resending verification SMS:

```javascript
skygear.auth.resendSMSVerification()
.then(() => {
  // email sent
});
```

When verifying:

```javascript
skygear.auth.verifyEmail('31DF2310FAA1')
.then(() => {
  console.log(skygear.auth.verified); // true
  console.log(skygear.auth.verifiedRecordKeys); // ['email']
});
```

If verification is required and the use is not verified:

```javascript
skygear.someAction()
.then(() => {
  // the promise is rejected and this function is not called
}, (err) => {
  console.log(err.name); // VerificationRequired
});
```



