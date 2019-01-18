# auth gear and Cloud Function interaction overview in skygear next

Base on the new product architecture decision (auth gear + Cloud Function and drop record gear), skygear next should bring up a new experience on how auth gear is used in Cloud Function and Client SDK.

## Glossary

* auth gear: a skygear provided component which utilizes user authentication and authorization process, and user profile handling. It would bring enhanced features in the future, such as: JWT provider, Auth UIKit, user management dashboard.
* Cloud Function: a developer would create a Cloud Function to fulfill application requirements. A cloud function should be a single purpose that attached to certain events or triggered by requirement.
* auth data: auth related state, such as disabled, last login at, ..., etc.
* user metadata: indicated as common user properties, such as avatar, first name, last name, display name, ..., etc. 
* user profile: varied user properties, differs from application to application
* user attributes: merge user auth data, user metadata, user profile together.

## Goal

* Consider auth gear would be extended to be a rich-featured functional set, such as JWT provider, Auth UIKit, ..., etc.
* Encourage Cloud Functions, less SDK burden, a developer should create corresponding Cloud Function to fulfill application requirements.
* Avoid coupling between cloud function and auth gear, consider auth gear would be used independently, any access to data owned by another service should only happen through APIs.
* Auth gear and Cloud Function both should have current user execution context.
* List use cases to demonstrate how auth gear and Cloud Function interaction flow.

## Major changes

* Move admin related features from Client SDK to APIs at Cloud Functions.
* API gateway should inject "current user" into request context and then dispatch request to auth gear or Cloud Function.
* Auth gear should have user metadata for common user properties.

## Architecture overview

