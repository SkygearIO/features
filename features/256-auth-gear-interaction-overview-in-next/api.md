# auth gear interaction overview in next

Base on the new product architecture decision (auth gear + cloud function and drop record gear), skygear next should bring up a new experience on how auth gear is used in cloud function and client SDK.

## Goal

* Keep auth gear simple, focus on auth related functionalities.
* Keep client SDK simple, less interaction with auth gear directly.
* More cloud functions, a developer should create corresponding cloud funtion to fulfill application logic.

## Major changes

* Remove admin API in client SDK.
* Remove user profile support in auth gear.

## Architecture overview

![](https://i.imgur.com/GQbup7u.png)

- Cloud function has its own `user` table and it should save user profile (gender, age, ..., anything other than auth infomation) here.
- Auth gear's `user` table saves auth related information only.

## Use cases

### client SDK

* should support to access current user's attributes after login/signup successfully.
* should support change password
* should support forgot password flow
* should support verify user

### cloud function

* should support to indicate it is restricted to be invoked by authenticated user only.
* should support to have a table with user_id as foreign key.
* should support to access cloud funtion user's attribute in context.
* should support to set a user's role, disabled state.
* should support to query user.

## Auth related information

Auth gear would focus on auth related information only, they are

```go
AuthData        map[string]string
SignUpAt        string
LastSeenAt      string
LastLoginAt     string
Disabled        bool
DisabledMessage string
DisabledExpiry  string
Roles           []string
Verified        bool
```

## How to update user attributes in client SDK

Since client SDK _**won't**_ have API support to update user attributes directly, developer should create their own cloud function for client SDK to update user attributes accordingly.

![](https://i.imgur.com/Awrge8l.png)

And followings APIs will be dropped in client SDK:

- `adminDisableUser`
- `adminenableUser`
- `adminResetPassword`
- `assignUserRole`
- `fetchUserRole`
- `revokeUserRole`
- `setAdminRole`
- `setDefaultRole`

## How to update user attributes in clound function

For restricted attributes, cloud function should use corresponding interface in auth gear to update.

| Attribute | Interface |
| -------- | -------- |
| role | `POST /auth/role/admin`<br/>`POST /auth/role/assign`<br/>`POST /auth/role/default`<br/>`POST /auth/role/revoke` |
| disable | `POST /auth/disable/set` |

## How to indicated cloud function supports for authenticated user only

Clound function should have to way to indicate it will be executed by authenticated user only. Following is an possible example:

```javascript=
const skygear = require('skygear');

function welcome(req, res) {
    res.end("welcome " + req.context.user.email);
}

module.exports = skygear.auth.authed(welcome);
```

## How support to user referenced table in cloud function

Auth gear should have auth related hooks to cloud function, so cloud function should have enough information to create user referenced table. Following is a possible example:

```javascript=
const skygear = require('skygear');
const mongoClient = require('mongodb').MogoClient;

function authHook(req, res) {
  if (ctx.type === "signup") {
    const userId = req.context.user.id;
    const body = req.body.json();
    
    const secrets = req.context.secrets;
    const mongoUrl = 'mongodb://' + secrets.MONGODB_HOST + ':' + secrets.MONGODB_PORT + '/' + secrets.MONGODB_DBNAME;
    mongoClient.connect(mongoUrl, (err, db) => {
        if (err) {
            res.end('failed to connect to mongodb');
            return;
        }

        // save user profile to cloud function's DB
        var user = { id: userId, age: body['age'] };
        db.collection("users").insertOne(user);
        res.end('connected to mongodb');
    });
  }
}

module.exports = skygear.auth.hook(authHook);
```
