# Background

Web-hooks would be used to notify external services of events in auth gear.


# Proposed Designs

## Events
Web-hook events are triggered when some mutating operation is performed by
auth gear.

Each operation will trigger two events: BEFORE and AFTER:
- BEFORE events would be triggered before the operation is performed; the
  operation can be failed by web-hook handler.
- AFTER events would be trigger after the operation is performed.

Both events has the same event payload.


## Delivery

The events would be delivered to web-hook handlers as an HTTP POST request to
the handler endpoint.

The handler endpoint can be specified as full URL or an absolute path. Absolute
paths will be resolved to full URL using an inferred URL scheme and authority:
- from HTTP request URL if the event is generated from it; otherwise,
- from the tenant configuration.

Each event type can have multiple handlers; the order of deliveries is
unspecified.

BEFORE events will always be delivered before AFTER events. BEFORE events will
be delivered in well-defined order during a request. AFTER events will be
delivered in unspecified order.

Web-hook handler must be idempotent.

Web-hook handler must return a status code within the 2XX range. Responding with
status code outside the range, including 3XX & 5XX, would be considered a
failed delivery.

The time spent in a delivery must not exceed 5 seconds, otherwise would be
considered a failed delivery.

### BEFORE Events

BEFORE events would be delivered to web-hook handlers synchronously.

Web-hook handler should respond with a JSON-formatted body to indicated whether
the operation should be failed, for example:
```json
// Allowed
{
    "is_allowed": true
}

// Disallowed
{
    "is_allowed": false,
    "reason": "the metadata does not match the required format.",
    "data": {
        "email": "invalid email format"
    }
}
```
If the operation is disallowed, a non-empty reason must be provided. Optional
additional information can be included. If any of the delievery responses
disallowed the operation, the operation is considered as failed, with the
disallowing reasons and additional information as part of the error. For example:
```json
{
    "error": {
        "name": "WebHookError",
        "code": 10000,
        "message": "Operation is disallowed by web-hook",
        "info": {
            "errors": [
                {
                    "reason": "the metadata does not match the required format.",
                    "data": {
                        "email": "invalid email format"
                    }
                }
            ]
        }
    }
}
```

The total time spent in all deliveries of the event must not exceed 10 seconds,
otherwise the operation would be considered failed.

All failed deliveries are marked as permanently failed and will not be retried.

The operation is considered as failed if any of the deliveries failed. A failed
operation would not trigger AFTER events.

### AFTER Events

AFTER events would be delivered to web-hook handlers asynchronously after the
operation is performed (i.e. commited into database).

All AFTER events, regardless whether handler is present, are presisted into
database, with minimum retention period of 30 days.

The response body of web-hook handler is ignored.

If any delivery failed, all deliveries will be retried after some time,
regardless whether some deliveries may succeed. The retry will be performed
with a variant of exponential back-off algorithm. If `Retry-After` HTTP header
is present in the response, the delivery will not be retried before the
specified time.

If the delivery continue to fail after 3 days from the time of first attempted
delivery, the event is marked as permanently failed and will not be retried
automatically.


## Event Management

### Alerts
If an event delivery is permanently failed, an ERROR level log entry is
generated to notify developers.

### Past Events
An API is provided to list past events. This API can be used to reconcile
self-managed database with the failed events.

> NOTE: BEFORE events are not persisted, regardless of success/failure.

### Manual Re-delivery
Developer can manually trigger a re-delivery of failed event, bypassing the
retry interval limit.

> NOTE: BEFORE events cannot be re-delivered.


## Security

Web-hook delivery process can be modeled as following:
```
 Int. Net. ┊    Internet    ┊      Internal Network
           ┊                ┊
 Auth Gear─┊─────┬──────────┊>Gateway────────────>Internal Handler
           ┊     │          └┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄
           ┊     └───────────>External Handler
```

Considering the authenticity, integrity and confidentiality of the process:

We assume `Gateway -> Internal Handler` data-path is secure with respect to
the mentioned 3 properties; the admins of internal network (e.g. cluster admin)
is responsible for its security.

To protect the data-paths `Auth Gear -> Gateway` and
`Auth Gear -> External Handler`, we provide some security measures:
- Require HTTPS: ensure integrity and confidentiality of the delivery
- Signed Request: ensure authenticity of the delivery

### HTTPS

We require all external web-hook handler HTTP endpoint to use HTTPS.

For internal handlers, network admin is responsible to ensure the request URL
passed to auth gear is secure.

### Signature

Each web-hook event request is signed with a secret key shared between auth
gear and web-hook handler. Developer must validate the signature and reject
requests with invalid signature to ensure the request is originated from auth
gear.

For the detail on signature generation and validation, refer to #300.

> For advanced end-to-end security scenario, some network admin may wish to
> use mTLS for authentication. We do not support this at the moment.


# Considerations

### Recursive Web-hooks

A ill-designed web-hook handlers may be called recursively. For example,
updating user metadata when handling `after_user_metadata_update` event.

Developer is responsible to ensure:
- web-hook handlers would not be called recursively; or
- recursive web-hook handlers have well-defined termination condition.

### Delivery Reliablity

The main purpose of web-hook in auth gear is to allowing external services
observe state changes in auth gear.

Therefore, AFTER events should be persistent, immutable, and delivered reliably;
otherwise, external services may observe inconsistent changes.

It is not recommended to perform side-effect in BEFORE event handlers;
otherwise, developer need to consider how to compensate for the side-effect for
possibility of operation failure.
In general, use cases that require BEFORE events may instead consider:
- use authorization policy to allow/deny request (TBD)
- wrap auth gear functions to validate requests

### Eventual Consistency

Fundamentally, auth gear with web-hooks is a distributed system.
When web-hook handlers have side-effects, we need to choose between guaranteeing
consistency or availability of the system.

We decided to ensure the availability of the system. To maintain consistency,
eventual consistency should be considered in system design.

Developer should regular check the past event list for unprocessed events to
ensure system consistency.

> We considered ensuring the consistency of the system through distributed
> transaction protocols (e.g. two-phase commit). However, its implementation
> requires much effort from both auth gear and web-hook handlers, and introduce
> a single point of failure (coordinator). We decided on availability instead.

### Event Timing
There are four possible delivery timing of events: sync BEFORE, async BEFORE,
sync AFTER, async AFTER.

Async BEFORE is mostly useless: the request may not be successful, and handler
cannot affect the operation. Therefore, we do not offer async BEFORE events.

Sync AFTER cannot be used safely:
- If it is not within the operation transaction, async AFTER can be used instead.
- If it is within the operation transaction,
  then the transaction should rollback on web-hook delivery failure,
  otherwise async AFTER can be used instead. So:
    - If the handler has no side-effect, sync BEFORE can be used instead
      (e.g. custom validation)
    - If the handler has side-effect, it is subject to distributed transaction
      problem. We use eventual consistency so async AFTER should be used.

Therefore, we do not offer sync AFTER events.

# Appendix

## [Web-hook Event Details](./events.md)
## [Web-hook Configuration](./config.md)
## [Web-hook Management API](./api.md)
## [Web-hook Use Cases](./use-cases.md)
