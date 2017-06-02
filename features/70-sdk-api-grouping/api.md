# API Design Overview

Re-organize API of different functionality to different groups, from the current `Container` object in each SDK.

## Goal

- Split the current `Container` to smaller containers, by different features
- Effort of using skygear should remain the same, no extra setup is required.
- Feature set remains the same.

# Sample Codes for Use Cases

## Javascript

```js
// Call API

var skygear = require('skygear');
// import skygear from 'skygear';

skygear.auth.loginWithEmail("email@example.com", "secret");
skygear.auth.forgotPassword("email@example.com");
skygear.pubsub.on("channel", function() {});

var SampleItem = skygear.Record.extend('SampleItem');
var sampleItem = new SampleItem();
skygear.db.public.save(sampleItem);
```

```js
// Retrieve contexts

var apiKey = skygear.apiKey;
var currentAccessToken = skygear.auth.currentAccessToken;
var publicDBCache = skygear.db.public.cache;
```

## Objective-C

```obj-c
// Call API
#import <SKYKit/SKYKit.h>

SKYContainer *container = [SKYContainer defaultContainer];
[container.auth loginWithEmail:@"email@example.com" password:@"secret" completion:nil];
[container.auth forgotPasswordWithEmail:@"email@example.com" completion:nil];
[container.pubsub subscribeTo:"channel" handler:nil];

SKYRecord *sampleItem = [SKYRecord recordWithRecordType:@"SampleItem"];
[container.db.public saveRecord:sampleItem completion:nil];
```

```obj-c
// Retrieve contexts
#import <SKYKit/SKYKit.h>

SKYContainer *container = [SKYContainer defaultContainer];
NSString *apiKey = [container apiKey];
NSString *currentAccessToken = [container.auth currentAccessToken];
NSDictionary *publicDBCache = [container.db.public cache];
```

## Java

```java
// Call API
import android.content.Context;
import io.skygear.skygear.Container;
import io.skygear.skygear.Record;

Container container = Container.defaultContainer(Context.getApplicationContext());
container.auth().loginWithEmail("email@example.com", "secret");
container.auth().forgotPassword("email@example.com");
container.pubsub().subscribe("channel", new Pubsub.Handler());

Record sampleItem = new Record('SampleItem');
container.db().public().save(sampleItem, null);
```

```java
// Retrieve contexts
import android.content.Context;
import io.skygear.skygear.Container;

Container container = Container.defaultContainer(Context.getApplicationContext());
String apiKey = container.apiKey();
String currentAccessToken = container.auth().currentAccessToken();
Map publicDBCache = container.db().public().cache();
```

# Changes on SDK

## Web (Base)

```
Container:

  state:
    url
    apiKey
    timeoutOptions
    auth(AuthContainer)
    relation(RelationContainer)
    db(DatabaseContainer)
    pubsub(PubsubContainer)
    push(PushContainer)
    chat(ChatContainer)
    analytics(AnalyticsContainer)

  api:
    config
    configApiKey
    lambda
    sendRequestObject
    makeRequest


AuthContainer:

  state:
    accessToken
    user(User)

  api:
    signupWithUsername
    signupWithEmail
    signupWithUsernameAndProfile
    signupWithEmailAndProfile
    signupAnonymously
    loginWithUsername
    loginWithEmail
    loginWithProvider
    logout
    changePassword
    forgotPassword
    // following api would be affected by https://github.com/SkygearIO/features/pull/68
    saveUser
    whoami
    getUsersByEmail
    getUsersByUsername
    discoverUserByEmails
    discoverUserByUsernames


RelationContainer:

  api:
    queryFriend
    queryFollower
    queryFollowing
    addRelation
    removeRelation


DatabaseContainer:

  state:
    public(PublicDatabase)
    private(PrivateDatabase)
    cacheResponse(Boolean)

  api:
    makeUploadAssetRequest


PublicDatabase:

  state:
    cacheStore

  api:
    setAdminRole
    setDefaultRole
    getDefaultACL
    setDefaultACL
    setRecordCreateAccess
    setRecordDefaultAccess
    getRecordByID
    save
    query
    del
    clearCache
    fetchSubscriptionWithID
    saveSubscription
    deleteSubscriptionWithID


PrivateDatabase:

  state:
    cacheStore

  api:
    getRecordByID
    save
    query
    del
    clearCache
    fetchSubscriptionWithID
    saveSubscription
    deleteSubscriptionWithID


PubsubContainer:

  state:
    channel
    internalChannel
    autoPubsub(Boolean)

  api:
    on
    off


PushContainer:

  api:
    sendPushNotification


ChatContainer:


AnalyticsContainer:


```

## Cloud

```
Container:

  state:
    cloud(CloudContainer)


CloudContainer:

  api:
    op
    every
    event
    handler
    hook
    beforeSave
    afterSave
    beforeDelete
    afterDelete
    staticAsset
    configModule

```

## Mobile (react-native, iOS and Android)

```
PushContainer:

  state:
    deviceToken
    deviceID

  api:
    registerDevice
    unregisterDevice
```

