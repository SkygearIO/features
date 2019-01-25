## Feature Overview

In next, we will have cli tools for user to manage the cluster's applications.
Since we will only have skycli in the first version, skycli should be able to
do almost all the operations of v1 portal.

The following spec will cover the EE version first.


## User scenarios

- Cluster admin can create cluster user
- Cluster admin assign user to app
- Cluster user can create app
- Cluster user can view, update and delete their apps config
- Cluster user deploy CF to their apps
- Cluster user can update apps custom domain setting, add new custom domain to app
- Cluster admin can do everything in the cluster

## Commands

- skycli auth
    - [skycli auth login](commands.md#skycli-auth-login)
    - [skycli auth logout](commands.md#skycli-auth-logout)

- skycli config
    - [skycli config view](commands.md#skycli-config-view)
    - [skycli config set-app [APP_NAME]](commands.md#skycli-config-set-app)
    - [skycli config set-cluster-server [https://1.2.3.4]](commands.md#skycli-config-set-cluster-server)

- skycli user (Admin only, cluster user management)
    - [skycli user create](commands.md#skycli-user-create)
    - [skycli user list](commands.md#skycli-user-list)

#### Application commands

- skycli app
    - [skycli app list](commands.md#skycli-app-list)
    - [skycli app create](commands.md#skycli-app-create)
    - [skycli app add-user [USER_EMAIL]](commands.md#skycli-app-add-user)
    - [skycli app view-config](commands.md#skycli-app-view-config)
    - [skycli app update-config -f [TENANT_CONFIG_YAML_FILE]](commands.md#skycli-app-update-config)
    - [skycli app add-domain [CUSTOM_DOMAIN]](commands.md#skycli-app-add-domain)
    - [skycli app update-domain [CUSTOM_DOMAIN]](commands.md#skycli-app-update-domain)
    - [skycli app list-domain](commands.md#skycli-app-add-domain)

- skycli cf
    - [skycli cf list](commands.md#skycli-cf-list)
    - [skycli cf deploy [FUNCTION_NAME]](commands.md#skycli-cf-deploy)
    - [skycli cf logs [FUNCTION_NAME]](commands.md#skycli-cf-logs)

- skycli secret
    - [skycli secret list](commands.md#skycli-secret-list)
    - [skycli secret create [SECRET_NAME] [SECRET_VALUE]](commands.md#skycli-secret-create)
    - [skycli secret update [SECRET_NAME] [SECRET_VALUE]](commands.md#skycli-secret-update)
    - [skycli secret remove [SECRET_NAME]](commands.md#skycli-secret-remove)

## Commands alias

- skycli login -> skycli auth login
- skycli logout -> skycli auth logout
- skycli list -> skycli cf list
- skycli deploy -> skycli cf deploy
- skycli logs -> skycli cf logs


## Architecture

To keep it simple, all clusters user have same privilege. They can create app
and update their app settings or cf deployment. Cluster admin use admin key to
access skycli instead of using user account.

```
                         +----------+
                         |          |
                         |  Skycli  |
                         |          |
                         +----+-----+
                              |
                              |
                         +----v-----------------+
                         |                      |
                         |  Cluster controller  |
                         |                      |
                         +-+------------------+-+
- Cluster user store       |                  |
- Update tenant config     |                  |  Update deployment
- Store build history?     |                  |
                         +-v------------+    +v----------+
                         |              |    |           |
                         | gateway db   |    |    k8s    |
                         |              |    |           |
                         +--------------+    +-----------+

```

## Config files structure

### ~/.skycli/skyclirc

- cluster controller endpoint
- user credentials 

### ./.skyclirc
- current app
