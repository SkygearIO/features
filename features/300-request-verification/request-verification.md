# Request verification

## Motivation

Different Skygear components may communicate with other components:
- Gateway <-> Gears/Microservices for incoming HTTP traffic.
- Auth Gear <-> Microservices/External services for web-hook events.

We need ways to verify the authenticity of these communications.

To verify authenticity of communication, we need to verify two property:
- the identity of receiver (i.e. microservices)
- the identity of sender (i.e. gateway/auth gear)

The industry standard of securing and authenticating communication is to use
mTLS. However, for simplicity, Skygear would use a simpler design to acheive
this objective. This document describe Skygear's design of verification.

## Gateway communication verification

Gateway communication occurs between Gateway and Microservices/Gears.

Microservices/Gears are designed to host on Kubernetes. Therefore, for
communication between Gateway and Microservices/Gears, we use Network Policy to
ensure that only Gateway may interact with Microservices/Gears.

## Web-hook communication verification

Web-hook communication occurs between Auth Gear and Microservices/external
services.

To verify the identity of receiver, we require that the web-hook handler
endpoint must use HTTPS. Therefore we can assume that identity of the endpoint
is expected as specified in configuration.

To verify the identity of sender, we use a signature header with shared secret
to allow receiver to verify the authenticity of request.

### Shared secret

The shared secret is set in user configuration per web-hook handler. Developer
must to set them in configuration to use web-hook feature.

To access the shared secret in microservices, it is recommended to use the
built-in secret management feature.

### Signature generation

When sending a web-hook event requests, Auth Gear would generates a signature
of the event body and send it to target endpoint as HTTP header:

1. Calculate the uppercase hex digest HMAC-SHA256 of the body with a shared secret.
1. Pass this digest as `x-skygear-body-signature` header.

Example code:
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

### Signature verification

The verification process must follow the corresponding generation process
to generate signature, and then use a secure string comparison to
compare the received signature and the generated signature.

Example code:
```python
import hmac

generated_signature = '6B656B832F2C85EEB128D32A188E624359062190C1390598A9D45495C2D14E65'
received_signature = '6B656B832F2C85EEB128D32A188E624359062190C1390598A9D45495C2D14E65'

if not hmac.compare_digest(received_signature, generated_signature):
    raise ValueError('invalid signature')
```
