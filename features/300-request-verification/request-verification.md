# Request verification

## Motivation

The gateway injects HTTP headers to tell the current authenticated user.

The auth gear sends webhooks.

We need ways to verify the HTTP headers and the body are from the gateway
and the auth gear.

## Special Headers

`x-skygear-headers-signature`

This header contains the signature for headers verification.

`x-skygear-body-signature`

This header contains the signature for body verification.

## Headers signature generation

1. Derive a byte sequence from all Skygear headers excluding the special headers.
1. Calculate the uppercase hex digest HMAC-SHA256 of the byte sequence with a shared secret.
1. Pass this digest as `x-skygear-headers-signature`

## Headers byte sequence derivation algorithm

1. Let `headers` be the original list of headers.
1. Let `headers` be `headers` with lowercased header name.
1. Let `headers` be `headers` whose name starts with `x-skygear-`.
1. Let `headers` be `headers` excluding the special headers.
1. Let `headers` be the sorted version `headers` by name alphabetically.
1. Let `lines` be `headers` with name and value joined with `:`.
1. Let `content` be `lines` joined with `\r\n`.
1. If `content` is empty, return.
1. Return the UTF-8 encoding of `content`.

### Example

```python
import hmac
import hashlib


SPECIAL_HEADERS = [
    'x-skygear-headers-signature',
    'x-skygear-body-signature',
]

# Input
headers = [
    ('content-type', 'application/json'),
    ('content-length', '100'),
    ('X-Skygear-Auth-userid', 'a'),
    ('X-SKYGEAR-AUTH-VERIFIED', 'true'),
    ('x-skygear-auth-disabled', 'false'),
    ('x-skygear-headers-signature', 'fake'),
]
secret = b'secret'

# Headers byte sequence derivation algorithm
headers = [(n.lower(), v) for n, v in headers]
headers = [h for h in headers if h[0].startswith('x-skygear-')]
headers = [h for h in headers if h[0] not in SPECIAL_HEADERS]
headers = sorted(headers, key=lambda h: h[0])
lines = [n + ':' + v for n, v in headers]
content = '\r\n'.join(lines)
bytes_ = content.encode('utf-8')


assert bytes_ == b'x-skygear-auth-disabled:false\r\nx-skygear-auth-userid:a\r\nx-skygear-auth-verified:true'


signature = hmac.new(
    secret,
    bytes_,
    hashlib.sha256
).hexdigest().upper()


assert signature == 'E672553238E3862BD538E29AFF739E457168A32EA0FB61C6891A250DA57E5877'
```

## Body signature generation

1. Calculate the uppercase hex digest HMAC-SHA256 of the body with a shared secret.
1. Pass this digest as `x-skygear-body-signature`

### Example

```python
import hmac
import hashlib


# Input
body = b'''
{
  "key": value
}
'''
secret = b'secret'

signature = hmac.new(
    secret,
    body,
    hashlib.sha256
).hexdigest().upper()


assert signature == '6B656B832F2C85EEB128D32A188E624359062190C1390598A9D45495C2D14E65'
```

## Secret

The secret is defined per application. It is generated during application creation.
How it is provided to cloud code environment will be specified in another document.

## Verification

The verification process must follow the corresponding generation process
to generate signature, and then use a secure string comparison to
compare the received signature and the generated signature.

The verification should be done by the runtime. In cloud code case,
it should be done by the fission environment.

### Example

```python
import hmac

generated_signature = '6B656B832F2C85EEB128D32A188E624359062190C1390598A9D45495C2D14E65'
received_signature = '6B656B832F2C85EEB128D32A188E624359062190C1390598A9D45495C2D14E65'

if not hmac.compare_digest(received_signature, generated_signature):
    raise ValueError('invalid signature')
```
