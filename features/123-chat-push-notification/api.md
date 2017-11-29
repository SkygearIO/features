# Push Notification API
## Feature Overview

This features simplifies calling push notification API in both cloud function and client app via

1. Unifiying common parameters across platform and
2. Provide custom parameter for specific platform


Supported Push Notification Platform:

1. Android
2. iOS

## Task

1. Define new payload format
2. Update skygear server to support new payload.

## New Payload

The following is the proposed payload.

### Main Payload

Main Payload is a collection of payloads.

|key | type |description           |default|
|----|------|----------------------|-------|
|platform|dict|See platform payload|null|
|message|dict|See message payload|null|
|data|dict|Custom dictionary by developer|null|
|custom|dict|See custom payload|null|
|dry\_run|boolean|dry run only if true|false|



### Platform Payload

|key | type |description|default|
|----|------|-----------|-------|
|android|boolean|send to android device if true|true|
|ios|boolean|send to android device if true|true|

### Message Payload

|key|type|description|default|
|---|----|-----------|-------|
|body|string|message body|null|
|title|string|message title|null|
|subtitle|string|message subtitle|null|
|sound|string|message sound|null|
|title\_loc\_key|string|key to localized string|null|
|title\_loc\_args|list of string|arguments of string replacement of title\_loc\_key|null|
|priority|string|priority of message|"normal"|
|expiry|int|time to live in seconds| 2419200 (4 weeks)|


### Custom Payload
|key|type|description|default|
|---|----|-----------|-------|
|android\_channel\_id|string| |null|
|android\_click\_action|string| |null|
|android\_body\_loc\_key\_action|string| |null|
|android\_body\_loc\_key\_args|string| |null|
|android\_led\_color|string| |null|
|android\_icon|string| |null|
|ios\_badge|integer| |null|
|ios\_content\_available|boolean| |null|
|ios\_mutable\_content|boolean| |null|
|ios\_launch\_image|string| |null|
|ios\_category|string| |null|



## Implementation Details



### Changes on SDK
1. SDK needs to provide with simple interface for minimal push notification.


Sample Interface:

```javascript
function sendToUser(users, payload)
```

Sample Call:
```javascript

function sendToUser(users, {
  'message': {
    'title': 'Hello World',
    'body': 'Hello from oursky.'
  }
});
```

2. SDK supports `users` in either list of user ids and list of user objects.
3. SDK (in Android and iOS) should have payload builder class for auto complete.

### Changes on API at skygear-server

1. Backward Comptabile? (support old payload)
2. Send push notification message according to payload
3. Server response remains unchanged.
