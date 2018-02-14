# Disable User spec

## Use cases

* An administrator can disable a a user account from logging in and accessing server resources. The administrator can do that through a CMS or through a cloud function.
* The reason that the user account is disabled is application specific, a reason  can be associated with the disabling of a user account. If a reason is provided, the reason will be provided to the user when the user is logging in.
* An administrator can disable a user account for a period of time after which the user account is automatically re-enabled.

## Requirements

* Server will provide API for disabling user account, with optional parameter for the followings:
	* disable reason, to be provided to the disabled user during login
	* disable expiry, the time after which the user account will be automatically enabled
* Server will provide API for enabling a disabled user account.
* Server API for enabling/disabling user accounts are admin only / requires a master key.
* Server will add a request preprocessor to check if the user is disabled and return an error containing disable reason and expiry (if any).
* Modify user login APIs to return an error for disabled users.
* Server will add the disable user info, disable status, disable expiry to the `_auth` table.
* JS, iOS and Android SDK to create SDK API for disabling and enabling user accounts.
* JS, iOS and Android SDK to update the login API to handle user disabled error.

## Sample usage:

To disable user account:

```javascript
// to disable a user account
var user = 'EA04BEBD-1BFD-4FDD-A7D8-615F007A3B32';
var message = 'Account disabled because of TOS violation.';
var now = new Date();
var expiry = new Date(now.getTime() + 60*5); // 5 mintues
skygear.auth.disableUser(user, message, expire)
.then(() => {
  // user is disabled
});
```

To enable user account:

```javascript
// to enable a user account
var user = 'EA04BEBD-1BFD-4FDD-A7D8-615F007A3B32';
skygear.auth.enableUser(user)
.then(() => {
  // user is enabled
});
```

What happens when a disabled user tries to call any API:

```javascript
skygear.auth.whoAmI()
.then(() => {
  // the promise is rejected and this function is not called
}, (err) => {
  console.log(err.name); // UserDisabled
  console.log(err.info.message); // 'Account disabled...'
  console.log(err.info.expiry); // Date/time in ISO format
});
```

## Server design

(will be expanded)

API actions:

* auth:disable_user
* auth:enable_user

_auth table:

* (add) `disabled` boolean
* (add) `disabled_message` string
* (add) `disabled_expiry` date
