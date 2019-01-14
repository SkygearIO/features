# auth gear and Cloud Function interaction overview in skygear next

Base on the new product architecture decision (auth gear + Cloud Function and drop record gear), skygear next should bring up a new experience on how auth gear is used in Cloud Function and Client SDK.

## Goal

* Keep auth gear simple, focus on auth related functionalities.
* More Cloud Functions, a developer should create corresponding Cloud Function to fulfill application logic.
* Avoid coupling between cloud function and auth gear, any access to data owned by another service should only happen through APIs.

## Major changes

* Move admin related features from Client SDK to APIs at Cloud Functions.

## Architecture overview

![](https://i.imgur.com/DJTdGld.png)

\* this diagram is an overview only, detail flow explain in later section.

- Cloud Functions may have its own DB.
- It's developer's responsibility to create corresponding Cloud Function to handle admin related auth features (enable/disable user, assign role, ...).

## Use cases

### [Client SDK] should support to login/signup.
![](https://i.imgur.com/opwa4AS.png)
1. SDK sends `auth/login` or `auth/signup` request to API gateway.
2. API gateway routes request to auth gear.
3. auth gear handles the request.

\* Cloud function would be involved in the process, detail would explain in [later use case](#update_profile).

### [Client SDK] should support update profile.
![](https://i.imgur.com/opwa4AS.png)
1. SDK sends `auth/update_profile` request.
2. API gateway routes request to auth gear.
3. auth gear handles the request.

### [Client SDK] should support forgot password flow.
![](https://i.imgur.com/OPO00in.png)
1. SDK sends `auth/forgot_password` request with user Email.
2. API gateway routes request to auth gear.
3. auth gear handles the request, and send an Email with a link for user to reset password page.
4. Reset password via the form action `auth/forgot_password/reset_password`.
5. API gateway routes request to auth gear.
6. auth gear checks the code and update user password.

### [Client SDK] should support verify user.
![](https://i.imgur.com/s1apKcg.png)
1. SDK sends `auth/verify_request` request.
2. API gateway routes request to auth gear.
3. auth gear handles the request.
4. Verify user via form action `auth/verify_code`.
5. API gateway routes request to auth gear.
6. auth gear checks the code and verify the user.

### [Cloud Function] should have to way to indicate it will be executed by authenticated user only.

![](https://i.imgur.com/RpYFydl.png)
1. SDK send Cloud function request to API gateway.
2. API gateway check if the user is authenticated via auth gear.
3. If the user is authenticated, API gateway routes the request to Cloud Function.

Following is an possible usage example for Cloud Function:

```javascript=
const skygear = require('skygear');

function welcome(req, res) {
    res.end("welcome " + req.context.user.email);
}

module.exports = skygear.auth.authed(welcome);
```

### <a name="update_profile"></a>[Cloud Function] should support to create a user referenced DB table.

Cloud function would implement certain functions for handling auth related events happened (like: signup, login, update user profile).

Take update user profile as an example:

![](https://i.imgur.com/1uupx9O.png)

1. SDK send `/auth/update_profile` request to API gateway.
2. API gateway routes request to auth gear. And handle update user profile request.
3. auth gear send `/update_profile` request to API gateway to notify user profile change.
4. API gateway routes `/update_profile` to Cloud Function.
5. Cloud Function handles the request and returns the result.
6. API gateway rotues the result back to auth gear, and then return response back to SDK.

Note that, to ensure data consistency across auth gear and Cloud Function, auth gear should wait Cloud Function response then response to SDK.

Following is a possible Cloud Function usage example for update profile:

```javascript
const skygear = require('skygear');
const mongoClient = require('mongodb').MogoClient;

function update_profile(req, res) {
    // req.context.user: the user object in auth gear
    const userId = req.context.user.id;
    // req.body: the original payload from the request
    const body = req.body.json();

    const secrets = req.context.secrets;
    const mongoUrl = 'mongodb://' + secrets.MONGODB_HOST + ':' + secrets.MONGODB_PORT + '/' + secrets.MONGODB_DBNAME;
    mongoClient.connect(mongoUrl, (err, db) => {
        if (err) {
            res.end(1);
            return;
        }

        // cloud function could save user profile to Cloud Function's DB
        db.collection("users").findOneAndUpdate({"id": uerId}, {"age": body["age"]});
        res.end(0);
    });
}

module.exports = skygear.auth.update_profile(update_profile);
```
