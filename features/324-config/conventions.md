# Configuration Conventions

## Background

User config is the user-facing configuration that allow user to enable and provide configurations to Skygear provided gears. This document is intended to provide conventions to ensure the configuration is clear, easy to understand, flexible for new features and consistent.

## Conventions

### Prefer using list of items over map

Don't use maps of items in config. To define multiple items which identified by keys (e.g. login id keys), use a list of items containing the key field instead.

Prefer using list

```
login_id_keys:
- key: email
  type: email
  minimum: 0
  maximum: 1
- key: phone
  type: phone
  minimum: 0
  maximum: 1
- key: username
  type: raw
  minimum: 0
  maximum: 1
```

Don't use map
```
login_id_keys:
  email:
    type: email
    minimum: 0
    maximum: 1
  phone: 
    type: phone
    minimum: 0
    maximum: 1
  username:
    type: raw
    minimum: 0
    maximum: 1
```

Discussion can be found in [#368](https://github.com/SkygearIO/features/issues/368).

### Use enabled flag only if necessary

Added `enabled` or `disabled` only if necessary (e.g. enable welcome email). Config file should not be a place that store the config data temporarily. We should not add `enabled` or `disabled` flag to item, instead user should delete the item if they don't need it.

## References

- [Kubernetes api conventions](https://github.com/kubernetes/community/blob/master/contributors/devel/sig-architecture/api-conventions.md)
