# Structured Logging

## Feature Overview

* Support production logs filtering
* Show logs with color to make different kinds of log easier to see

## Requirements

* Support different filtering to make developer easier to discover the logs they want
    1. filter by log level (log level: warning, error, info, debug)
    1. filter by source
    1. filter by tag (Self defined tags, e.g. Server: db, request, handler..., Py, JS: plugin name)
    1. group by request ID

* Use color to make the log easier to see
    1. Different color based on log level


## Implementation Details

### skygear-server, py-skygear, skygear-SDK-JS

- logger function to print structured logs
- Wrap exceptions to structured logs
- skygear-server create id per request and pass request id to plugin through context
- Refine all logs and reduce redundant logs in server and all skygear plugins

### Portal

- Filtering will be done in client side
- Group logs by request ID option, those logs without request id will not be shown in this mode
- With log level coloring
- Increase logs size (Current: 1000)

### skycli

- Filtering will be done in client side, filters are passed by arguments

    `skycli --tail 1000 --filters level=info --filters source=server logs`

- With log level coloring

### Cloud

- Need to be able to retrieve logs from completed pod

## Structured log format

```js
{
    "time": 1521712900,
    "level": "info", // debug / info / warn / error / panic / fatal
    "tag": "db", // 
    "source": "server",  // server / py / js
    "request_id": "uuid",
    "message": "Executed SQL successfully with sql.Queryx",
    "fields": {          // extra information of logs, optional
        "args": [],
        "error": "<nil>",
        "executionCount": 2,
        "sql": "SELECT record_type, record_field, user_role, writable, readable, comparable, discoverable FROM \"app_chatdemoapp\".\"_record_field_access\"",
    }
}
```
