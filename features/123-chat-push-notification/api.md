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
2. Update Skygear server to support new payload.
3. Update Skygear SDK to support new payload.

## New Payload

The following is the proposed payload.

### Main Payload

Main Payload is a collection of payloads.

- Payload `platform` contains platform specific information.

- Payload `message` contains push notification shared among platforms so that developers do not need to include the same key-value in different payloads.

- Payload `data` contains custom data definied by developers


|key | type |description           |default|
|----|------|----------------------|-------|
|platform|dict|See platform payload|null|
|message|dict|See message payload|null|
|data|dict|Custom dictionary by developer|null|


### Platform Payload

|key|type|description|default|
|---|----|-----------|-------|
|android|dict|Contains android specific settings| null|
|ios|dict|Contains iOS specific settings|null|

* Each dictionary can have `enable` flag, if it is `false`, push notification will be disabled. For example,

```json
{
	"message": {
		"title": "Hello Rick",
		"subtitle": "Rick is working at ourksy.",
		"priority": "normal",
		"body": "Ditto",
		"ttl": 99999
	},
	"platform": {
		"android": {
			"enabled": false
		}
	}
}
```
In the above JSON, android devices will not receive a push message as GCM is disabled.

### Message Payload

|key|type|description|default|
|---|----|-----------|-------|
|body|string|message body|null|
|title|string|message title|null|
|subtitle|string|message subtitle|null|
|priority|string|priority of message, "normal" or "high"|"normal"|
|ttl|int|time to live in seconds| 2419200 (4 weeks)|

* `priority` in GCM is "normal" and "high", which are 5 and 10 in iOS respectively.

* `priority` and `ttl` need to be sent in HTTP header in APNS, not in payload.

#### Example Skygear Push Notification Payload

```json
{
	"message": {
		"title": "Hello Rick",
		"subtitle": "Rick is working at ourksy.",
		"priority": "normal",
		"body": "Ditto",
		"ttl": 99999
	},
	"platform": {
		"ios": {
			"alert": {
				"action-loc-key": "PLAY"
			},
			"badge": 5
		},
		"android": {
			"collapse_key": "demo",
			"notification": {
				"icon": "a.png"
			}
		}
	},
	"data": {
		"for": "bar",
		"source": ["alice", "bob"]
	}
}
```

### Generating GCM Payload from Skygear Push Notification Payload

1. Generate Basic GCM Payload from `message` payload.

```json
{
	"notification": {
		"title": "Hello Rick",
		"body": "Ditto",
		"subtitle": "Rick is working at ourksy."
	},
	"time_to_live": 99999,
	"priority": "normal"
}
```

2. Inject `data` payload

```json
{
	"notification": {
		"title": "Hello Rick",
		"body": "Ditto",
		"subtitle": "Rick is working at ourksy."
	},
	"time_to_live": 99999,
	"priority": "normal",
	"data": {
		"for": "bar",
		"source": ["alice", "bob"]
	}
}
```

3. Merge with `android` dict in `platform`

```json
{
	"notification": {
		"title": "Hello Rick",
		"body": "Ditto",
		"subtitle": "Rick is working at ourksy.",
		"icon": "a.png"
	},
	"collapse_key": "demo",
	"time_to_live": 99999,
	"priority": "normal",
	"data": {
		"for": "bar",
		"source": ["alice", "bob"]
	}
}
```


### Generating APNS Payload from Skygear Push Notification Payload

1. Generate Basic APNS Payload from `mesage` payload.

```json
{
	"aps": {
		"alert": {
			"title": "Hello Rick",
			"body": "Bob wants to play poker",
			"subtitle": "Rick is working at ourksy."
		}
	}
}
```

2. Inject `data` payload

```json
{
	"aps": {
		"alert": {
			"title": "Hello Rick",
			"body": "Bob wants to play poker",
			"subtitle": "Rick is working at ourksy."
		}
	},
	"for": "bar",
	"source": ["alice", "bob"]
}
```

3. Merge with `iOS` dict in `platform`

```json
{
	"aps": {
		"alert": {
			"title": "Hello Rick",
			"body": "Bob wants to play poker",
			"subtitle": "Rick is working at ourksy.",
			"action-loc-key": "PLAY"
		},
		"badge": 5
	},
	"for": "bar",
	"source": ["alice", "bob"]
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

1. Backward Comptabile, Skygear server needs to support both the existing and the new payload. 
2. Server server response remains unchanged.
3. Generate GCM payload and APNS payload accordingly.
4. Send `apns-priority` and `apns-priority` when sending iOS push notification (https://developer.apple.com/library/content/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/CommunicatingwithAPNs.html)
