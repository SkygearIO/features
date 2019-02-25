## skycli auth

### skycli auth login

`skycli auth login [--email=EMAIL] [--admin-key=ADMIN_KEY]`

Login as cluster admin or user, if no flags are provided. Will ask for email
and password interactively.

#### Flags

- `--email=EMAIL` Login as cluster user, ask for password interactively.
- `--admin-key=ADMIN_KEY` Login as cluster admin, no password is needed.

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

Change skycli current app context to `APP_NAME` by creating or updating `./skygear.yaml`.

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

### skycli app view-tenant-config

`skycli app view-tenant-config`

View the current app tenant config in yaml format.

#### Example

```
$ skycli app view-tenant-config
- MASTER_KEY: xxxxx
- API_KEY: xxxxx
- SSO:
  ALLOWED_CALLBACK_URLS:
  - http://127.0.0.1:5000/
  - http://localhost:5000/
  MERGE_USERS_WITH_IDENTICAL_EMAIL: true
```

### skycli app update-tenant-config

`skycli app update-tenant-config -f [TENANT_SETTING_YAML_FILE]`

Update tenant config interactively or by providing a file. For the config format,
please see [user facing config](user-facing-config.md)

#### Example

**Update in editor**
```sh
$ skycli app update-tenant-config
? Edit application tenant config. Press <enter> to launch your preferred editor.

# Enter editor mode with existing config
- MASTER_KEY: xxxxx
- API_KEY: xxxxx
- SSO:
  ALLOWED_CALLBACK_URLS:
  - http://127.0.0.1:5000/
  - http://localhost:5000/
  MERGE_USERS_WITH_IDENTICAL_EMAIL: true
  ...
~
~
~
~
~
~
~
```

**Update by providing a file**
```sh
# 1. If you don't have a copy of the tenant config file, get it from the view command.
$ skycli app view-tenant-config > ./tenant-config.yaml

# 2. Update the tenant-config.yaml file

# 3. Apply the change to the app
$ skycli app update-tenant-config -f ./tenant-config.yaml
```

### skycli domain

#### Overview

### skycli domain add

`skycli domain add [CUSTOM_DOMAIN]`

This command will only add domain into the app. The domain is not usable in
this stage. User need to verify the domain.

#### Example

```
$ skycli domain add api.example.com
Added domain api.example.com successfully!

1. Add the TXT record below to your DNS provider to verify your own example.com

    Type    Host            Value
    TXT     example.com     skygear-cloud-verification=5636486ffc5a4dfebf4a13f480bd9a95

2. Add `CNAME` record to make sure your domain is pointing to `cf.skygearapis.io`.

After updating DNS records, run `skycli domain verify api.example.com` to verify domain.
```

### skycli domain verify

`skycli domain verify [CUSTOM_DOMAIN]`

Verify the given domain, if the verification fails. Will show the verification
instructions again.

After verification success. The domain will be usable immediately with letsencrypt ssl.

### skycli domain update

`skycli domain update [CUSTOM_DOMAIN] --key=[KEY_FILE] --cert=[CERT_FILE] --use-letsencrypt`

Setup or update domain tls certificates. Cert and key should be PEM-encoded X.509, RSA (2048) key.
Key and cert need to be provided at the same time.

#### Flags

- `--key=[KEY_FILE]` Provide custom tls key.
- `--cert=[CERT_FILE]` Provide custom tls cert.
- `--use-letsencrypt` Configure using let's encrypt certs for the given domain.

### skycli domain set-alias

`skycli domain set-alias [CUSTOM_DOMAIN] [CF_VERSIONED_LINK]`

Point the custom domain to specific CF version. Before setting the alias, the
custom domain will point to the default domain `[APP_NAME].skygear.io`.

#### Example

`skycli domain set-alias api.example.com myapp.[HASH].skygear.io`

### skycli domain list

`skycli domain list`

List all custom domain of apps.

### Example

```
$skycli app list-domain
DOMAIN              CUSTOM_CERTS            SSL_CERT_EXPIRY
api.myapp.com       true                    Apr 18 06:10:35 2019 GMT
test.myapp.com      false                   Apr 18 06:10:35 2019 GMT
```

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
NAME                    LAST_UPDATED
mongo_db_url            2019-01-31T15:00:00+08:00
aws_access_id           2019-01-31T15:00:00+08:00
aws_access_secret       2019-01-31T15:00:00+08:00
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

### skycli service list

`skycli service list`

Show supported external services, maybe different based on user's plan.

```
$ skycli service list
SERVICE NAME        STATUS
mongodb             true
mysql               false
s3                  false
```

### skycli service enable

`skycli service enable [SERVICE_NAME] [SERVICE_PARAMS...]`

Enable external service like mongodb, postsql... etc. `SERVICE_PARAMS` depends on
the services. The service credentials will be stored in secret.

#### Example
```
$ skycli service enable mongodb --size=50GB
> Enabling mongodb...
> Success!
> Created mongodb secret `mogodb_uri`
```
