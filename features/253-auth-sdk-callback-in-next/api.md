# Description

In skygear v1, auth related API in SDK often returns a `user<record>` as the result. e.g.

```javascript=
skygear.auth.signupWithUsername(username, password).then((user) => {
  console.log(user); // user is an user record
  console.log(user["username"]); // username of the user
}, (error) => {
  ...
});
```

and user can update its profile via `record` API, like:

```javascript=
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

- SDK have zero knowledge about whether record configured or not.
- Server side implementation would apply to multiple SDKs at once.
- Server side implementation eliminates possible errors.

Besides user profile custom fields, for other auth related information, SDK will wrap it into corresponding properties. For example, SDK will have following properties of auth info of current user:

- `isCurrentUserVerified;`
- `isCurrentUserDisabled;`
- `signupAt;`
- `lastLoginAt;`
- `lastSeenAt;`
- and other future added user auth info properties.

For the case for query another user's auth related information, SDK will provide corresponding APIs. For example:

- `Promise<Boolean> isUserVerified(user<userRecord>);`
- `Promise<Boolean> isUserDisabled(user<userRecord>);`
- `Promise<String> getUserSignupAt(user<userRecord>);`
- `Promise<String> getUserLastLoginAt(user<userRecord>);`
- `Promise<String> getUserLastSeenAt(user<userRecord>);`
- and other future added user auth info properties API.

SDK auth container will add an API to help update user auth info:

- `Promise<record> updateUser(user<record>);`

If a user tries to update user profile via record gear, it will get an error.

# Changes on auth gear

Auth gear will keep current implementation, embed user profile record in the response:

Old:

```go=
type AuthResponse struct {
  UserID      string              `json:"user_id,omitempty"`
  Profile     *skyconv.JSONRecord `json:"profile"`
  Roles       []string            `json:"roles,omitempty"`
  AccessToken string              `json:"access_token,omitempty"`
  LastLoginAt *time.Time          `json:"last_login_at,omitempty"`
  LastSeenAt  *time.Time          `json:"last_seen_at,omitempty"`
}
```

New:

```go=
type AuthResponse struct {
  UserID      string                  `json:"user_id,omitempty"`
  Profile     userprofile.UserProfile `json:"profile"`
  Roles       []string                `json:"roles,omitempty"`
  AccessToken string                  `json:"access_token,omitempty"`
  LastLoginAt *time.Time              `json:"last_login_at,omitempty"`
  LastSeenAt  *time.Time              `json:"last_seen_at,omitempty"`
}
```

And `AuthResponse.Profile` is a marshalled JSON object:

```json=
{
    "_access": null,
    "_created_at": "<datetime>",
    "_created_by": "<user_id>",
    "_id": "user\/<record_id>",
    "_ownerID": "<user_id>",
    "_recordID": "<record_id>",
    "_recordType": "user",
    "_type": "record",
    "_updated_at": "<datetime>",
    "_updated_by": "<user_id>",
    "email": "abc@example.com"
}
```

To handle the case of record gear missing, auth gear will add a new table to save user's profile.

```sql=
CREATE TABLE _auth_user_profile (
  user_id text REFERENCES _core_user(id),
  created_at timestamp without time zone NOT NULL,
  created_by text,
  updated_at timestamp without time zone NOT NULL,
  updated_by text,
  data jsonb,
  PRIMARY KEY(user_id),
  UNIQUE (user_id)
);
```

Auth gear will also have a store `SimpleUserProfileStore` which confirms `UserProfileStore` interface:

Old:
```go=
type UserProfileStore interface {
  CreateUserProfile(userProfile interface{}) error
  GetUserProfile(userID string, userProfile *interface{}) error
}
```

New:
```go=
// Meta is meta data part of a user profile record
type Meta struct {
  ID         string                 `json:"_id"`
  Type       string                 `json:"_type"`
  RecordID   string                 `json:"_recordID"`
  RecordType string                 `json:"_recordType"`
  Access     map[string]interface{} `json:"_access"`
  OwnerID    string                 `json:"_ownerID"`
  CreatedAt  time.Time              `json:"_createdAt"`
  CreatedBy  string                 `json:"_createdBy"`
  UpdatedAt  time.Time              `json:"_updatedAt"`
  UpdatedBy  string                 `json:"_updatedBy"`
}