![](https://i.imgur.com/jxNxhmd.png)

\* this diagram is an overview only, detail flow explain in later section.

- Cloud Functions may have its own DB.
- It's developer's responsibility to create corresponding Cloud Function to handle admin related auth features (enable/disable user, assign role, ...).
- Cloud Function would implement hook functions to handle user changes.

## Move auth admin APIs from SDK to Cloud Function

Following function will be removed from SDK, a developer should create its Cloud Function to handle admin tasks.

| Attribute | Interface | Old JS SDK API |
| -------- | -------- | ------ |
| disabled | `POST /auth/disable/set`| `adminDisableUser`<br/>`adminEnableUser` |
| password | `POST /auth/reset_password`| `adminResetPassword` |
| role | `POST /auth/role/assign`<br/>`POST /auth/role/admin`<br/>`POST /auth/role/default` | `assignUserRole`<br/>`revokeUserRole`<br/>`setDefaultRole` |

## Execution flow of hooked Cloud Function

When auth gear receives a request to update user attributes (disabled, roles, profile), it's auth gear's responsibility to invoke hooked function to allow Cloud Function creates/updates corresponding objects in its own DB.

There are four hooked Cloud Function forms: 

- `before_XXX_sync`
- `before_XXX`
- `after_XXX_sync`
- `after_XXX`

where `XXX` is the auth action name. 

And as the name inferred, hooked Cloud Functions are executed in two ways: `sync` and `async` way. And all hooks are executed in transaction. `before_XXX_sync` and `before_XXX` is executed "before" DB operation. Whereas `after_XXX_sync` and `after_XXX` is executed "after" DB operation. All of them can raise exception to abort current operation.

Following code demonstrates the execution flow in auth gear:

```go=
// start DB transaction
txContext.BeginTx()

resp, err := handle(payload, &user)
if err != nil {
    response.Err = skyerr.MakeError(err)
    h.TxContext.RollbackTx()
    return response
}

err = hooks.ExecuteBeforeHooks(&user)
if err != nil {
    response.Err = skyerr.MakeError(err)
    h.TxContext.RollbackTx()
    return response
}

// DB operation
err = userStore.update(user)
if err != nil {
    response.Err = skyerr.MakeError(err)
    h.TxContext.RollbackTx()
    return response
}

err = hooks.ExecuteAfterHooks(user)
if err != nil {
    response.Err = skyerr.MakeError(err)
    h.TxContext.RollbackTx()
    return response
}

// DB commit
txContext.CommitTx();

response.Result = resp
return response
```

In `before_XXX_sync` and `before_XXX`, it may alter user metadata and user profile, on the contrary, `after_XXX_sync` and `after_XXX` won't support to alter user metadata and user profile.

Function signature of `before_XXX_sync` hooked Cloud Function is:

```javascript
const skygear = require('skygear');

/* 
 * user: user object to be saved
 * orgUser: original user object
 * currentUser: current exection user
 */
function before_XXX_sync(user, orgUser, currentUser) {
    console.log(user.profile.loveCat); // false
    
    // alter user profile
    user.profile.loveCat = true;
    
    /*
     * or rasie exception
     * throw new Error("some error");
     */

    // return updated user object
    return user;
}

module.exports = skygear.auth.before_XXX_sync(before_XXX_sync);
```

Function signature of `after_XXX` hooked Cloud Function is:

```javascript
const skygear = require('skygear');

/* 
 * user: user object to be saved
 * currentUser: current exection user
 */
function after_XXX(user, currentUser) {    
    console.log(body); // { "loveCat": false }
    console.log(user.profile.loveCat); // true
    
    /*
     * or rasie exception
     * throw new Error("some error");
     */
}

module.exports = skygear.auth.after_XXX(after_XXX);
```

Followings are hooks of auth actions:

| Action | Hooked Cloud Function |
| -------- | -------- |
| `signup` | `before_signup_sync(user, orgUser, currentUser)`<br/>`before_signup(user, orgUser, currentUser)`<br/>`after_signup_sync(user, currentUser)`<br/>`after_signup(user, currentUser)`<br/> |
| `login` | `before_login_sync(user, orgUser, currentUser)`<br/>`before_login(user, orgUser, currentUser)`<br/>`after_login_sync(user, currentUser)`<br/>`after_login(user, currentUser)` |
| `disable` | `before_disable_sync(user, orgUser, currentUser)`<br/>`before_disable(user, orgUser, currentUser)`<br/>`after_disable_sync(user, currentUser)`<br/>`after_disable(user, currentUser)` |
| `role` | `before_change_role_sync(user, orgUser, currentUser)`<br/>`before_change_role(user, orgUser, currentUser)`<br/>`after_change_role_sync(user, currentUser)`<br/>`after_change_role(user, currentUser)` |
| `logout` | `before_logout_sync(user, orgUser, currentUser)`<br/>`before_logout(user, orgUser, currentUser)`<br/>`after_logout_sync(user, currentUser)`<br/>`after_logout(user, currentUser)` |
| `password` | `before_change_password_sync(user, orgUser, currentUser)`<br/>`before_change_password(user, orgUser, currentUser)`<br/>`after_change_password_sync(user, currentUser)`<br/>`after_change_password(user, currentUser)` |
| `pasword` | `before_reset_password_sync(user, orgUser, currentUser)`<br/>`before_reset_password(user, orgUser, currentUser)`<br/>`after_reset_password_sync(user, currentUser)`<br/>`after_reset_password(user, currentUser)` |
| `verify` | `before_verified_sync(user, orgUser, currentUser)`<br/>`before_verified(user, orgUser, currentUser)`<br/>`after_verified_sync(user, currentUser)`<br/>`after_verified(user, currentUser)` |
| `update_user` | `before_update_user_sync(user, orgUser, currentUser)`<br/>`before_update_user(user, orgUser, currentUser)`<br/>`after_update_user_sync(user, currentUser)`<br/>`after_update_user(user, currentUser)` |

Note that, to avoid spiral request loop, it is forbidden to send request to auth gear in hooked Cloud Function.

## user metadata and user profile

For future advanced management requirements, auth gear should have user metadata, which is saved for common user properties, such as avatar, first name, last name, display name, preferred language, ..., etc. 

User metadata would be great help for better auth gear use experience, which allows to provide API response in preferred language, segment support, multi-lang custom email template.

User profile is for used for varied user properties, they differ from application to application, such as: ethnic, height, weight, hobby,..., etc.

```
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

CREATE TABLE _auth_user_metadata (
  user_id text REFERENCES _core_user(id),
  created_at timestamp without time zone NOT NULL,
  created_by text,
  updated_at timestamp without time zone NOT NULL,
  updated_by text,
  avatar_url text,
  first_name text,
  last_name text,
  display_name text,
  birthday imestamp without time zone,
  gender text,
  prefer_lang_id text REFERENCES _core_lang(id),
  ...
  PRIMARY KEY(user_id),
  UNIQUE (user_id)
);
```

The structure of user attributes could be:

```
{
    id: <id>,
    createdAt: <createdAt>,
    updatedAt: <updatedAt>,
    disabled: <disabled>,
    roles: [<role>, <role>, <role>, ...],
    metaData: {
        avatarUrl: <avatarUrl>,
        birthday: <birthday>,
        preferredLang: <preferredLang>,
        ...
    },
    profile: {
        // any other free form data
        ...
    }
}
```

## API gateway should add “current user” in request context

Since Cloud Function would indicate it is executed by authenticated user only, so API gateway may handle the authentication process, and generate "current user" context for both auth gear and Cloud Function. (Currently, API gateway didn't handle user authentication process, it is handled by auth gear middleware)

![](https://i.imgur.com/ohlsXTW.png)
1. SDK send Cloud Function request to API gateway.
2. API gateway check if the user is authenticated.
3. If the user is authenticated, API gateway routes the request to Cloud Function.

```javascript=
const skygear = require('skygear');

module.exports = (req, res) => {
    res.end("welcome " + req.context.user.email);
}
```

## Use cases: save user profile in Cloud Function DB after user signup

```javascript
const skygear = require('skygear');
const mongoClient = require('mongodb').MogoClient;

function after_signup(user, currentUser) {
    // connect to Cloud Function DB
    const secrets = req.context.secrets;
    const mongoUrl = 'mongodb://' + secrets.MONGODB_HOST + ':' + secrets.MONGODB_PORT + '/' + secrets.MONGODB_DBNAME;
    mongoClient.connect(mongoUrl, (err, db) => {
        if (err) {
            return;
        }
        
        // create Cloud Function user profile
        const profile = {
            id: user.id,
            birthday: user.metaData.birthday,
            avatar: user.metaData.avatarUrl,
            maritalStatus: user.profile.maritalStatus,
        };

        // cloud function could save user profile to Cloud Function's DB
        db.collection("users").insertOne(profile);
    });
}

module.exports = skygear.auth.after_signup(after_signup);
```

## Use cases: save updated user profile in Cloud Function DB

![](https://i.imgur.com/1uupx9O.png)

1. SDK sends `auth/update_user` request.

```javascript=
const currentUser = skygear.auth.currentUser;
currentUser.metadata.avatar = "http://example.com/a.jpg";
currentUser.profile.loveCat = false;
skygear.auth.updateUser(currentUser).then((user) => {
  console.log(user.profile.maritalStatus);
}, (error) => {
  console.error(error);
})
```

2. API gateway routes request to auth gear, and auth gear handles the request.
3. auth gear send `before_update_user_sync` request.
4. API gateway routes /after_save_user to Cloud Function.

```javascript
const skygear = require('skygear');

function before_update_user_sync(user, orgUser, currentUser) {    
    if (!user.profile.loveCat) {
        throw new Error("EVERYONE LOVES CAT");
    }
    
    return user;
}

module.exports = skygear.auth.before_update_user_sync(before_update_user_sync);
```
5. Cloud Function raise an error to abort the operation.
6. API gateway routes the result back to auth gear, and since Cloud Function aborts the operation, it will rollback DB and returns error from Cloud Function.

## Use case: auth gear as JWT provider

Since auth gear has the knowledge of user metadata and user profile, it could generate authenticated JWT token with custom claim support.

```
{
  "iss": "<iss>",
  "prn": "<prn>",
  "iat": <iat>,
  "exp": <exp>",
  "nce": "<nce>",
  
  "first_name" : "Firstname",
  "last_name" : "Lastname",
  "display_name" : "displayname", 
  "avatar_url" : "https://example.com/image.jpg"
}
```

## User listing in Cloud Function

For app's requirements, app could use Cloud Function to support its own user listing functionality if it creates its own user table and implement some hooks.

1. Developer creates `user` table hosted in Cloud Function DB.
2. Developer supports `after_signup` hooks.
3. Insert user data into `user` table in the hook.
4. Cloud Function could create its own query functionality with it's DB.

## [TBD] Use case: User Management Dashboard

Consider a dashboard, which provides general purpose user management functions. For normal application users, it should support:

- change avatar
- delete connected sessions
- update additional user information
- change password
- ...
 
For admin user, it should support:

- create user
- query users
- disable user
- send notification by user segment
- update additional user information
- reset user password
- ...

To support above functionalities, it would be provided by auth gear internally. It can connect auth gear DB directly, and no need to provide query interface to the public.

## [TBD] Auth UIKit

![](https://i.imgur.com/c4Vqk6G.png)

Consider skygear has a general purpose UIKit for user login/signup, the UI should response by following settings:

- auth criteria: username, email, phone number, ..., etc.
- auth protocols: SSO, LDAP, SAML, ..., etc.
- multi-factor authentication
- ...

![](https://i.imgur.com/0Rg7IOA.png)

It should be a separate service to handle such settings, and then Auth UIKit knows how to update its UI accordingly.
