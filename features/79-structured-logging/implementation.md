# Implementation

### skygear-server

- Log function to print structured logs
- skygear-server create id per request and pass request id to plugin through context
- Review all logs and add tag by its functional group (auth, push, pubsub ..etc)
- Output JSON formatted logs on the skygear cloud. Output readable log when deployed in docker compose. Skygear Cloud can supply custom environment variable to enable this behavior.

#### py-skygear, skygear-SDK-JS

- Log function to print structured logs
- Inject request id when printing structured logs
- Review all logs and reduce redundant logs in all plugins, adding corresponding plugin tag
- Output JSON formatted logs on the skygear cloud. Output readable log when deployed in docker compose. Skygear Cloud can supply custom environment variable to enable this behavior.

### Portal

- Filtering will be done in client side
- Group logs by request ID option, those logs without request id will not be shown in this mode
- With log level coloring
- Increase logs size (Current: 1000)

### skycli

- Filtering will be done in client side, filters are passed by arguments
- With log level coloring

```sh
skycli logs

Options:
  --level       Apply log level filter, comma separated. Support values: debug,info,warning,error,critical
  --process     Apply process filter, comma separated. Support values: skygear-server,python,js
  --tag         Apply tag filter, comma separated. Support values: request,auth,db,pubsub,push,auth_plugin,chat_plugin,cms_plugin,sso_plugin,user,others

Examples:
  # select skygear server logs and log level is debug
  skycli --level=debug --process=skygear-server logs

  # select cms and error logs
  skycli --tag=cms,others logs

  # select cloud functions logs which use py logger
  skycli --tag=others logs

  # select cloud functions logs (Unstructured logs + logs with `tag=user`)
  skycli --tag=others logs
````

### Cloud

- Need to be able to retrieve logs from completed pod

### Structured log format

```js
{
    "time": "2018-04-26T03:09:18.279977682Z",
    "level": "info", // debug / info / warn / error / critical
    "process": "server",  // skygear-server / python / js
    "tag": "db", // request / auth / db / pubsub / push / auth_plugin / chat_plugin / cms_plugin / sso_plugin / user
    "request_id": "uuid",
    "message": "Executed SQL successfully with sql.Queryx",
    "extra": { // extra information of logs, optional
        "args": [],
        "error": "<nil>",
        "executionCount": 2,
        "sql": "SELECT record_type, record_field, user_role, writable, readable, comparable, discoverable FROM \"app_chatdemoapp\".\"_record_field_access\"",
    }
}
```

### Python log function

- We can use filter to inject current request id and tag. When py receive a lambda call. We can set tag to the thread-local variable. Use filter to get and inject the tag. For user cloud functions, we can use `tag=user` by default. [About log filter](https://docs.python.org/3/howto/logging-cookbook.html#using-filters-to-impart-contextual-information)



```py
import logging

logger = logging.getLogger(__name__)
logger.info('Executed SQL',
    extra={
        "args": [],
        "sql": "SELECT record_type, record_field, user_role, writable, readable, comparable, discoverable FROM \"app_chatdemoapp\".\"_record_field_access\""
    }
)
```

Support methods for logger
- .debug()
- .info()
- .warning()
- .error()
- .critical()


### JS log function

- Use https://github.com/winstonjs/winston

```
const skygearCloud = require('skygear/cloud');

skygearCloud
  .log
  .context(context)
  .tag('db')
  .info('test message %s, %s', 'first', 'second', {
    "args": [],
    "sql": "SELECT record_type, record_field, user_role, writable, readable, comparable, discoverable FROM \"app_chatdemoapp\".\"_record_field_access\""
});
```

We can also overwrite the native console method to print logs in structured format. The native console methods:
- debug
- info
- warn
- error
