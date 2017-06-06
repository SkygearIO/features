# Log Isolation

Log isolation refers to obtaining console log from invoked cloud function. Log
is to be isolated from each invocation of cloud functions.

Since log is printed to stdout, we need to run cloud function in separate
process so that log for individual invocation can be collected. This requires
some changes across server and plugin runtime.

## Server Changes

`Request`  will add a field to indicate log isolation:

```
type Request struct {
	Context context.Context
	Kind         string
	Name         string
	Param        interface{}
	Async        bool
  LogIsolation bool
}
```

We need a new struct `Response` for getting the log and data from invocation. It
will replace various types returned from plugin transport. 

```
type Response struct {
  Log          []byte
  Output       []byte
  AuthResponse *AuthResponse
  Record       *skydb.Record
}
```

HTTP Transport should also indicate log isolation using HTTP request header and
the log data must be returned in HTTP response header. ZMQ transport is not
supported at the moment.

```
# Request header
X-Skygear-Plugin-Log-Isolation: true
# Response header
X-Skygear-Plugin-Log: <base64 encoded string>
```

## Runtime Changes

[Work in Progress]

For both Python and JS runtime, the server component receiving the HTTP request
should check the header for log isolation. If the log isolation is enabled, it
should dispatch the request to a child process that is only used to run this
request.

Python runtime requires forking of Werkzeug library and the Javascript runtime
requires forking of the `cluster` package.

Before sending the request, the child process should collect the log and encode
the log in response header.
