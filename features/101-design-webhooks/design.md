# WIP: next webhooks design

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
- `X-Skygear-Webhhok-Signature`: a signature string of the webhook event, a develop should can verify the request by skygear's SDK or manually.

## Request Payload

Each event type has a payload which carries relevant information, and each payload data is defined by each gear.

All event payloads follows following payload format:

```json=
{
    "event": "event_name",
    "data": {
        "key_name_1": "event_data_key_value",
        "key_name_2": "event_data_key_value",
        ...
    }
}
```

## Responding to a webhook

To acknowledge receipt of a webhook, webhook endpoint should return a 2xx HTTP status code. All response codes outside this range, including 3xx codes, will indicate to skygear the request is failed.

For some events, it may allow to webhook to modify changes (e.x. auth gear's before family hooks) when response code is 2xx. The behavior is defined by each gear, so will not be covered in this spec.

## Configure webhook

A gear should provide a REST interface for configuring webhooks, and a webhook is configured by following arguments:

| argument | description | require |
| -------- | -------- | -------- | 
| `events` | A list of gear events, such as: ["after_signup", "before_login"]. | ✓ |
| `url` | The url of the webhook. | ✓ |
| `async` | default is `true`. | |
| `secret` | default is empty, if provided, it will be used as the key to generate `X-Skygear-Webhhok-Signature` digest. | |


Each gear should provide following REST interfaces:

- `POST /:gear_name/hooks` - create hooks
- `GET /:gear_name/hooks` - get hooks
- `PATCH /:gear_name/hooks/:hook_id` - update a hook
- `DELETE /:gear_name/hooks/:hook_id` - delete a hook

### Usage example:

#### create hooks

```bash=
curl -X POST -H "Content-Type: application/json" \
-d @- http://localhost:3000/<gear name>/hooks <<EOF
[
    {
        "events": ["<name of the event>", "<name of the event>"],
        "url": "<url of the endpoint>",
        "async": true|false,
        "secret": "secret_string"
    },
    {
        "events": ["<name of the event>", "<name of the event>"],
        "url": "<url of the endpoint>",
        "async": true|false,
        "secret": "secret_string"
    },
]
EOF
[
    {
        "id": "<hook id>",
        "events": ["<name of the event>", "<name of the event>"],
        "url": "<url of the endpoint>",
        "async": true|false,
        "updated_at": "2019-01-06T20:39:23Z",
        "created_at": "2019-01-06T17:26:27Z"
    },
    {
        "id": "<hook id>",
        "events": ["<name of the event>", "<name of the event>"],
        "url": "<url of the endpoint>",
        "async": true|false,
        "updated_at": "2019-01-06T20:39:23Z",
        "created_at": "2019-01-06T17:26:27Z"
    },
]
```

#### get hooks

```bash=
curl http://localhost:3000/<gear name>/hooks
EOF
[
    {
        "id": "<hook id>",
        "events": ["<name of the event>", "<name of the event>"],
        "url": "<url of the endpoint>",
        "async": true|false,
        "updated_at": "2019-01-06T20:39:23Z",
        "created_at": "2019-01-06T17:26:27Z"
    },
    {
        "id": "<hook id>",
        "events": ["<name of the event>", "<name of the event>"],
        "url": "<url of the endpoint>",
        "async": true|false,
        "updated_at": "2019-01-06T20:39:23Z",
        "created_at": "2019-01-06T17:26:27Z"
    },
]
```

#### update a hook

```bash=
curl -X PATCH -H "Content-Type: application/json" \
-d @- http://localhost:3000/<gear name>/hooks/<hook id> <<EOF
{
    "events": ["<name of the event>", "<name of the event>"],
    "url": "<url of the endpoint>",
    "async": true|false,
    "secret": "secret_string"
}
EOF
{
    "id": "<hook id>",
    "events": ["<name of the event>", "<name of the event>"],
    "url": "<url of the endpoint>",
    "async": true|false,
    "updated_at": "2019-01-06T20:39:23Z",
    "created_at": "2019-01-06T17:26:27Z"
}
```

#### delete a hook

```bash=
curl -X DELETE -H "Content-Type: application/json" \
http://localhost:3000/<gear name>/hooks/<hook id>/delete 
EOF
{
     "result": "OK"
}
```

## Verify Request

When `secret` of a webhook is not empty, `X-Skygear-Webhhok-Signature` will be added to request headers, it is the HMAC hex digest of the POST request payload. The digest is generated using the sha256 hash function and the hook `secret` as the key.

## Timeout of a `SYNC` hook

A `SYNC` hook is considered failed if it can't response within 5 seconds.

## Retry mechanism

If a request got

- 503 Services Unavailable
- 429 Too Many Requests
 
webhook will retry after 5 seconds, at most total 3 times.

## TBD

- ~~Should webhook provide retry mechanism?~~
- Should have a limit number of hooks of a event?
- ~~Should support wildcard event (`*`, any time any event)?~~
- ~~Timeout of a `SYNC` hook.~~