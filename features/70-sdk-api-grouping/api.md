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

var SampleItem = skygear.db.Record.extend('SampleItem');
var sampleItem = new SampleItem();
skygear.db.public.save(sampleItem);
```

```js
// Retreieve contexts

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
// Retreieve contexts
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
import io.skygear.skygear.db.Record;

Container container = Container.defaultContainer(Context.getApplicationContext());
container.auth().loginWithEmail("email@example.com", "secret");
container.auth().forgotPassword("email@example.com");
container.pubsub().subscribe("channel", new Pubsub.Handler());

Record sampleItem = new Record('SampleItem');
container.db().public().save(sampleItem, null);
```

```java
// Retreieve contexts
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
    saveUser
    whoami
    getUsersByEmail
    getUsersByUsername
    discoverUserByEmails
    discoverUserByUsernames
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
