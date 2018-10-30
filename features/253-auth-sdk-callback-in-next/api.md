# Description

In skygear v1, auth related API in SDK often returns a `user<record>` as the result. e.g.

```
skygear.auth.signupWithUsername(username, password).then((user) => {
  console.log(user); // user is an user record
  console.log(user["username"]); // username of the user
}, (error) => {
  ...
});
```

and user can update its profile via `record` API, like:

```
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

In skygear next, we will have several gears, and each gear handles its own responsibility only. For user auth related functionalities, we will use two gears to handle a user's state.

- auth gear
    - it handles auth related information:
        - user role, disabled state, verified state, etc.
        - principal (how a user can login, e.g. (username/email) + password)
- record gear (optional).
    - a general purpose gear to handle user profile.
    - accessible by record gear only.
    - expected to be accessed by Auth gear through public API optionally.

This feature PR aims to find out a graceful design of the data type of the auth gear response object.

# Glossary

- skygear next: next generation skygear.
- gear: distinct functionality component of skygear next.
- auth gear: skygear next component for user authentication and authorization.
- record gear: general purpose skygear next component handles record operation (CRUD).
- profile record: a record object which handles user profile information (phone number, address, ...).
- auth info: user authentication related information, like role, disabled state, verified state, principal.


# Scenario

- [user] sign up and login
- [user] access auth info (roles, disabled)
- [user] access user profile (username, email, phone number, ...)
- [user] update user profile (username, email, phone number, ...)
- [admin] query other users by some predicates
- [admin] set other users auth info (roles, disabled)

# Guideline

For a developer, it's not easy to understand different data types convey similar concepts. Before skygear next, we had already found `authUser` and `UserRecord` confuse developers, both of them are considered as `user` data type and misuse them easily on SDK.

So in skygear next, even though record gear is optional, we won't introduce a new `coreUser` data type, on the contrary, we will keep return data type of auth gear as `record` to reduce any possible misunderstanding. 

For the case record gear is missing, auth gear will have a simple user profile implementatio by adding a json field to `_core_user` table. And it will also generate a record alike data arribute to client SDK.

# Example usage on JS SDK

keep current design, return data type is `record`.
      
```
+--------------------------+
|                          |
| [ currentUser <record> ] |
| username                 |
| email                    |
| phone                    |
| .....                    |
|                          |
+--------------------------+

// user record
skygear.auth.currentUser;

// current user auth info
skygear.auth.isCurrentUserVerified;
skygear.auth.isCurrentUserDisabled;

// current user profile record
const phone = skygear.auth.currentUser['phone'];

// update record
skygear.auth.currentUser['username'] = 'new-username';
skygear.auth.currentUser['phone'] = 'new-phone';
skygear.auth.updateUser(skygear.auth.currentUser);
```

# Changes on SDK

Skygear next server will help generate `record` data type for SDK, therefore SDKs are expected no major changes.

Such changes are occurred in server side rather than SDK because:

- SDK doesn't know record gear has zero knowledge about whether record configured or not.
- Server side implementation would apply to multiple SDKs at once.
- Server side implementation eliminates possible errors.

SDK auth container will have following changes to fetch auth info of a user:

- properties:
    - isCurrentUserVerified;
    - isCurrentUserDisabled;
- APIs:
    - Promise<Boolean> isUserVerified(user<userRecord>);
    - Promise<Boolean> isUserDisabled(user<userRecord>);

SDK auth container will be added an API to help update user auth info:

- Promise<record> updateUser(user<record>);

# Changes on auth gear

Auth gear will keep current implementation, embed user profile record in the response:

```
type AuthResponse struct {
	UserID      string                 `json:"user_id,omitempty"`
	Profile     map[string]interface{} `json:"profile"`
	Roles       []string               `json:"roles,omitempty"`
	AccessToken string                 `json:"access_token,omitempty"`
	LastLoginAt *time.Time             `json:"last_login_at,omitempty"`
	LastSeenAt  *time.Time             `json:"last_seen_at,omitempty"`
}
```

To handle the case of record gear missing, auth gear will add a new table to save user's profile.

```
CREATE TABLE _auth_user_profile (
  user_id text REFERENCES _core_user(id),
  auth_data jsonb,
);
```

Auth gear will also have a store `SimpleUserProfileStore` which confirms `UserProfileStore` interface:

Old:
```
type UserProfileStore interface {
	CreateUserProfile(userProfile interface{}) error
	GetUserProfile(userID string, userProfile *interface{}) error
}
```

New:
```
type UserProfileStore interface {
	CreateUserProfile(userProfile map[string]interface{}) error
	GetUserProfile(userID string, userProfile *map[string]interface{}) error
}
```

And, for `NewAuthResponse`,

Old:

```
func NewAuthResponse(authInfo authinfo.AuthInfo, user skydb.Record, accessToken string) AuthResponse
```

New:

```
func NewAuthResponse(authInfo authinfo.AuthInfo, profile map[string]interface{}, accessToken string) AuthResponse
```