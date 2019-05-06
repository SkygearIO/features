## skycli overview

### Global flags

`skycli [GROUP] [--app=APP_NAME] [ACTION]`

#### Flags

- `--app=APP_NAME` Provide app name for commands. Overrides the app provided in `skygear.yaml`.

#### Example
```
$ skycli app --app=myapp add-user [USER_EMAIL]
```

## skycli auth

### skycli auth signup

`skycli auth signup`

Signup cluster user, command will ask for password interactively.

#### Flags

- `--email=[EMAIL]` Provide user email.

### skycli auth login

`skycli auth login [--email=EMAIL]`

Login as cluster user, if no flags are provided. Will ask for email
and password interactively.

#### Flags

- `--email=EMAIL` Login as cluster user, ask for password interactively.

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

### skycli config set-cluster-server

`skycli config set-cluster-server --endpoint=[CLUSTER_SERVER_URL] --api-key=[API_KEY|MASTER_KEY]`

Change current cluster controller server endpoint and api key, it is provided
by cluster admin. If cluster admin want to use admin only api, they should provide
master key in the api key flag.

#### Flags

- `--endpoint=[CLUSTER_SERVER_URL]` Provide cluster controller endpoint url.
- `--api-key=[API_KEY|MASTER_KEY]` Provide api key.

## skycli user

### skycli user list

`skycli user list`

Master key only. List all cluster user.

## skycli app

### skycli app create

`skycli app create`

Create new app.

```
$ skycli app create

? What is your app name? myapp

Creating app...
Your API endpoint: https://myapp.api.skygear.io
Your Client API Key: DSOJSDOSDKOJASNLSLC
Your Master API Key: FJOADJOFAJOFJOASDJK
Created app successfully!

To setup app project directory, run:
    skycli app scaffold

? Do you want to setup the project folder now or you can do it later by
`skycli app scaffold` command? (Y/n) Y

You're about to initialize a Skygear project in this directory: /Users/ubuntu/myapp

Fetching examples...
? Select example: (Use arrow keys)
  empty
> js-example

Fetching js-example and initializing..
> Success! Initialized "js-example" example in /Users/ubuntu/myapp.
```

### skycli app scaffold

`skycli app scaffold [--app=APP_NAME] [--template=TEMPLATE]`

Create `skygear.yaml` in the root of app directory, the config file is required
to update app by using `skycli`.

#### Flags

- `--app=APP_NAME` Provide app name.
- `--template=TEMPLATE` Provide template name.

#### Example

```sh
# Interactive mode when app and template flags are not provided
$ skycli app scaffold

? You're about to initialize a Skygear project in this directory: /Users/ubuntu/myapp
Confirm? (Y/n)

Fetching the list of your apps...
? Select an app to associate with the directory: (Use arrow keys)
> myapp1
  myapp2
  myapp3
(Move up and down to reveal more choices)

Fetching examples...
? Select example: (Use arrow keys)
  empty
> js-example

Fetching js-example and initializing..
> Success! Initialized "js-example" example in /Users/ubuntu/myapp.
```

### skycli app list

`skycli app list`

List all user's app. If using admin key to call this app, list all the apps in
the cluster instead.

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

### skycli app deploy

`skycli app deploy [NAME]`

Deploy cloud functions by reading skygear.yaml config file. `[NAME]` is the name
of deployment items in the config file. If `[NAME]` is missing, the commands will
update everything based on the config.

#### Example

Given that we have `skygear.yaml` like this,

```
app: myapp
deployments:
  function1:
    type: http-handler
    path: /hello-world
    env: node
    src: js/hellow-world
    secrets:
      - DATABASE_URL
    permission:
      - name: key_required
      - name: user_required
  static-index:
    type: static
    src: index.html
    path: /
  static-asset:
    type: static
    src: asset
    path: /static
```

1. Running `skycli app deploy`, all deployment items will be deployed.
2. Running `skycli app deploy function1`, only http-handler `function1` will be deployed.


### skycli app view-deploy

`skycli app view-deploy`

List the deployment items of latest application version.

### Example

```
$skycli app view-deploy
NAME                TYPE             PATH
handler1            http-handler     /hello-world
function1           function         /function1
static-index        static           /
static-asset        static           /static
```

### skycli app logs

`skycli app logs [DEPLOYMENT_ITEM_NAME]`

Show logs of specific cloud code item (e.g. function, http-handler or http-service).

### skycli app invoke-function

`skycli app invoke-function [FUNCTION_NAME] --payload [PAYLOAD_JSON]`

Invoke cloud function.

#### Example
```
$skycli app invoke-function helloworld --payload {"string": "value", "int": 1}
{"result":"OK"}
```

#### Flags

- `--payload` Invoke function with payload
- `--access-key` Skygear auth access token

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
$skycli domain list
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

### skycli secret rename

Update secret name

`skycli secret rename [SECRET_NAME] [NEW_SECRET_NAME]`

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
