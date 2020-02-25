## skycli overview

### Global flags

`skycli [GROUP] [--app=APP_NAME] [ACTION]`

#### Flags

- `--app=APP_NAME` Provide app name for commands. Overrides the app provided in `skygear.yaml`.
- `--context=CONTEXT_NAME` Provide context name for commands. Overrides the current context in config.

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
and password interactively. The logged in user will be associated with current
context.

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
api_version: v1
clusters:
  - name: skygeario
    cluster:
      env: cloud
      endpoint: 'https://controller.example.com'
      api_key: api-key
users: []
contexts:
  - name: skygeario
    context:
      cluster: skygeario
      user: skygeario
current_context: skygeario
```

### skycli config set-cluster

`skycli config set-cluster --cluster=[CLUSTER_NAME] --endpoint=[CLUSTER_SERVER_URL] --api-key=[API_KEY|MASTER_KEY]`

Configure Cluster endpoint and API key, it is provided by cluster admin.
If there is no current context set, the configured Cluster would be set as the
current context.
If there exist a cluster with same name, it is updated with provided
information.

#### Flags

- `--cluster=[CLUSTER_NAME]` Provide cluster name.
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
$ skycli config set-cluster --cluster=my-cluster --endpoint=https://mycluster-controller --api-key=api_key
```

### skycli config get-contexts

`skycli config get-contexts`

Get all configured contexts. Current context is indicated with an asterisk.

#### Example

```sh
$ skycli config get-contexts
CURRENT   CLUSTER             USER            
          skygeario                           
*         skygeario-staging   user@example.com
```

### skycli config use-context

`skycli config use-context [CONTEXT_NAME]`

Change current context.

#### Flags

- `[CONTEXT_NAME]`: Context name

#### Example

```sh
$ skycli config use-context skygeario
Current context changed to 'skygeario'.
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

### skycli app view-config

`skycli app view-config`

View the current app config in yaml format.

#### Example

```
$ skycli app view-config
version: '2'
app_config:
  master_key: xxxxx
  api_key: xxxxx
  sso:
    allowed_callback_urls:
    - http://127.0.0.1:5000/
    - http://localhost:5000/
    merge_users_with_identical_email: true
```

### skycli app update-config

`skycli app update-config -f [USER_CONFIG_YAML_FILE]`

Update config interactively or by providing a file.

#### Example

**Update in editor**
```sh
$ skycli app update-config
? Edit config. Press <enter> to launch your preferred editor.

# Enter editor mode with existing config
version: '2'
app_config:
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
# 1. If you don't have a copy of the app config file, get it from the view command.
$ skycli app view-config > ./app-config.yaml

# 2. Update the app-config.yaml file

# 3. Apply the change to the app
$ skycli app update-config -f ./app-config.yaml
```

### skycli app get-k8s-credentials

`skycli app get-k8s-credentials`

Fetch the credentials to access k8s resources with kubectl using current context.
The credentials are written to the machine's kubeconfig.

The name of the k8s context is `skygear-<cluster-name>-<app-name>`.

This command requires the presence of kubectl in PATH.

#### Example

```sh
$ skycli --app myapp app get-k8s-credentials
Run kubectl config use-context skygear-skygear-production-myapp to switch to the context of this app.
```

### skycli app delete-k8s-credentials

`skycli app delete-k8s-credentials`

Delete the config from the local machine's kubeconfig.

This command requires the presence of kubectl in PATH.

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

### skycli domain view

`skycli domain view [CUSTOM_DOMAIN]`

View the given domain, to retrieve the DNS records for verification.

#### Example

```
$ skycli domain view api.example.com

General

  DOMAIN              VERIFIED         CUSTOM_CERT        SSL_CERT_EXPIRY               CREATED_AT
  myapp.myapp.com     true             true               2020-11-26 20:00:00 +08:00    2019-11-26 18:00:00 +08:00

DNS records

  TYPE      HOST                     VALUE
  TXT       _skygear.example.com     5636486ffc5a4dfebf4a13f480bd9a95
  A         api.example.com          <ingress controller lb ip>

```

### skycli domain update

`skycli domain update [CUSTOM_DOMAIN] --tls-secret=[SECRET_NAME] --use-letsencrypt --disable-redirect --redirect-domain=[REDIRECT_DOMAIN]`

Update domain tls certificates and configure redirect, user can only provide either `tls-secret` or `use-letsencrypt`.

#### Flags

- `--tls-secret=[SECRET_NAME]` Custom certificate secret name.
- `--use-letsencrypt` Configure using let's encrypt certs for the given domain.
- `--disable-redirect` Disable domain redirect.
- `--redirect-domain` Configure domain redirect, 307 redirect will be performed.


### skycli domain remove

`skycli domain remove [CUSTOM_DOMAIN]`

Remove custom domain.


### skycli domain list

`skycli domain list`

List all custom domain of apps.

### Example

```
$skycli domain list
DOMAIN              VERIFIED         CUSTOM_CERT        REDIRECT          SSL_CERT_EXPIRY               CREATED_AT
myapp.com           true             false              www.api.com       -                             2019-11-30 18:00:00 +08:00
api.myapp.com       true             true               -                 2020-11-26 20:00:00 +08:00    2019-11-26 18:00:00 +08:00
www.myapp.com       true             false              -                 -                             2019-11-30 18:00:00 +08:00
test2.myapp.com     false            false              -                 -                             2019-11-30 18:00:00 +08:00
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
