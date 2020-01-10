**This document describe Skygear v1 feature. For Skygear v2, refer to #336 instead.**

# Email and Phone Verification

## Use cases

* App collects email and phone number from user. There is a need for
  verifying the email and phone number so that:
  * the app can verify that the user is who they say they are
  * the app can show other users that the information provided by the user
    is verified
  * the app can send messages to verified email address and phone number without
    sending to the unverified ones
* App may request the user to verify the data upon signup, or it may request
  the user to verify the data when updating the user profile. This is
  configurable and application-specific.
* App may require the user to verify data before accessing other server
  resources. This is configurable and application-specific.
* App may customize the behavior for verifying user data.
* When verifying, user is asked to check their email or phone to receive
  a verification link or verification code. The user will click the link or
  enter the code in order to get verified for the user data.
* User may request the verification link or code to be resent.
* App may toggle the verification status of any user through cloud code or SDKs.

## Requirements

### User Verified Flag

Each user will have a flag that indicates whether the user is already
verified. This flag is saved to the user record.

The flag can also be configured to automatically updated when user data changes.

### Supported Verifiable User Data

The server will support verifying these user data:

* Email address: By sending a email to the email address through SMTP.
* Phone number: By sending a SMS to the phone number through a SMS gateway. Only
  supporting Twilio and Nexmo for the time being.

### Storing User Data and Data Verified Flag

User data (i.e. email address and phone number) that requires verification
must be saved in user profile (i.e. in Record DB under `user` record type).
The field name for the user data is configurable.

Data verified flag (i.e. whether the email address or phone number is 
verified) will be saved in the user profile, alongside the user data
to be verified. This allows the app to use Record DB API to query the data
verified flag in order to display the information to user.

### Criteria for Verifying a User

The developer is able to specify which user data is required to be verified
in order for a user to become verified. For example, an app that requests for
email and phone may require either or both email and phone is verified before
the user become verified.

### Configuration

The following is configurable:

* which user data field supports verification
* for each user data field:
  * provider
  * settings for the provider
    * for email: SMTP server settings, username and password
    * for phone: access token or keys
  * templates
* whether the user verified flag automatically updated
* which user data is/are required for a user verified flag to be toggled on
* whether non-auth API is blocked for unverified user
* whether verification link/code is sent automatically upon signup
* whether verification link/code is sent automatically upon updates

### Extensible Verification Provider

A few provider will be provided to verify user data. Provider is configurable
via environment variable. The provider should be extensible so that developer
having custom user data can provide their own provider. The provider is
extensible in python cloud code only.

### Verification Link/Code Persistence and Consumption

Each verification link and code is to be randomly generated and persisted to
the database. Each code has an associated expiry time
and can only be used once. If there are multiple verification links and codes
generated for the same user, all of them should be usable.

## Sample usage

### To verify user data:

1. User click on the link, enter code.
2. Email address or phone number is marked as verified.
3. If all required user data field is verified, the user is marked as verified.
4. The App can check verification status through API.

### When signing up

1. User enter email address and phone number through signup API.
2. If server is set to automatically send verify link/code, verification
   email/SMS is sent. If not, app can request verification through API.
3. Verify user data (see above).

### When updating

1. User update email address or phone number through record API.
2. The email address or phone number is marked as unverified.
3. If some required user data field is unverified, the user is marked as
   unverified.
4. If server is set to automatically send verify link/code, verification
   email/SMS is sent. If not, app can request verification through API.
5. Verify user data (see above).

### If user verified flag is not automatically updated.

1. User update email address or phone number through record API.
2. The email address or phone number is marked as unverified.
3. User verified flag is not updated.
4. Developer write cloud function to toggle the user verified flag through API.

## Sample APIs

When signing up:

```javascript
// email
skygear.auth.signupWithEmail("johndoe@example.com", "password")
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

The app can request verification again:

```javascript
// email
skygear.auth.requestVerification('email')
.then(() => {
  // email sent
});
```

The app can request verification on other fields of user table:

```javascript
// email
skygear.auth.requestVerification('emergency_phone')
.then(() => {
  // SMS sent
});
```

To check for verification:

```javascript
// verify email 
skygear.auth.verifyUserWithCode('31DF2310FAA1')
.then((user) => {
  console.log(user.is_verified); // true
  console.log(user.email_verified); // true
});
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
