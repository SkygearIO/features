# Consistent error handling

## BaseContainer._handleResponse

All calls to Server API uses `makeRequest`, which calls `_handleResponse`.
This is where the SDK detect if the request resulted in an error and reject
the promise.

If `err` is truthy, create a `SkygearError` with the value, then
reject the promise. The `status` should be added to the `SkygearError`
info dictionary.