### Javascript (react-native)

```
PushContainer:

  api:
    inferDeviceType
```

## Importing `class`

### Javascript

For easier class import in Javascript, classes are proxied in the skygear container object. These classes already exist in skygear container object.

```
User
Record
UserRecord
Query
User
Role
ACL
Sequence
Asset
Reference
Geolocation
Subscription
Database
ErrorCodes(Constants)
```

For consistency, the following class would also be moved to skygear container.

```
skygear.relation.Friend -> skygear.FriendRelation
skygear.relation.Follower -> skygear.FollowerRelation
skygear.relation.Following -> skygear.FollowingRelation
```

### Others

Importing classes in other languages would remain the same.

iOS:
```obj-c
#import <SKYKit/SKYKit.h>
```

Java:
```java
import io.skygear.skygear.Container;
import io.skygear.skygear.Record;
```

# Example of other sdk

## Firebase

Grouping:
- firebase
- firebase.app
- firebase.auth
  - Provide authentication methods
  - Firebase User has a fixed set of basic properties, custom data of user are stored somewhere else (database)
- firebase.database
  - stores JSON application data
- firebase.messaging
- firebase.storage
  - Cloud Storage is built for app developers who need to store and serve user-generated content, such as photos or videos.

Javascript:
```js
firebase.initializeApp(defaultAppConfig);
var app = firebase.app();
var auth = app.auth;
var database = app.database;

var defaultAuth = firebase.auth();
firebase.auth().createUserWithEmailAndPassword(email, password).catch(function(error) {
  // Handle Errors here.
  var errorCode = error.code;
  var errorMessage = error.message;
  // ...
});
```

Objective-C:
```obj-c
[FIRApp configure];
FIRApp *app = [FIRApp defaultApp];

// sign up
[[FIRAuth auth] createUserWithEmail:email
                           password:password
                         completion:^(FIRUser *_Nullable user, NSError *_Nullable error) {
  // ...
}];

// longer version of [FIRAuth auth]
FIRApp *defaultApp = [FIRApp defaultApp];
[FIRAuth authWithApp:defaultApp];
```

Java:
```java
// sign up
FirebaseAuth mAuth = FirebaseAuth.getInstance();
mAuth.createUserWithEmailAndPassword(email, password)
        .addOnCompleteListener(this, new OnCompleteListener<AuthResult>() {
            @Override
            public void onComplete(@NonNull Task<AuthResult> task) {
                if (task.isSuccessful()) {
                    // Sign in success, update UI with the signed-in user's information
                    Log.d(TAG, "createUserWithEmail:success");
                    FirebaseUser user = mAuth.getCurrentUser();
                    updateUI(user);
                } else {
                    // If sign in fails, display a message to the user.
                    Log.w(TAG, "createUserWithEmail:failure", task.getException());
                    Toast.makeText(EmailPasswordActivity.this, "Authentication failed.",
                            Toast.LENGTH_SHORT).show();
                    updateUI(null);
                }

                // ...
            }
        });
```

Note that, you can get the group from `firebase` in JS, while in ObjC and Java, you have to retrieve the group from the group class static method.


## Backendless

see: https://backendless.com/docs/js/doc.html

Grouping:
- Backendless.UserService (auth)
  - user and data can be used together, see: https://backendless.com/docs/js/doc.html#creating-user-to-geo
- Backendless.Data (database)
- Backendless.Messaging (pubsub + push + email)
- Backendless.Files
- Backendless.Geo
- Backendless.Logging
- Backendless.Cache
- Backendless.Counters (atomic counters api)
  - Backendless.Counters.incrementAndGet("my counter");

Javascript:
```js
function userRegistered( user )
{
  console.log( "user has been registered" );
}

function gotError( err ) // see more on error handling
{
  console.log( "error message - " + err.message );
  console.log( "error code - " + err.statusCode );
}

var user = new Backendless.User();
user.email = "james.bond@mi6.co.uk";
user.password = "iAmWatchingU";

Backendless.UserService.register( user ).then( userRegistered ).catch( gotError );
```

Objective-C:
```obj-c
    BackendlessUser *user = [BackendlessUser new];
    [user setProperty:@"email" object:@"james.bond@mi6.co.uk"];
    [user setPassword:@"iAmWatchingU"];
    [backendless.userService registerUser:user
               response:^(BackendlessUser *registeredUser) {
                 NSLog(@"User registered: %@", [registeredUser valueForKey:@"email"]);
               }
               error:^(Fault *fault) {
                 NSLog(@"Server reported an error: %@", fault.description);
               }];
```

Java:
```java
BackendlessUser user = new BackendlessUser();
user.setProperty( "email", "james.bond@mi6.co.uk" );
user.setPassword( "iAmWatchingU" );

Backendless.UserService.register( user, new AsyncCallback<BackendlessUser>()
{
  public void handleResponse( BackendlessUser registeredUser )
  {
    // user has been registered and now can login
  }

  public void handleFault( BackendlessFault fault )
  {
    // an error has occurred, the error code can be retrieved with fault.getCode()
  }
} );
```
