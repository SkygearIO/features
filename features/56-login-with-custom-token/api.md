## Feature Overview

Allow user to integrate their authentication server to skygear server by logging in with custom token

## Guides

### Sample Codes (Client SDK)

**JS**

```js
skygear.auth.loginWithCustomToken("<custom_token>")
.then(function(skygearUser) {

}).catch(function(error) {

});
```

**iOS (swift)**

```swift
SKYContainer.default().auth.login(withCustomToken: "<custom_token>") { (user, error) in
    if error != nil {
        print("error login with custom token: \(error)")
        return
    }
    print("sign up successful")
    print("user record: \(user)")
    print("email: \(user!["email"])")
}
```

**Android (java)**

```java
skygear.getAuth().loginWithCustomToken("<custom_token>", new AuthResponseHandler() {
    @Override
    public void onAuthSuccess(Record user) {
        Log.i("Skygear loginWithCustomToken", "onAuthSuccess: Got token: " + user.getAccessToken());
    }

    @Override
    public void onAuthFail(Error error) {
        Log.e("Skygear loginWithCustomToken", "onAuthFail: Reason: " + error.getMessage());
    }
});
```

### Sample Codes (User's server)

1. Get the token secret from portal, and setup environment variable in your server `SKYGEAR_CUSTOM_TOKEN_SECRET`

2. Generate create token

**Python (With SDK)**

```python
from skygear.utils.auth import create_custom_token

custom_token = create_custom_token("your server user id", profile)

```

**Rudy (Without SDK)**

- Install [ruby-jwt](https://github.com/jwt/ruby-jwt)

```ruby
custom_token_secret = "Custom token secret from portal"
user_id = "unique identifier of user in your server, string between 1-36 characters long"
now_seconds = Time.now.to_i

payload = {
    :sub => user_id,
    :iat => now_seconds,
    :exp => now_seconds+(60*60), # expire within 1 hour
    :skygear_profile => {}
}

JWT.encode payload, custom_token_secret, "HS256"
```

### List of APIs (Client)

**py-skygear**

```
skygear.utils.auth.create_custom_token(principle_id, profile={})
```

**JS**

```js
skygear.auth.loginWithCustomToken(customToken: String): Promise<Record>
```

**iOS (swift)**

```obj-c
- (void)updateWithCustomToken:(NSString *)customToken
            completionHandler:(SKYContainerUserOperationActionCompletion _Nullable)completionHandler;
```

**Android (java)**

```java
public void loginWithCustomToken(java.lang.String customToken,
                                 AuthResponseHandler handler);
```

### List of APIs (User's server)

**py-skygear**

```
skygear.utils.auth.create_custom_token(principle_id, profile={})
```

**JS SDK**

```js
import { createCustomToken } from 'skygear-build/packages/skygear-core/lib/auth.js'

createCustomToken(principle_id: String, profile: Object)
```

## Implementation Details

### Changes on SDK

- Create custom token function for user server side use in py-skygear and js sdk, see sample code
- Login with custom token for client side use in js, ios and android core sdk

### Changes on API at skygear-server

- New environment variable `CUSTOM_TOKEN_SECRET`
    - Value will be used in user's server and skygear server, user's server create the token and skygear server verify it
    - Need to be auto generated when create app in cloud
- New handler `sso:custom_token:login` for sdk call
    - Create skygear server token and login user
    - Create new user when not found
    - Will read the `skygear_profile` in jwt token, create profile for signup, update profile for login

### Custom token claims (JWT)

| Claims                                 | Description |
|----------------------------------------|-------------|
| sub (Subject)                          | Unique identifier of user in user's server, string between 1-36 characters long (Required) |
| iat (Issued At)                        | The time at which the JWT was issued (Required) |
| exp (Expiration Time)                  | The expiration time on or after which the JWT MUST NOT be accepted for processing (Required) |
| skygear_profile (Skygear user profile) | The user profile |

### Database Schema

New db table `_sso_custom_token`

- user_id (text): user reference of skygear sever
- principle_id (text): user identifier of user's sever
- _created_at (timestamp)
