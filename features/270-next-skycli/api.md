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
    - [skycli auth login](#skycli-auth-login)
    - [skycli auth logout](#skycli-auth-logout)

- skycli config
    - [skycli config view](#skycli-config-view)
    - [skycli config set-app [APP_NAME]](#skycli-config-set-app)
    - [skycli config set-cluster-server [https://1.2.3.4]](#skycli-config-set-cluster-server)

- skycli user (Admin only, cluster user management)
    - [skycli user create](#skycli-user-create)
    - [skycli user list](#skycli-user-list)

- skycli app
    - [skycli app list](#skycli-app-list)
    - [skycli app create](#skycli-app-create)
    - [skycli app add-user [USER_EMAIL]](#skycli-app-add-user)
    - [skycli app view-config](#skycli-app-view-config)
    - [skycli app update-config -f [TENANT_CONFIG_YAML_FILE]](#skycli-app-update-config)
    - [skycli app add-domain [CUSTOM_DOMAIN]](#skycli-app-add-domain)
    - [skycli app update-domain [CUSTOM_DOMAIN]](#skycli-app-update-domain)
    - [skycli app list-domain](#skycli-app-add-domain)

- skycli cf
    - [skycli cf list](#skycli-cf-list)
    - [skycli cf deploy [FUNCTION_NAME]](#skycli-cf-deploy)
    - [skycli cf logs [FUNCTION_NAME]](#skycli-cf-logs)


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


### skycli auth login

`skycli auth login [--email=EMAIL] [--admin-key=ADMIN_KEY]`

Login as cluster admin or user, if no flags are provided. Will ask for email
and password interactively.

#### Flags

- `--email=EMAIL`

    Login as cluster user, ask for password interactively.

- `--admin-key=ADMIN_KEY`

    Login as cluster admin, no password is needed.


### skycli auth logout

`skycli auth logout`

Logout user

### skycli config view

`skycli config view`

View the current config.

#### Example
```
$ skycli config view
[cluster]
email=user@skygear.io
cluster-server=https://1.2.3.4
admin-key=

[app]
app=myapp
```

### skycli config set-app

`skycli config set-app [APP_NAME]`

Change skycli current app context to `APP_NAME`

### skycli config set-cluster-server

`skycli config set-cluster-server [CLUSTER_SERVER_URL]`

Change current cluster controller server endpoint, it is provided by cluster
admin.

### skycli user create

`skycli user create`

Cluster admin only. Create cluster user, need to provide email and password interactively.

### skycli user list

`skycli user list`

Cluster admin only. List all cluster user.

### skycli app list

`skycli app list`

List all user's app. If using admin key to call this app, list all the apps in
the cluster instead.

### skycli create app

`skycli create app`

Create app, the skycli current app context will be updated to the newly created
app.

### skycli app add-user

`skycli app add-user [USER_EMAIL]`

Add user into the current app. Change current app by
`skycli config set-app`.

### skycli app view-config

`skycli app view-config`

View the current app tenant config in yaml format.

#### Example

```
$ skycli app view-config
- APP_NAME: myapp
- MASTER_KEY: xxxxx
- API_KEY: xxxxx
- DATABASE_URL: xxxxx
- SSO_CONFIGS:
    - NAME: google
        SCOPE: xxxx
        CLIENT_ID: xxxxx
        CLIENT_SECRET: xxxxx
```

### skycli app update-config

`skycli app update-config -f [TENANT_CONFIG_YAML_FILE]`

Update tenant config by providing the yaml file.

#### Example

```sh
# 1. If you don't have a copy of the tenant config file, get it from the view command.
$ skycli app view-config > ./tenant-config.yaml

# 2. Update the tenant-config.yaml file

# 3. Apply the change to the app
$ skycli app update-config -f ./tenant-config.yaml
```

### skycli app add-domain

`skycli app add-domain [CUSTOM_DOMAIN] --key=[KEY_FILE] --cert=[CERT_FILE]`

Add new custom domain to app, provide key and cert files to use the custom tls
certs. Cert and key should be PEM-encoded X.509, RSA (2048) key.
Key and cert need to be provided at the same time. If there is no key and cert,
use let's encrypt instead.

#### Flags

- `--key=[KEY_FILE]`

    Provide custom tls key.


- `--cert=[CERT_FILE]`

    Provide custom tls cert.


### skycli app update-domain

`skycli app update-domain [CUSTOM_DOMAIN] --key=[KEY_FILE] --cert=[CERT_FILE] --use-letsencrypt`

Update domain tls certificates. Key and cert need to be provided at the same
time.

#### Flags

- `--key=[KEY_FILE]`

    Provide custom tls key.

- `--cert=[CERT_FILE]`

    Provide custom tls cert.

- `--use-letsencrypt`

    Configure using let's encrypt certs for the given domain.


### skycli app list-domain

`skycli app list-domain`

List all custom domain of apps.

### Example

```
$skycli app list-domain
DOMAIN              CUSTOM_CERTS            SSL_CERT_EXPIRY
api.myapp.com       true                    Apr 18 06:10:35 2019 GMT
test.myapp.com      false                   Apr 18 06:10:35 2019 GMT
```

### skycli cf list

`skycli cf list`

List the cloud functions of current application.

### skycli cf deploy

`skycli cf deploy [FUNCTION_NAME]`

Deploy cloud functions by reading CF config file. `[FUNCTION_NAME]` is the
function name in config file. Deploy all functions if `[FUNCTION_NAME]` is missing.

### skycli cf logs

`skycli cf logs [FUNCTION_NAME]`

Show cloud functions logs. Aggregate all function logs if `[FUNCTION_NAME]` is missing.

## Config files structure

### ~/.skycli/skyclirc

- cluster controller endpoint
- user credentials 

### ./.skyclirc
- current app
