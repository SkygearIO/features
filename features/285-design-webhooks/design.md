# next webhooks design

## Overview

skygear sends webhooks for events that happen in your app, and are designed to help a developer to monitor events, sync database, and many other use cases.

When one of events is triggered, skygear sends a HTTP POST with a payload to the webhook's configured URL.

## SYNC and ASYNC hooks

There are two types of webhook:

- `SYNC` - gear's operation will be blocked until a response is received. Gear should respect `SYNC` hook's response, if it indicates failed, operation should abort and return a formatted error response to the client.
- `ASYNC` - gear's operation won't be blocked and the response from the webhook is ignored.

## Request Headers

Following headers will be added to webhook POST request:

- `X-Skygear-Webhook-Req-ID`: an ID of the request.
- `X-Skygear-Webhook-Async`: if is a `async` hook, then the value is `TRUE` otherwise is `FALSE`. 
- `X-Skygear-Webhook-Signature`: a signature string of the webhook event, a develop should can verify the request by skygear's SDK or manually.

## Request Payload

Each event type has a payload which carries relevant information, and each payload data is defined by each gear.

All event payloads follows following payload format:

```json=
{
    "event": "event_name",
    "data": {
        "key_name_1": "event_data_key_value",
        "key_name_2": "event_data_key_value",
        ...,
    },
    "context": {
        "user": <current user object>,
        "req": {
            "path": "request_path",
            "body": <original_request_body>,
            "id": "request_id"
        }
    }
}
```

Note that, `context` is above format is still under discussion.

## Responding to a webhook

To acknowledge receipt of a webhook, webhook endpoint should return a 2xx HTTP status code. All response codes outside this range, including 3xx codes, will indicate to skygear the request is failed.

For some events, it may allow to webhook to modify changes (e.x. auth gear's before family hooks) when response code is 2xx. The behavior is defined by each gear, so will not be covered in this spec. Missing field in the return object means unmodified, so empty body is accepted. Another thing is gear will validate return object, if validation failed, gear should return an error to SDK.

Take auth gear as an example, its before family hooks accept that a hook returns a user object to modify current user object.

```javascript=
var express = require('express');
var bodyParser = require('body-parser');

var app = express();

app.use(bodyParser.json());

app.post('/before_signup', function(req, res){
    var user = req.body.data.user;

    user.metadata.loveCat = true;

    res.status(200);
    res.send(user);
});
```

If webhook wants to include additional information for an error case, it could return with payload:

| key | description | require |
| -------- | -------- | -------- | 
| `error` | [string] An error message. | ✓ |
| `code` | [number] An error code. |  |

example:

```
{
    "code": 1001,
    "message": "EVERYONE LOVES CAT!"
}
```

## Configure webhook

webhook deploy mechanism will be covered in spec, please refer next cli design for more information. Followings are some variables that are configurable when deploying a webhook.

| argument | description | require |
| -------- | -------- | -------- | 
| `events` | A list of gear events, such as: ["after_signup", "before_login"]. | ✓ |
| `url` | The url of the webhook. | ✓ |
| `async` | default is `true`. | |
| `secret` | default is empty, if provided, it will be used as the key to generate `X-Skygear-Webhook-Signature` digest. | |
| `timeout` | - default value of sync hook is 5 seconds, it allows to be configured up to 10 seconds.<br/>- default value of async hook is 60 seconds and up to 300 seconds.  | |

## versioning

Like skygear cloud functions, webhooks should be consider as a "moving part". So no mattter a user deploy webhooks by `skycli` or gear REST interface, a new app version should be created as well. Note that, a new app version and a new unit version will be generated when deploy by REST interface every time.

## Verify Request

When `secret` of a webhook is not empty, `X-Skygear-Webhook-Signature` will be added to request headers, it is the HMAC hex digest of the POST request payload. The digest is generated using the sha256 hash function and the hook `secret` as the key.

## Timeout

A `SYNC` hook is considered failed if it can't response within 5 seconds, where the value of timeout is configurable of each hook (up to 10 seconds).

For `ASYNC` hook, it is considered failed if it can't return within 60 seconds, where the value can be configured up to 300 seconds.

## Retry mechanism

If a `SYNC` hook got

- 503 Services Unavailable
- 429 Too Many Requests

The hook will wait certain amount of time, and retry again.
 
- When `Retry-After` header is presented, and the delay seconds is less than 30 seconds, the hook will respect the value and retry once.
- Or, the hook will retry after 5 seconds, at most 3 times.
