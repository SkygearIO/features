# Signed URL

The document describes a URL signing scheme which is largely borrowed from Google Cloud Storage V4 signing.

The main difference is Google's is RSA based while this scheme is secret-key based.

```
SIGNATURE :=
  HEX(HMAC_SHA256(STRING_TO_SIGN, SECRET))

HEX :=
  Turn bytes into lowercase hex string

SHA256 :=
  The well known SHA256 hash function

HMAC_SHA256 :=
  The well known HMAC-SHA256 function

SECRET :=
  The secret key.

STRING_TO_SIGN :=
  SIGNING_ALGORITHM '\n'
  CURRENT_DATETIME '\n'
  HASHED_CANONICAL_REQUEST

SIGNING_ALGORITHM :=
  "HMAC-SHA256"

CURRENT_DATETIME :=
  YYYYMMDD 'T' HHMMSS 'Z'

HASHED_CANONICAL_REQUEST :=
  HEX(SHA256(CANONICAL_REQUEST))

CANONICAL_REQUEST :=
  HTTP_METHOD '\n'
  PATH '\n'
  CANONICAL_QUERY_STRING '\n'
  CANONICAL_HEADERS '\n'
  '\n'
  SIGNED_HEADERS '\n'
  PAYLOAD

CANONICAL_QUERY_STRING :=
  Stably lexicographically sorted query string by name.

CANONICAL_HEADERS :=
  Convert header name to lowercase.
  Stably lexicographically sort the header name.
  Join repeating header value with ','
  Join the header name and the value with ':'
  Join the headers with '\n'

SIGNED_HEADERS :=
  Convert header name to lowercase.
  Stably lexicographically sort the header name.
  Join the header names with ';'

PAYLOAD :=
  "UNSIGNED-PAYLOAD"
```

The signed URL must include the following query string parameters.

- `x-skygear-algorithm`: The value is the same as `SIGNING_ALGORITHM`.
- `x-skygear-date`: The value is the same as `CURRENT_DATETIME`.
- `x-skygear-expires`: The duration in seconds the signed URL remains valid.
- `x-skygear-signedheaders`: The header included in the computation of the signature.
- `x-skygear-signature`: The signature.
