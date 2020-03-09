**This document is obsoleted by #332**

## Feature Overview

Allow developer to integrate their authentication server with skygear server by logging in with custom token

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

### Sample Codes (Developer System)

Generate create token in developer system

**JS**

- Install [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)

```js
var jwt = require('jsonwebtoken');

var userID = "User id of your server";
var customTokenSecret = "CUSTOM_TOKEN_SECRET from portal";
var nowSeconds = Math.floor(Date.now() / 1000);

var token = jwt.sign({
  sub: userID,
  iat: nowSeconds,
  exp: nowSeconds + ( 60 * 60 ), // expire within 1 hour
  skyprofile: {
    email: "user@skygear.io",
    username: "user"
  }
}, customTokenSecret, { algorithm: 'HS256'});
```

**Python**

- Install [PyJWT](https://github.com/jpadilla/pyjwt)

```py
import jwt
import time

now_seconds = int(time.time())
user_id = "User id of your server"
custom_token_secret = "CUSTOM_TOKEN_SECRET from portal"

token = jwt.encode({
    'sub': user_id,
    'iat': now_seconds,
    'exp': now_seconds + ( 60 * 60 ), # expire within 1 hour
    'skyprofile': {
        'email': "user@skygear.io",
        'username': "user"
    }
}, custom_token_secret, algorithm='HS256')
```

**Rudy**

- Install [ruby-jwt](https://github.com/jwt/ruby-jwt)

```ruby
custom_token_secret = "CUSTOM_TOKEN_SECRET from portal"
user_id = "User id of your server"
now_seconds = Time.now.to_i

payload = {
    :sub => user_id,
    :iat => now_seconds,
    :exp => now_seconds + ( 60 * 60 ), # expire within 1 hour
    :skyprofile => {
      email: => "user@skygear.io",
      username: => "user"
    }
}

JWT.encode payload, custom_token_secret, "HS256"
```

**Java**

- Install [jjwt](https://github.com/jwtk/jjwt)

```java
String customTokenSecret = "CUSTOM_TOKEN_SECRET from portal";
String encodedSecret = new String(Base64.encode(customTokenSecret.getBytes(), Base64.DEFAULT));
String userId = "User id of your server";
Date now = new Date();
Date expiration = new Date(now.getTime() + 60 * 60 * 1000);

Claims claims = Jwts.claims()
        .setSubject(userId)
        .setIssuedAt(now)
        .setExpiration(expiration);
Map<String, String> profile = new HashMap<>();
profile.put("email", "user@skygear.io");
profile.put("username", "user");
claims.put("skyprofile", profile);

String token = Jwts.builder()
        .setClaims(claims)
        .signWith(SignatureAlgorithm.HS256, encodedSecret)
        .compact();
```

### List of APIs (Client)

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

## Implementation Details

### Changes on SDK

- Login with custom token for client side use in js, ios and android core sdk

### Changes on API at skygear-server

- New environment variable `CUSTOM_TOKEN_SECRET`
    - Value will be used in user's server and skygear server, user's server create the token and skygear server verify it
    - Need to be auto generated when create app in cloud
- New handler `sso:custom_token:login` for sdk call
    - Create skygear server token and login user
    - Create new user when not found
    - Will read the `skyprofile` in jwt token, create profile for signup, update profile for login

### Custom token claims (JWT)

| Claims                                 | Description |
|----------------------------------------|-------------|
| sub (Subject)                          | Developer system user unique identifier, string between 1-36 characters long (Required) |
| iat (Issued At)                        | The time at which the JWT was issued (Required) |
| exp (Expiration Time)                  | The expiration time on or after which the JWT MUST NOT be accepted for processing (Required) |
| skyprofile (Skygear user profile) | The user profile for signup, will be updated in login |

### Database Schema

New db table `_sso_custom_token`

- user_id (text): user reference of skygear sever
- principle_id (text): user identifier of user's sever
- _created_at (timestamp)
