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

## Headers verification

The verification mechanism is the same as https://github.com/SkygearIO/features/blob/2a5333040f8904c3d914ec0b237c09a1323b0b94/features/285-design-webhooks/design.md except the content to be hashed is not the HTTP body but the headers.

The name of signature header is `x-skygear-headers-signature`.

### Algorithm

1. Let `headers` be the original list of headers.
2. Let `headers` be `headers` with lowercased header name.
3. Let `headers` be `headers` whose name starts with `x-skygear-`.
4. Let `headers` be the sorted version `headers` by name alphabetically.
5. Let `lines` be `headers` with name and value joined with `:`.
6. Let `content` be `lines` joined with `\r\n`.
7. If `content` is empty, return.
8. Otherwise let `bytes` be the UTF-8 encoding of `content`, hash it, take the hex digest, and inject as `x-skygear-headers-signature`.

Example

```python
headers = [
    ('content-type', 'application/json'),
    ('content-length', '100'),
    ('X-Skygear-Auth-userid', 'a'),
    ('X-SKYGEAR-AUTH-VERIFIED', 'true'),
    ('x-skygear-auth-disabled', 'false'),
]

headers = [(n.lower(), v) for n, v in headers]
headers = [h for h in headers if h[0].startswith('x-skygear-')]
headers = sorted(headers, key=lambda h: h[0])
lines = [n + ':' + v for n, v in headers]
content = '\r\n'.join(lines)
bytes_ = content.encode('utf-8')

assert bytes_ == b'x-skygear-auth-disabled:false\r\nx-skygear-auth-userid:a\r\nx-skygear-auth-verified:true'
```

## Design choices

### Why gateway is responsible for this?

The decoding from `x-skygear-access-token` to the headers is placed at gateway level
because gateway has already been routing cloud code requests. Adding the decoding step
can simply be done with adding a middleware before the routing handler.

### Why AuthInfo is not the same as `_core_user`?

This is a solely subjective reason that the proposed fields are enough for
most use-cases.
