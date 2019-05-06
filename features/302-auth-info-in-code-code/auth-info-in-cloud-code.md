# AuthInfo in cloud code

## Overview

The gateway must resolve the HTTP header `x-skygear-access-token` into
multiple HTTP headers representing the [AuthInfo](#AuthInfo)
when the request has been determined to be routed to cloud code.

If `x-skygear-access-token` is absent, then the HTTP headers are absent as well.

The gateway must remove the headers from the original request before
injecting the headers.

## AuthInfo

The following fields about the authenticated user are exposed.

- `user_id`
  - Type: string
  - The user ID of the user
- `disabled`
  - Type: boolean
  - Whether or not the user is disabled
- `verified`
  - Type: boolean
  - Whether or not the user is verified

## The HTTP headers

### x-skygear-auth-userid

This is `user_id` of [AuthInfo](#AuthInfo).

Example

```
x-skygear-auth-userid: 87dfaacf-a872-444a-948a-1497c6bb2a03
```

### x-skygear-auth-verified

This is `verified` of [AuthInfo](#AuthInfo).

The value is either `true` or `false`.

Example

```
x-skygear-auth-verified: true
```

### x-skygear-auth-disabled

This is `disabled` of [AuthInfo](#AuthInfo).

The value is either `true` of `false`.

Example

```
x-skygear-auth-disabled: false
```

## Design choices

### Why gateway is responsible for this?

The decoding from `x-skygear-access-token` to the headers is placed at gateway level
because gateway has already been routing cloud code requests. Adding the decoding step
can simply be done with adding a middleware before the routing handler.

### Why AuthInfo is not the same as `_core_user`?

This is a solely subjective reason that the proposed fields are enough for
most use-cases.
