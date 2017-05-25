# API Design Overview

Re-organize API of different functionality to different groups, from the current `Container` object in each SDK.

## Goal

- API and context of different features are grouped to new objects under `Container` object.
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

Proposal:

```
Package: /

  Container:

    state:
      url
      apiKey
      auth(AuthContainer)
      user(UserContainer)
      db(DatabaseContainer)
      device(DeviceContainer)
      pubsub(PubsubContainer)

    api:
      config
      configApiKey
      lambda

  Error:

  _Private(can be part of Container):

    state:
      timeoutOptions

    api:
      makeUploadAssetRequest
      sendRequestObject
      makeRequest


Package: /auth

  AuthContainer:

    state:
      accessToken

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


Package: /user

  UserContainer:

    state:
      user
      relation(RelationContainer)

    api:
      saveUser
      whoami
      getUsersByEmail
      getUsersByUsername
      discoverUserByEmails
      discoverUserByUsernames

  User:

  RelationContainer:

    api:
      queryFriend
      queryFollower
      queryFollowing
      add
      remove


Package: /db

  DatabaseContainer:

    state:
      publicDB(Database)
      privateDB(Database)
      cacheResponse(Boolean)

    api:
      setAdminRole
      setDefaultRole
      getDefaultACL
      setDefaultACL
      setRecordCreateAccess
      setRecordDefaultAccess

  Database:

    state:
      cacheStore

    api:
      getRecordByID
      save
      query
      del
      clearCache

  Record:

  Query:

  User:

  Role:

  ACL:

  Sequence:

  Asset:

  Reference:

  Geolocation:

  Subscription:


Package: /device

  DeviceContainer:

    state:
      deviceToken
      deviceID

    api:
      inferDeviceType
      registerDevice
      unregisterDevice


Package: /pubsub

  PubsubContainer:

    state:
      channel
      internalChannel
      autoPubsub(Boolean)

    api:
      on
      off


Package: /cloud


```
