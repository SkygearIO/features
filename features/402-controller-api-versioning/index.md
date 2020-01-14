# API Versioning in Skygear Controller

Skygear Controller adopts a simple versioning scheme to handle breaking changes and backward-compatible configuration changes.

The versioning scheme is applied globally on Skygear Controller rather than individual endpoint or resource.

## Format of API Version

API Version starts with `v` and is followed by two integers separated by a dot.

For example,

```
v2.3
```

where 2 is the major version and 3 is the minor version.

## Major Version

The first integer in API Version indicates the major version.
The major version must be incremented when any breaking changes are introduced.

## Minor Version

The second integer in API Version indicates the minor version.
The minor version must be incremented when any backward-compatible configuration changes are introduced.

When the major version is incremented, the minor version is reset to 0.

## Check Compatible Version

Skygear Controller compares the given API Version against its own version to
determine whether the versions are compatible.
The following steps illustrate the algorithm.

1. Check if the given API Version is in [correct format](#format-of-api-version). If not, it is incompatible.
2. Check if the given major version is equal to own major version. If not, it is incompatible.
3. Check if the given minor is less than or equal to own minor version. If not, it is incompatible.

## API Version in endpoint

The REST API of Skygear Controller has the API Version specified in the first path component.

For example,

```
/_controller/<api-version>/apps/myapp
```

If the given API Version is incompatible, Skygear Controller must return an error with name `NotFound` and reason `IncompatibleAPIVersion`.

## skycli and API Version

A given copy of skycli has a fixed API Version to use.
The developer must upgrade skycli to use a higher API Version.

## Skygear Portal and API Version

The API version of Skygear Portal should always be in sync with that of Skygear Controller.

## API Version in AppConfiguration

AppConfiguration has a field `api_version` to indicate the API Version.
Skygear Controller always returns AppConfiguration in its own API Version.
Skygear Controller must allow updating [Compatible](#check-compatible-version) AppConfiguration without information loss.

## API Version in TenantConfiguration

TenantConfiguration has a field `api_version` to indicate the API Version.

The major version of TenantConfiguration in the storage may be less than the own major version of Skygear Gateway.
In this case, Skygear Gateway must migrate on the fly.

It is an error if the major version of TenantConfiguration in the storage is greater than the own major version of Skygear Gateway.

## API Version in skygear.yaml

skygear.yaml has a field `api_version` to indicate the API Version.
Skygear Controller must allow deploying [Compatible](#check-compatible-version) skygear.yaml.
