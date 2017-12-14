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
|priority|string|priority of message|"normal"|
|ttl|int|time to live in seconds| 2419200 (4 weeks)|


### Custom Payload
|key|type|description|default|
|---|----|-----------|-------|
|android\_channel\_id|string| |null|
|android\_click\_action|string| |null|
|android\_body\_loc\_key\_action|string| |null|
|android\_body\_loc\_key\_args|string| |null|
|android\_led\_color|string| |null|
|android\_icon|string| |null|
|android_sound|string|message sound|null|
|ios\_badge|integer| |null|
|ios\_content\_available|boolean| |null|
|ios\_mutable\_content|boolean| |null|
|ios\_launch\_image|string| |null|
|ios\_category|string| |null|
|ios_sound|string|message sound|null|
|android_title\_loc\_key|string|key to localized string|null|
|android_title\_loc\_args|list of string|arguments of string replacement of title\_loc\_key|null|
|ios_title\_loc\_key|string|key to localized string|null|
|ios_title\_loc\_args|list of string|arguments of string replacement of title\_loc\_key|null|
|ios\_action\_loc\_key|string|key to action|null|
|ios\_loc\_key|string|key to message string in Localizable.strings|null|
|ios\_loc\_args|string|Variable string values to appear in place of the format specifiers in loc-key.|null|

#### Example Push Notification Payload

```json
{
  "message": {
    "title": "Hello Rick",
    "body": "Ditto",
    "ttl": 99999
  },
  "custom": {
    "android_sound": "wakeup.mp3",
    "android_icon": "icon-1",
    "ios_sound": "wakeup.m4a",
    "ios_badge": 1,
    "ios_launch_image": "launch.png",
    "ios_category": "general"
  }
}
```

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
