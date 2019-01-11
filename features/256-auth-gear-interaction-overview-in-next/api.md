# auth gear interaction overview in next

Base on the new product architecture decision (auth gear + Cloud Function and drop record gear), skygear next should bring up a new experience on how auth gear is used in Cloud Function and Client SDK.

## Goal

* Keep auth gear simple, focus on auth related functionalities.
* Keep Client SDK simple, less interaction with auth gear directly.
* More Cloud Functions, a developer should create corresponding Cloud Function to fulfill application logic.

## Major changes

* Move admin related features from Client SDK to APIs at Cloud Functions.
* Remove user profile support in auth gear.

## Architecture overview

![](https://i.imgur.com/qg4Q2bh.png)

- Cloud Functions may have its own DB to handle user profile (gender, age, ..., anything other than auth infomation).
- It's developer's responsibility to create corresponding Cloud Function to handle admin related auth features (enable/disable user, assign role, ...).

## Use cases

* Client SDK
    * should support to access current user's attributes after login/signup successfully.
    * should support change password.
    * should support forgot password flow.
    * should support verify user.
* Cloud Function
    * should support to indicate it can be invoked by authenticated user only.
    * should support to create a user referenced DB table.
    * should support to access current Cloud Funtion user's attribute in context.
    * should support to send request to auth gear, e.g. enable/disable user, assign/revoke role to a user.
    * should support to query users in auth gear.

## Auth related information

Auth gear should focus on auth functionalities, followings are an incompleted list of auth related information:

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

## Move admin related features from Client SDK to APIs at Cloud Functions.

Since Client SDK _**won't**_ have admin auth APIs support anymore, a developer should create Cloud Function to accomplish admin admin task respectively.

Thus following admin APIs will be dropped in Client SDK:

| Attribute | Interface |
| -------- | -------- |
| disabled | `adminDisableUser`<br/>`adminenableUser` |
| password | `adminResetPassword` |
| role | `assignUserRole`<br/>`fetchUserRole`<br/>`revokeUserRole`<br/>`setDefaultRole` |

And above admin tasks can be archieved by invoking following auth gear interface in Cloud Function.

| Attribute | Interface |
| -------- | -------- |
| disabled | `POST /auth/disable/set` |
| password | `POST /auth/reset_password` |
| role | `POST /auth/role/assign`<br/>`POST /auth/role/revoke`<br/>`POST /auth/role/admin`<br/>`POST /auth/role/default` |

## How to indicated Cloud Function supports for authenticated user only

Clound function should have to way to indicate it will be executed by authenticated user only. Following is an possible example:

```javascript=
const skygear = require('skygear');

function welcome(req, res) {
    res.end("welcome " + req.context.user.email);
}

module.exports = skygear.auth.authed(welcome);
```

## How support to user referenced table in Cloud Function

Auth gear should support hook mechanism to notify Cloud Function while auth events fired (signup, login), and such hook should convey following information:

- full user object in json
- the original request payload in the request if exists

And a hook function should response execution status.

- 0: success
- 1: failure

Following is a possible example:

```javascript
const skygear = require('skygear');
const mongoClient = require('mongodb').MogoClient;

function authHook(req, res) {
  if (ctx.type === "signup") {
    // req.context.user: the user object in auth gear
    const userId = req.context.user.id;
    // req.body: the original payload from signup request
    const body = req.body.json();
    
    const secrets = req.context.secrets;
    const mongoUrl = 'mongodb://' + secrets.MONGODB_HOST + ':' + secrets.MONGODB_PORT + '/' + secrets.MONGODB_DBNAME;
    mongoClient.connect(mongoUrl, (err, db) => {
        if (err) {
            res.end(1);
            return;
        }

        // save user profile to Cloud Function's DB
        var user = { id: userId, age: body['age'] };
        db.collection("users").insertOne(user);
        res.end(0);
    });
  }
}

module.exports = skygear.auth.hook(authHook);
```
