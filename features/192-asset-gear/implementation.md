# Implementation Details and Decisions

## Whether or not to use a gateway

The evaluated gateway Minio does not support public access to object. All URLs are be signed even the underlying file is public read.

The advantage offered by a gateway is allowing us to program against a specific interface like S3.
However, the feature the Asset Gear needs is just presigning URL. It is possible to generate the presigned URL on our own.

Therefore, the implementation is going to generate presigned request manually.

## How to implement public and private asset

S3 and GCE both supports private bucket with some public objects inside.
Azure Storage, however, only supports bucket-level access control.
The bucket is either private or public.
The objects inherit the access control of the bucket and does not have any override.

To work around this limitation, we have two approaches

### Approach 1: Two-buckets Approach

One bucket is public while another one is private. However, this means the asset gear now must be aware of where the asset was put.

Suppose the exact name asset `myimage.png` was originally public.
The developer overwrites it so that it is private now.
Since the implementation uses two buckets, it has to ensure the old, public one is deleted.

A GET Object request has to lookup two buckets.

### Approach 2: Single-bucket Approach

The underlying bucket is always private.
The access control is stored as metadata header on the object, for example, `x-amz-metadata-access: public`.
When serving a GET Object request, the Asset Gear will use the signature if it is present.
If signature is not present, a new one will be generated.
The Asset Gear then proxies the request.
If the signature is newly generated and `x-amz-metadata-access` is `private`, then the request results in 403.

The advantage of this approach is that the implementation is much simpler.

### Conclusion

The implementation is going to use Approach 2.

## Report upload progress

The JavaScript Client SDK uses Fetch API as the abstraction of HTTP transport.
However, Fetch API does not support upload progress.
Therefore, The SDK is going to switch to use `XMLHttpRequest`.
