# Structured Logging

## Feature Overview

* Support production logs filtering
* Show logs with color to make different kinds of log easier to see

## Requirements

* Support different filtering to make developer easier to discover the logs they want
    1. filter by log level
        - warning
        - error
        - info
        - debug
    1. filter by component
        - Server
        - Chat Plugin
        - CMS Plugin
        - Forgot Password Plugin
        - SSO Plugin
        - Cloud Code Functions (Default value of log functions, so user doesn't have to give too many argument when using log function in their code)
    1. filter by tag
        - db
        - request
        - handler
        - pubsub
        - Other with user input (User can defined their own tag if they use SDK provided logging functions to print log)
    1. All message / System logs or Errors
        - All message (No filter applied)
        - System logs or Errors (All logs sent out not in JSON format, including system logs or exceptions. If user use `print` or `console.log` without using SDK log function in their cloud function, those logs will also be shown here)

* A toggle to allow user group logs by request ID (Logs without request ID will not be shown when this is ON)

* Use color to make the log easier to see
    1. Different color based on log level

## Use cases

1. When developer is developing their own cloud code, they will only want to see the logs of their cloud code
    - Developer can define tag when calling logs function and filter by custom tag
    - If developer use print, console.log or their own logger, can choose `System logs or Errors`
2. For debugging error, developer will want to find the exceptions log easily
    - choose `System logs or Errors`
3. When their are multiple requests at the same time, now the logs are mixed up and makes the logs
difficult to read.
    - Enable group by request ID

## Implementation Details

### skygear-server, py-skygear, skygear-SDK-JS

- logger function to print structured logs
- Wrap exceptions to structured logs
- skygear-server create id per request and pass request id to plugin through context
- Refine all logs and reduce redundant logs in server and all skygear plugins
- Output JSON formatted logs on the skygear cloud. Output readable log when deployed in docker compose. Skygear Cloud can supply custom environment variable to enable this behavior.

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
    "time": 1521712900.511476,
    "level": "info", // debug / info / warn / error / critical
    "source": "server",  // server / py / js
    "component": "server", // server / chat / forgot_password / skygear_content_manager / skygear_sso
    "tag": "db", // db, request, handler, pubsub
    "request_id": "uuid",
    "message": "Executed SQL successfully with sql.Queryx",
    "fields": { // extra information of logs, optional
        "args": [],
        "error": "<nil>",
        "executionCount": 2,
        "sql": "SELECT record_type, record_field, user_role, writable, readable, comparable, discoverable FROM \"app_chatdemoapp\".\"_record_field_access\"",
    }
}
```

## Sample code

### Python logging usage

```py
import logging
from skygear.utils.context import current_request_id

logger = logging.getLogger(__name__)
logger.info('Executed SQL',
    extra={
        'request_id': current_request_id(),
        'component': 'chat',
        'tag': 'db',
        'fields': {
            "args": [],
            "sql": "SELECT record_type, record_field, user_role, writable, readable, comparable, discoverable FROM \"app_chatdemoapp\".\"_record_field_access\""
        }
    }
)
```

Support methods for logger
- .debug()
- .info()
- .warning()
- .error()
- .critical()


### JS logging usage

```
const skygearCloud = require('skygear/cloud');

skygearCloud.log.info('message', {
    'request_id': context.request_id,
    'component': 'chat',
    'tag': 'db',
    'fields': {
        "args": [],
        "sql": "SELECT record_type, record_field, user_role, writable, readable, comparable, discoverable FROM \"app_chatdemoapp\".\"_record_field_access\""
    }
});
```

We can also overwrite the native console method to print logs in structured format. The native console methods:
- debug
- info
- warn
- error
