# Revamp TenantConfiguration

## Background

TenantConfiguration serves the following purposes.

- It stores non-editable app configuration, for example `APP_NAME`, `DATABASE_URL`.
- It stores user configuration, for example `API_KEY`, `MASTER_KEY`, `CORS_HOST`.
- It can be serialized into msgpack and JSON. The msgpack format is injected into HTTP header by the gateway and further consumed by gears. The JSON format is directly stored into the database.

## Problems

### Stored deployment-specific data

`HOOKS` is an example. Hooks should be derived from the incoming request. When we support serving multiple active deployments, the deployment-specific hooks should be invoked.

Suppose we have two deployments

- `https://tag1.myapp.skygearapis.com`
- `https://tag2.myapp.skygearapis.com`

If the signup request is `https://tag1.myapp.skygearapis.com/_auth/signup`, the hooks configuration injected by the gatway for the auth gear should be specific to the `tag1`.

### Mixed app configuration and user configuration

This is confusing and error-prone because we could accidentally allow user to modify app configuration.

### Stored Derivable data

It stores derivable data like `APP_NAME` where the source of truth is `app.name`.

### Non user-facing

The organization is not user-facing, for example there is `SOO_SETTING` and `SSO_CONFIGS`.

## Proposed solution

### Remove deployment-specific data from TenantConfiguration

`HOOKS` is removed from TenantConfiguration because it is deployment specific.

### Split TenantConfiguration into AppConfiguration and UserConfiguration

AppConfiguration is used to store non-editable configuration while UserConfiguration is intended to be edited by the developer.

### Make TenantConfiguration serializable to msgpack and YAML

The original purpose of TenantConfiguration remains unchanged. It is msgpack serialized when injected by the gateway. It can also serialize to YAML in case the gear is running in standalone mode.

### Restructure AppConfiguration, UserConfiguration, TenantConfiguration to make them more developer-friendly

Key names will become `lower_snake_case` and related settings will be grouped into the same section.

### Derive TenantConfiguration from AppConfiguration, UserConfiguration and the incoming HTTP request

The incoming HTTP request implies a specific deployment. Given a AppConfiguration, UserConfiguration and a Deployment, we can derive a TenantConfiguration.

### Remaining issues

- How to handle inline content in UserConfiguration? For now we can just store them as is but in the future we may want to store them in a private storage.

## Appendix

- [Example of TenantConfiguration in JSON](./tenant-config.example.json)
- [Example of TenantConfiguration in YAML](./tenant-config.example.yaml)
