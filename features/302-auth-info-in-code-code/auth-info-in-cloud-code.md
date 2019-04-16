# AuthInfo in cloud code

## Overview

The gateway must resolve the HTTP header `x-skygear-access-token` into `x-skygear-auth-info`
when the request has been determined to be routed to cloud code.
The cloud code runtime must decode `x-skygear-auth-info` and
provide it as a value to the underlying application.
How it is provided should follow language and framework convention.
The cloud code SDK must provide ways to decode it.

## x-skygear-auth-info

This is a HTTP Header containing a [AuthInfo](#AuthInfo) encoded with [base64url](#base64url)

Example

```
x-skygear-auth-info: eyJ1c2VyX2lkIjogIjg3ZGZhYWNmLWE4NzItNDQ0YS05NDhhLTE0OTdjNmJiMmEwMyIsICJkaXNhYmxlZCI6IGZhbHNlLCAidmVyaWZpZWQiOiBmYWxzZX0=
```

Note that this representation should be treated as implementation details and subject to changes.
In the future, signature may be added so that this header can be verified.

If `x-skygear-access-token` is absent, then `x-skygear-auth-info` is absent as well.
Therefore, the provided value must use [Option Type](https://en.wikipedia.org/wiki/Option_type).

## AuthInfo

This is a JSON Object of the following fields.

- `user_id`: string
- `disabled`: boolean
- `verified`: boolean

Example

```JSON
{
  "user_id": "87dfaacf-a872-444a-948a-1497c6bb2a03",
  "disabled": false,
  "verified": false
}
```

## base64url

This encoding based on https://tools.ietf.org/html/rfc4648#section-5 without any linebreaks, whitespaces.

## How to provide the [AuthInfo](#AuthInfo) in the cloud code runtime

This is language and framework specific. Suppose cloud code in written in a Express-like framework.

```javascript
export default function myCloudCode(req, res) {
  console.log(req.ctx.authInfo); // { _id: "", disabled: false, verified: false }
  res.end("");
}
```

Note that `req.ctx` is not an Express feature as Express does not have builtin context support.

## How to decode the [AuthInfo](#AuthInfo) manually

Low-level primitives are provided in the SDK to decode the header.

```javascript
import { HEADER_NAME_AUTH_INFO, decodeAuthInfo } from "@skygear/sdk";

export default function myCloudCode(req, res) {
  const headerValue = req.get(HEADER_NAME_AUTH_INFO);
  if (!!headerValue) {
    const authInfo = decodeAuthInfo(headerValue);
  }
  res.end("");
}
```

## Design choices


### Why gateway is responsible for this?

The decoding from `x-skygear-access-token` to `x-skygear-auth-info` is placed at gateway level
because gateway has already been routing cloud code requests. Adding the decoding step
can simply be done with adding a middleware before the routing handler.

### Why AuthInfo is not the same as `_core_user`?

This is a solely subjective reason that the proposed fields are enough for
most use-cases.
