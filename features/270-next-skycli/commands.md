## skycli auth

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

## skycli config

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

## skycli user

### skycli user create

`skycli user create`

Cluster admin only. Create cluster user, need to provide email and password interactively.

### skycli user list

`skycli user list`

Cluster admin only. List all cluster user.

## skycli app

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

## skycli cf

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

## skycli secret

#### Overview

Manage current app secret. To use secret in cloud function, user should update 
cloud function configure to uses secrets from environment variables. (TBD: when deciding cf config file)

### skycli secret list

`skycli secret list`

Show all secret in app

#### Example
```
$skycli secret list
NAME
mongo_db_url
aws_access_id
aws_access_secret
```

### skycli secret create

`skycli secret create [SECRET_NAME] [SECRET_VALUE]`

Create new secret in app

### skycli secret update

Update secret in app

`skycli secret update [SECRET_NAME] [SECRET_VALUE]`

### skycli secret remove

Remove secret in app

`skycli secret remove [SECRET_NAME]`
