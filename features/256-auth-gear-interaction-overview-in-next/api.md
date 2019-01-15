# auth gear and Cloud Function interaction overview in skygear next

Base on the new product architecture decision (auth gear + Cloud Function and drop record gear), skygear next should bring up a new experience on how auth gear is used in Cloud Function and Client SDK.

This spec is aimed to be an overview of the interaction between auth gear and Cloud Function, it would not be treated as a implementation spec of auth gear and Cloud Function. 

## Glossary

* auth gear: a skygear provided component which utilizes user authentication and authorization process, and user profile handling. It would bring enhanced features in the future, such as: JWT provider, Auth UIKit, user management dashboard.
* Cloud function: a developer would create a Cloud Function to fulfill application requirements, it is an serverless execution environment for building and connecting other cloud services. A cloud function should be a single purpose that attached to certain events or triggered by requirement.

## Goal

* Consider auth gear would be extended to a rich-featured functional set, such as JWT provider, Auth UIKit, ..., etc.
* Encourage Cloud Functions, less SDK burden, a developer should create corresponding Cloud Function to fulfill application requirements.
* Avoid coupling between cloud function and auth gear, consider auth gear would be used independently, any access to data owned by another service should only happen through APIs.
* Auth gear and Cloud function should have identical execution context.
* List use cases to demonstrate how auth gear and Cloud Function interaction flow. 

## Major changes

* Move admin related features from Client SDK to APIs at Cloud Functions.
* API gateway should add "current user" in request context and dispatch to auth gear or Cloud Function.
* Auth gear should support query interface.


## Architecture overview

