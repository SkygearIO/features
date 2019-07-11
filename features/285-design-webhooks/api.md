# Event Management APIs

These API are intended to be consumed at server-side (e.g. in a cron job), no
client SDK API is provided.

## GET /_auth/events

This API returns a list of past events. This is a privileged operation; user
must be authenticated using master key.

Query parameters:
- `cursor`: event sequence number, optional;
            fetch events generated after the specified sequence number.
            If omitted, fetch oldest events.
- `limit`: integer, optional, must be within range [1, 20];
           limit the number of events returned.

Response:
```json
{
    "events": [
        { 
            "status": "success",
            "payload": { /* ... */ }
        },
        { 
            "status": "failed",
            "payload": { /* ... */ }
        }
    ]
}
```
- `events`: a list of events
- `status`: the delivery status of the event, can be one of:
    - `pending`: the event is pending for delivery
    - `retrying`: the event is failed to deliver, will be automatically retried later
    - `failed`: the event is permanently failed, will not be automatically retried
    - `success`: the event is delivered successfully


## POST /_auth/events/{event_id}/retry

This API retries the delivery of specified event. This is a privileged
operation; user must be authenticated using master key.

If the event is not in one of the failed statuses (`retrying`/`failed`),
the API will fail.
