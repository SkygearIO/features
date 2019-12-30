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
- `--password-stdin` Read password from stdin.

#### Example

```
# Provide password from file
$ cat ~/password.txt | skycli auth login --email user@example.com --password-stdin

# Provide password from environment variable
$ printf "$MY_PASSWORD" | skycli auth login --email user@example.com --password-stdin
```

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

### skycli config set-cluster

`skycli config set-cluster --cluster=[CLUSTER_NAME] --endpoint=[CLUSTER_SERVER_URL] --api-key=[API_KEY|MASTER_KEY]`

Change current cluster controller server endpoint and api key, it is provided
by cluster admin. If cluster admin want to use admin only api, they should provide
master key in the api key flag.

#### Flags

- `--cluster=[CLUSTER_NAME]` Provide cluster name, currently only `skygeario` is supported.
- `--endpoint=[CLUSTER_SERVER_URL]` Provide cluster controller endpoint url for custom cluster.
- `--api-key=[API_KEY|MASTER_KEY]` Provide api key for custom cluster.

#### Example

```sh
# Interactive mode
$ skycli config set-cluster
❯ skygeario 
  Connect to my own cluster 

# Select skygear cloud
$ skycli config set-cluster --cluster=skygeario

# Select user own cluster
$ skycli config set-cluster --endpoint=https://mycluster-controller --api-key=api_key
```

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

### skycli app view-user-config

`skycli app view-user-config`

View the current app user config in yaml format.

#### Example

```
$ skycli app view-user-config
master_key: xxxxx
api_key: xxxxx
sso:
  allowed_callback_urls:
  - http://127.0.0.1:5000/
  - http://localhost:5000/
  merge_users_with_identical_email: true
```

### skycli app update-user-config

`skycli app update-user-config -f [USER_CONFIG_YAML_FILE]`

Update user config interactively or by providing a file.

#### Example

**Update in editor**
```sh
$ skycli app update-user-config
? Edit user config. Press <enter> to launch your preferred editor.

# Enter editor mode with existing config
master_key: xxxxx
api_key: xxxxx
sso:
  allowed_callback_urls:
  - http://127.0.0.1:5000/
  - http://localhost:5000/
  merge_users_with_identical_email: true
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
# 1. If you don't have a copy of the user config file, get it from the view command.
$ skycli app view-user-config > ./user-config.yaml

# 2. Update the user-config.yaml file

# 3. Apply the change to the app
$ skycli app update-user-config -f ./user-config.yaml
```

### skycli app deploy

`skycli app deploy`

Deployment all items in the skygear.yaml. If previously deployed items are
removed from the config file, there will be a confirmation prompt.

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

## skycli domain

#### Overview

### skycli domain add

`skycli domain add [CUSTOM_DOMAIN]`

This command will only add domain into the app. The domain is not usable in
this stage. User need to verify the domain.

#### Example

```
$ skycli domain add api.example.com
Added domain api.example.com successfully!

Add following DNS records in your DNS provider.

  TYPE    HOST                     VALUE
  TXT     _skygear.example.com     5636486ffc5a4dfebf4a13f480bd9a95
  A       api.example.com          <ingress controller lb ip>

After updating DNS records, run `skycli domain verify api.example.com` to verify domain.
```

### skycli domain verify

`skycli domain verify [CUSTOM_DOMAIN]`

Verify the given domain, if the verification fails. Will show the verification
instructions again.

After verification success. The domain will be usable immediately with letsencrypt ssl.

### skycli domain update

`skycli domain update [CUSTOM_DOMAIN] --tls-secret=[SECRET_NAME] --use-letsencrypt`

Update domain tls certificates, user can only provide either `tls-secret` or `use-letsencrypt`.

#### Flags

- `--tls-secret=[SECRET_NAME]` Custom certificate secret name.
- `--use-letsencrypt` Configure using let's encrypt certs for the given domain.

### skycli domain list

`skycli domain list`

List all custom domain of apps.

### Example

```
$skycli domain list
DOMAIN              VERIFIED         CUSTOM_CERT        SSL_CERT_EXPIRY               CREATED_AT
api.myapp.com       true             true               2020-11-26 20:00:00 +08:00    2019-11-26 18:00:00 +08:00
test.myapp.com      true             false              -                             2019-11-30 18:00:00 +08:00
test2.myapp.com     false            false              -                             2019-11-30 18:00:00 +08:00
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

`skycli secret create [SECRET_NAME] [SECRET_VALUE] --type=[SECRET_TYPE] --file==[FILE_NAME] --cert=[PEM_ENCODED_CERT_FILE] --key=[PEM_ENCODED_KEY_FILE]`

Create new secret in app

#### Flags

- `--type` Secret type, used to facilitate programmatic handling of secret data. Available types: `opaque`, `dockerconfigjson`. Default is `opaque`.
    - `opaque`: Secret used in environment variable.
    - `dockerconfigjson`: Docker config used as image pull secret.
    - `tls`: TLS secret for custom domain, create from the given public/private key pair.

- `--file` Secret value from file. Supported types: `opaque`, `dockerconfigjson`.
- `--cert` Path to PEM encoded public key certificate. Supported type: `tls`. Required.
- `--key` Path to private key associated with given certificate. Supported type: `tls`. Required.

#### Examples

Create docker config secret named my-secret with json file:

```
skycli secret create my-secret --type=dockerconfigjson --file=path/to/config.json
```

Create TLS secret named myapp.example.com-tls with the given key pair:

```
skycli secret create myapp.example.com-tls --type=tls --cert=path/to/tls.cert --key=path/to/tls.key
```

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