![](https://i.imgur.com/DJTdGld.png)

\* this diagram is an overview only, detail flow explain in later section.

- Cloud Functions may have its own DB.
- It's developer's responsibility to create corresponding Cloud Function to handle admin related auth features (enable/disable user, assign role, ...).
- Cloud function would implement `/after_save_user` function to handle user changes.

## `/after_save_user` execution flow in Cloud Function

When auth gear receives request to update user attributes (disabled, roles, profile), it's auth gear's responsibility to invoke attached function in Cloud Function, and notify it about the user attribute changes.

And such Cloud Function, is called from auth gear in **BLOCKING/SYNC** way (in current execution transactions), if Cloud Functions returns error, auth gear would rollback DB, discard the changes. This is important to make sure data consistency between auth gear and Cloud Function. We can consider such cloud function is a subroutine of auth gear.

Following is a diagram which illustrates the flow:

![](https://i.imgur.com/GQYVxsz.png)

1. API gateway passes the request (let's say it's `disable` user here) to auth gear.
2. After auth gear handles the request, pass the result to Cloud Function.
3. Cloud Function handles the notification, and returns the result back to auth gear.
5. Auth gear checks the result, and returns the final response to the API Gateway.

## `/after_save_user` function signature

```javascript
const skygear = require('skygear');

function after_save_user(req, res) {
    // 1. req.context.user: the user object from auth gear
    const user = req.context.user;
    // 2. req.path: the original path from the request
    const path = req.path;
    // 3. req.headers: the original headers from the request
    const headers = req.headers();
    // 4. req.body: the original payload from the request
    const body = req.body.json();
    // return handling result
    
    console.log(user.disabled); // true
    console.log(path); // /auth/disable/set
    console.log(headers['X-Skygear-Access-Token']); // access token from the request
    console.log(body); // { "auth_id": "XXXX", "disabled": true, ... }    
    
    res.end(0);
}

module.exports = skygear.auth.after_save_user(after_save_user);
```

Note that, to avoid spiral request loop, it is forbidden to send request to auth gear in `/after_save_user`.

The reason of only one attached function `/after_save_user` for now rather than multiple attached functions for different request reasons (disable, assign role, ...) is because the attached function is regarded as an notification mechanism for make sure data consistency between auth gear and Cloud Function. It shouldn't be considered as part of auth processing flow and changes the flow depends on the result of attached Cloud Function, it could increase complexity of auth flow and not easy to do error handling.

Though auth gear with custom database connection is in the road map, at that time, there should be more attached functions will be defined. This spec would be focused on `/after_save_user`.

## Query support `/auth/users/query` in auth gear

Auth gear should support user query functionality, it provides other services to create enhanced features, like User Management Dashboard, or for Cloud Function, it would management user even if it doesn't implement self-owned user table in Cloud Function database.

```
curl -X POST -H "Content-Type: application/json" \
     -H "X-Skygear-Api-Key: MASTER_KEY" \
     -d @- http://localhost:3000/auth/users/query <<EOF
{
    "predicate": [
        "eq",
        {
            "$val": "_id",
            "$type": "keypath"
        },
        "user-id"
    ]
}
EOF
{
     "results": [
        <user>,
        <user>
     ]
}
```

## Use cases

### [Client SDK] should support to login/signup.
![](https://i.imgur.com/opwa4AS.png)
1. SDK sends `auth/login` or `auth/signup` request to API gateway.
2. API gateway routes request to auth gear.
3. auth gear handles the request.

\* `/after_save_user` is omit for simply the process.

### [Client SDK] should support update profile.
![](https://i.imgur.com/1uupx9O.png)
1. SDK sends `auth/update_profile` request.
2. API gateway routes request to auth gear, and auth gear handles the request.
3. auth gear send `/after_save_user` request to API gateway to notify user profile change.
4. API gateway routes `/after_save_user` to Cloud Function.
5. Cloud Function handles the request and returns the result.
6. API gateway rotues the result back to auth gear, and then return response back to SDK.

### [Client SDK] should support forgot password flow.
![](https://i.imgur.com/OPO00in.png)
1. SDK sends `auth/forgot_password` request with user Email.
2. API gateway routes request to auth gear.
3. auth gear handles the request, and send an Email with a link for user to reset password page.
4. Reset password via the form action `auth/forgot_password/reset_password`.
5. API gateway routes request to auth gear.
6. auth gear checks the code and update user password.

\* `/after_save_user` is omit for simply the process.

### [Client SDK] should support verify user.
![](https://i.imgur.com/s1apKcg.png)
1. SDK sends `auth/verify_request` request.
2. API gateway routes request to auth gear.
3. auth gear handles the request.
4. Verify user via form action `auth/verify_code`.
5. API gateway routes request to auth gear.
6. auth gear checks the code and verify the user.

\* `/after_save_user` is omit for simply the process.

### [Cloud Function] should handle auth related admin API

Auth admin related APIs have removed from SDK, a developer should create its own Cloud Function and generate request to API gateway.

| Attribute | Interface |
| -------- | -------- |
| disabled | `POST /auth/disable/set`|
| password | `POST /auth/reset_password`|
| role | `POST /auth/role/assign`<br/>`POST /auth/role/assign`<br/>`POST /auth/role/admin`<br/>`POST /auth/role/default` |

Following take disable user as an example.

![](https://i.imgur.com/kOWCmyK.png)

1. Cloud Function initiates auth admin related request to API gateway.
2. Auth gear handle the request.

\* `/after_save_user` is omit for simply the process.

### [Cloud Function] should have to way to indicate it will be executed by authenticated user only.
![](https://i.imgur.com/ohlsXTW.png)
1. SDK send Cloud function request to API gateway.
2. API gateway check if the user is authenticated.
3. If the user is authenticated, API gateway routes the request to Cloud Function.

Following is an possible usage example for Cloud Function:

```javascript=
const skygear = require('skygear');

function welcome(req, res) {
    res.end("welcome " + req.context.user.email);
}

module.exports = skygear.auth.authed(welcome);
```

### [Cloud Function] should support to create a user referenced DB table.

Through `/after_save_user` attached Cloud Function, it is feasible to create user table in Cloud Function database. 

```javascript
const skygear = require('skygear');
const mongoClient = require('mongodb').MogoClient;

function after_save_user(req, res) {
    // req.context.user: the user object in auth gear
    const userId = req.context.user.id;
    
    const secrets = req.context.secrets;
    const mongoUrl = 'mongodb://' + secrets.MONGODB_HOST + ':' + secrets.MONGODB_PORT + '/' + secrets.MONGODB_DBNAME;
    mongoClient.connect(mongoUrl, (err, db) => {
        if (err) {
            res.end(1);
            return;
        }

        // cloud function could save user profile to Cloud Function's DB
        db.collection("users").findOneAndUpdate({"id": user["id"]}, {"age": user["age"]});
        res.end(0);
    });
}

module.exports = skygear.auth.after_save_user(after_save_user);
```
