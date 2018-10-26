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

---

In skygear next, we will have several gears, and each gear handles its own responsibility only. For user auth related functionalities, we will use two gears to handle a user's state.

- auth gear
    - It handles auth related information:
        - user role, disable state, verify state, etc.
        - principal (how a user can login, e.g. (username/email) + password)
- record gear (optional)
    - A general purpose gear to handle user profile
    - Accessible by record gear only
    - Expected to be accessed by Auth gear through public API optionally

There are some concerns arisen due to the design:

1. since record gear is optional, what is the expected return data for the auth related API?
2. how does a user update his own profile? especially when he tries to update his username or email that connects to auth data.

Followings are some concerns are known but will not be discussed in this PR.

1. should auth gear support query functionality?
2. what is the expected parameter data type when admin updates other users' info?

# Scenario

- [user] sign up and login
- [user] access auth data (roles, disabled)
- [user] access user profile (username, email, phone number, ...)
- [user] update user profile (username, email, phone number, ...)
- [admin] query other users by some predicates
- [admin] set other users auth data (roles, disabled)

# Changes on SDK

## We consider three options mainly:

   - [**option1**] profile record is part of `currentUser`
     ```
     +-------------------------------+
     |                               |
     |  [currentUser]                |
     |  username                     |
     |  email                        |
     |  disabled                     |
     |  verified                     |
     |  ......                       |
     |                               |
     |  +------------------------+   |
     |  | [ profile <record> ]   |   |
     |  | username               |   |
     |  | email                  |   |
     |  | phone                  |   |
     |  | .....                  |   |
     |  +------------------------+   |
     |                               |
     +-------------------------------+

     skygear.auth.currentUser; // core user + user record
     skygear.auth.currentUser.profile; // user record
     
     // auth info
     skygear.auth.currentUser.disabled;
     skygear.auth.currentUser.verified;
     
     // profile info
     skygear.auth.currentUser.profile['phone'];
     
     // update record
     skygear.auth.currentUser['username'] = 'new-username';
     skygear.auth.currentUser.profile['phone'] = 'new-phone';
     skygear.auth.updateUser(skygear.auth.currentUser);
     ```
     
     Pros:
     - easy to implement.
     - it is clear that we have two ideas here: core user and user record.
     
     Cons:
     - it still conveys two ideas, core user and user record, it may confuse a developer to use which attribute when invokes auth related operations, e.g. when a user wants to update username, which one should I update? `skygear.auth.currentUser['username']` or `skygear.auth.currentUser.profile['username']`?
     - not sure how to handle record save directly problem.

   - [**option2**] keep current design, return is a `record`
      
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

     skygear.auth.currentUser; // user record
     
     // auth info
     skygear.auth.isCurrentUserVerified;
     skygear.auth.isCurrentUserDisabled;
     
     // profile info
     const phone = skygear.auth.currentUser['phone'];
     
     // update record
     skygear.auth.currentUser['username'] = 'new-username';
     skygear.auth.currentUser['phone'] = 'new-phone';
     skygear.auth.updateUser(skygear.auth.currentUser);
     ```
     Pros:
     - almost sync with current design.
     
     Cons:
     - if record gear doesn't configured, it could be very weired if API still return a record object.
     - since auth gear may need handle record save and implement `updateUser(<record>)` endpoint, auth gear will be coupled with record gear.
     - not sure how to handle record save directly problem.

## Some options when a developer uses record gear to save profile:

It is a instant question if a developer can interact with user profile record directly (option 1 and option 2), we have following options so far:

| Operation | Description | Concerns |
| -------- | -------- | ----- |
| Disallow | developer can only use auth gear to update user, record gear should block developer from saving reserved fields, record save should be denied.| for record gear, need to figure out how to distinguish request from auth gear. |
| Allow | it's developer's responsibility to maintain the consistency between auth_data and user profile | a developer may feel confused and frustrated when `auth_data` doesn't sync with user profile record.
| Allow | auth gear won't help copy auth_data to user profile record, a developer should pass profile as a parameter when signup | same as above |

## SDK API user parameter supported form of each option

| Option 1 | Option 2 |
| -------- | -------- |
| coreUsers<br>coreUserIDs<br>userRecords<br> userRecordIDs | userRecords<br> userRecordIDs |