// Data refers the profile info of a user,
// like username, email, age, phone number
type Data map[string]interface{}

// UserProfile refers user profile data type
type UserProfile struct {
  Meta
  Data
}

type Store interface {
  CreateUserProfile(userID string, data Data) (UserProfile, error)
  GetUserProfile(userID string) (UserProfile, error)
}
```

And, use `NewAuthResponse` to generate auth response,

Old:

```go=
func NewAuthResponse(authInfo authinfo.AuthInfo, user skydb.Record, accessToken string) AuthResponse
```

New:

```go=
func NewAuthResponse(authInfo authinfo.AuthInfo, userProfile userprofile.UserProfile, accessToken string) AuthResponse
```

# More usage example

## login

```javascript=
skygear.auth.signupWithUsername(username, password).then((user) => {
  console.log(user); // user is an user record
  console.log(user["username"]); // username of the user
}, (error) => {
  ;
});
```

## update user profile

```javascript=
var user = skygear.auth.currentUser;
user["username"] = "new-username";
skygear.auth.updateUser(user).then((user) => {
  console.log(user); // updated user record
  console.log('Username is changed to: ', user["username"]);
  return skygear.auth.whoami();
}, (error) => {
  console.error(error);
});
```

## update user profile via record gear (the error of permission denied is expected)

```javascript=
var user = skygear.auth.currentUser;
user["username"] = "new-username";
skygear.publicDB.save(user).then((user) => {
  ;
}, (error) => {
  // permission denied
  console.error(error);
});
```

# access current user profile

```javascript=
console.log(skygear.auth.currentUser["username"]);
console.log(skygear.auth.currentUser["email"]);
console.log(skygear.auth.currentUser["gender"]);
```

# access current user auth info

```javascript=
console.log(skygear.auth.isCurrentUserVerified);
console.log(skygear.auth.isCurrentUserDisabled);
```

## get current user roles

```javascript=
const users = [skygear.auth.currentUser];
skygear.auth.fetchUserRole(skygear.auth.currentUser).then((roleMap) => {
    console.log(roleMap); // { "<currentUsrId>": ["admin", "editor"] }
}, (error) => {
    console.error(error);
});
```

## access aother user's profile

```javascript=
const User = skygear.Record.extend('user');
const query = new skygear.Query(User);
query.equalTo('username', 'oursky');
skygear.publicDB.query(query).then((records) => {
  const user = records[0];
  console.log(user["username"]);
  console.log(user["email"]);
  console.log(user["gender"]);
}, (error) => {
  console.error(error);
});
```

## access another user's auth info

```javascript=
// check another user's verified state
const User = skygear.Record.extend('user');
const query = new skygear.Query(User);
query.equalTo('username', 'oursky');
skygear.publicDB.query(query).then((records) => {
  const user = records[0];
  return skygear.auth.isUserVerified(user);
}).then((verified) => {
  console.log(verified);
}, (error) => {
  console.error(error);
});

// check another user's disabled state
const User = skygear.Record.extend('user');
const query = new skygear.Query(User);
query.equalTo('username', 'oursky');
skygear.publicDB.query(query).then((records) => {
  const user = records[0];
  return skygear.auth.isUserDisabled(user);
}).then((disabled) => {
  console.log(disabled);
}, (error) => {
  console.error(error);
});
```

## disable user

```javascript=
const User = skygear.Record.extend('user');
const query = new skygear.Query(User);
query.equalTo('username', 'oursky');
skygear.publicDB.query(query).then((records) => {
  const user = records[0];
  return skygear.auth.adminDisableUser(user);
}).then((userId) => {
  console.log(userId);
}, (error) => {
  console.error(error);
});
```

## get another user roles

```javascript=
const User = skygear.Record.extend('user');
const query = new skygear.Query(User);
query.equalTo('username', 'oursky');
skygear.publicDB.query(query).then((records) => {
  return skygear.auth.fetchUserRole(records);
}).then((roleMap) => {
  console.log(roleMap); // { "<userId>": ["admin", "editor"] }
}, (error) => {
  console.error(error);
});
```