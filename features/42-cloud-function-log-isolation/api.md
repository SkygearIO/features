# Client-invoked cloud function

## Overview

The purpose of client-invoked cloud function is to allow cloud function to be
tested by directly invoking cloud function rather than having the cloud function
called indirectly through the existing Skygear Server API.

Cloud function is always called by the Skygear Server using plugin transport,
and this proposal does not aim to change that. Cloud function are are called by
the Server when certain events are triggered in the Server, such as before
saving a record or cron job. Lambda and hander is called when the Server
receives a Skygear API call from the client.

In order to test the input and output of cloud function, this proposal suggests
a new Skygear Server API action that calls any cloud function by passing all
request and response parameters to/from plugin transport. It is not otherwise
possible to test some cloud function such as cron job.

This proposal also suggest changes to plugin transport in order to support cloud
function testing.

## Server API Changes

The following APIs requires master key. API parameters that are common to all
Skygear API are not listed here.

### Listing cloud functions

When calling this action, Skygear Server returns a list of all cloud functions
that can be invoked from the client side. Currently the following cloud
function types are invocable: hook, timer and lambda. More design is
needed to support auth provider because it is consist of multiple functions.
Handler can be invoked directly by calling the handler.

On the server side, the list of all cloud function is stored in a struct
called `registrationInfo`. The `registrationInfo` is per-plugin. But
the result from `cloudfunc:list` should aggregate info from all plugins.

Request:

```json
{
  "action": "cloudfunc:list"
}
```

Response:

```json
{
  "result": { /* same as registrationInfo */
    "hook": [
      { /* same as pluginHookInfo */
        "name": "hook_name",
        "type": "note",
        "trigger": "before_save"
        "async": true
      }
    ],
    "handler": [
      { /* same as pluginHandlerInfo */
        "auth_required": true,
        "name": "handler_name",
        "methods": ["POST", "GET"],
        "key_required": true,
        "user_required": true
      }
    ] 
    "op": [
      { /* same as map[string]interface{} in registrationInfo.Lambdas */
        /* TODO */
      }
    ] 
    "timer": [
      {
        "name": "",
        "spec": ""
      }
    ] 
    "provider": [
      {
        "type": "",
        "name": ""
      }
    ] 
  }
}
```

### Invoke cloud function

When calling this action, Skygear Server creates a plugin request struct and
pass it to the plugin transport. This action returns to the client with data
received from the plugin transport. 

Request:

```json
{
  "action": "cloudfunc:invoke",
  "func": {
    "kind": "hook",
    "name": "hook_name",
    "type": "note",  /* only for db hook */
    "trigger": "before_save"  /* only for db hook */
  }
  "param": {
    /* the param is specific to the cloud function */
  }
}
```

Response:

```json
{
  "result": {
    "response": {
      /* the response is specific to the cloud function */
    }
  }
}
```

## Client SDK Changes

The client SDK will not be updated because the purpose of this proposal is for
testing cloud function. Client SDK serves app development.

## Skycli Changes

Find what cloud functions can be invoked:

```
$ skycli cloud function list
TYPE      NAME           RECORD TYPE    TRIGGER
hook      add_info       note           before_save
lambda    get_messages
timer     collect_money
```

Invoking a cloud function without payload will open editing session with
template or payload from previous invocation.

```
$ skycli cloud function invoke hook add_info --record-type note --trigger before_save
```

`--record-type` and `--trigger` is not required if the name is unique.

An editing session is opened with some content to help the user invoke
cloud function without entering boilerplate. The editing session should
be prepopulated with either:

- Templated params according to the record type and trigger
- Payload from previous invocation for the same cloud function if any

```
# Save to invoke. This line is ignored.
{
  "func": {
    "kind": "hook",
    "name": "add_info",
    "type": "note",
    "trigger": "before_save"
  },
  "params": {
    "record": { /* ... */ },
    "old_record": { /* ... */ }
  }
}
```

When the editing session quit with success exit code, the `skycli` should
save the param for invocation again later and call skygear-server with the
params.

Will print the result to stdout:

```
{ /* ... */ }
```

Other options to invoke cloud function:

```
$ skycli help cloud function invoke
Usage: skycli cloud function invoke [options]
    --again  Run with payload from previous invocation

$ skycli cloud function invoke note.add_info --again
{ /* ... */ }
```
