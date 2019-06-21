# Revamp TenantConfiguration

## Background

TenantConfiguration serves the following purposes.

- It stores non-editable app configuration, for example `APP_NAME`, `DATABASE_URL`.
- It stores user configuration, for example `API_KEY`, `MASTER_KEY`, `CORS_HOST`.
- It can be serialized into msgpack and JSON. The msgpack format is injected into HTTP header by the gateway and further consumed by gears. The JSON format is directly stored into the database.

## Problems

### Mixed app configuration and user configuration

This is confusing and error-prone because we could accidentally allow user to modify app configuration.

### Stored Derivable data

It stores derivable data like `APP_NAME` where the source of truth is `app.name`.

### Non user-facing

The organization is not user-facing, for example there is `SOO_SETTING` and `SSO_CONFIGS`.

### Non environment variable friendly name

`_` is used in key name as aesthetic separator. This introduces ambiguity when we need to support loading configuration from environment variable where `_` is used to denote structure.

### Stored deployment-specific data

`HOOKS` is an example. Hooks should be derived from the incoming request. When we support serving multiple active deployments, the deployment-specific hooks should be invoked.

Suppose we have two deployments

- `https://tag1.myapp.skygearapis.com`
- `https://tag2.myapp.skygearapis.com`

If the signup request is `https://tag1.myapp.skygearapis.com/_auth/signup`, the hooks configuration injected by the gatway for the auth gear should be specific to the `tag1`.

## Proposed solution

The new TenantConfiguration is solely for gear consumption. When it is injected by the gateway, it is msgpack serialized. It can also be deserialized from environment variable in case the gear is running in standalone mode.

The old TenantConfiguration will be splitted into AppConfiguration and UserConfiguration. AppConfiguration is used to store non-editable configuration while UserConfiguration is intended to be edited by the developer.

All keys consist of alphanumeric characters only. No `_` is allowed. For example, `DATABASE_URL` become `databaseurl` in JSON and `DATABASEURL` in environment variable.

To derive the new TenantConfiguration, we need AppConfiguration, UserConfiguration and the incoming HTTP request.

### Remaining issues

- How to handle inline content in UserConfiguration? For now we can just store them as is but in the future we may want to store them in a private storage.

## References

This idea of forbidding `_` in key name is borrowed from [the configuration of docker registry](https://docs.docker.com/registry/configuration/)
