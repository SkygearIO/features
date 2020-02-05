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

## Commands naming guidelines

**Format**

```
skycli [group] [verb/action] [parameters]
```

**Some common operations**

| Operation | Verb        |
|-----------|-------------|
| Create    | create      |
| Read      | view / list |
| Update    | update      |
| Delete    | remove      |


## Commands

- skycli auth
    - [skycli auth signup](commands.md#skycli-auth-signup)
    - [skycli auth login](commands.md#skycli-auth-login)
    - [skycli auth logout](commands.md#skycli-auth-logout)

- skycli config
    - [skycli config view](commands.md#skycli-config-view)
    - [skycli config set-cluster-server [https://1.2.3.4]](commands.md#skycli-config-set-cluster-server)

- skycli user
    - [skycli user list](commands.md#skycli-user-list)

#### Application commands

- skycli app
    - [skycli app create](commands.md#skycli-app-create)
    - [skycli app scaffold](commands.md#skycli-app-scaffold)
    - [skycli app list](commands.md#skycli-app-list)
    - [skycli app add-user [USER_EMAIL]](commands.md#skycli-app-add-user)
    - [skycli app view-config](commands.md#skycli-app-view-config)
    - [skycli app update-config -f [USER_CONFIG_YAML_FILE]](commands.md#skycli-app-update-config)
    - [skycli app get-k8s-credentials](commands.md#skycli-app-get-k8s-credentials)
    - [skycli app delete-k8s-credentials](commands.md#skycli-app-delete-k8s-credentials)
    - [skycli app deploy](commands.md#skycli-app-deploy)
    - [skycli app view-deploy](commands.md#skycli-app-view-deploy)

- skycli domain
    - [skycli domain add [CUSTOM_DOMAIN]](commands.md#skycli-domain-add)
    - [skycli domain verify [CUSTOM_DOMAIN]](commands.md#skycli-domain-verify)
    - [skycli domain view [CUSTOM_DOMAIN]](commands.md#skycli-domain-view)
    - [skycli domain update [CUSTOM_DOMAIN]](commands.md#skycli-domain-update)
    - [skycli domain remove [CUSTOM_DOMAIN]](commands.md#skycli-domain-remove)
    - [skycli domain list](commands.md#skycli-domain-list)

- skycli secret
    - [skycli secret list](commands.md#skycli-secret-list)
    - [skycli secret create [SECRET_NAME] [SECRET_VALUE]](commands.md#skycli-secret-create)
    - [skycli secret remove [SECRET_NAME]](commands.md#skycli-secret-remove)

- skycli service
    - [skycli service list](commands.md#skycli-service-list)
    - [skycli service enable [SERVICE_NAME] [SERVICE_PARAMS...]](commands.md#skycli-service-enable)

## Commands alias

- skycli login -> skycli auth login
- skycli logout -> skycli auth logout

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

### ${XDG_CONFIG_HOME:-$HOME/.config}/skycli/config

- cluster controller endpoint
- user credentials 

### ./skygear.yaml

- config version (If we have new config version in future, skycli will read the
  version and convert the previous config to the current version.)
- current app
- cloud functions configuration

#### Example
```
config_version: 1
app: myapp
deployments:
- name: function1
  type: http-handler
  path: /hello-world
  env: node
  src: js/hellow-world
  environment:
  - secret: DATABASE_URL
  permission:
    - name: key_required
    - name: user_required
...
```

## Use cases

- User creates app and uses skycli for app configuration without CF

    ```sh
    # Create app
    $ skycli app create

    ? What is your app name? myapp
    Creating app...
    Your API endpoint: https://myapp.api.skygear.io
    Your Client API Key: DSOJSDOSDKOJASNLSLC
    Your Master API Key: FJOADJOFAJOFJOASDJK
    Created app successfully!

    To setup app project directory, run:
        skycli app scaffold

    # User can choose whether to setup the project folder now.
    ? Do you want to setup the project folder now or you can do it later by
    `skycli app scaffold` command? (Y/n) n

    # Add user to app
    $ skycli app add-user dev@example.com --app=myapp

    # Update tenant config to enable welcome email
    $ skycli app update-config welcome_email --app=myapp
    ? Edit config. Press <enter> to launch your preferred editor.
    # Enter editor mode with existing config
    enabled: false
    sender: no-reply@skygeario.com
    sender_name: ''
    reply_to: ''
    reply_to_name: ''
    subject: 'Welcome!'
    email_html: |-
      <p>Hello {% if user.name %}{{ user.name }}{% else %}{{ user.email }}{% endif %},</p>

      <p>Welcome to Skygear.</p>

      <p>Thanks.</p>
    ~
    ~
    ~

    # User don't want to specify app for every commands, create app directory by scaffold command
    $ skycli app scaffold
    ? You're about to initialize a Skygear project in this directory: /Users/ubuntu/myapp
    Confirm? (Y/n)

    Fetching the list of your apps...
    ? Select an app to associate with the directory: (Use arrow keys)
    > myapp
      myapp2
      myapp3
    (Move up and down to reveal more choices)

    Fetching examples...
    ? Select example: (Use arrow keys)
    > empty
      js-example

    > Success! Initialized skygear.yaml config file in /Users/ubuntu/myapp.
    ```


- User creates app and wants to define auth hooks

    ```sh
    # Create app
    $ skycli app create

    ? What is your app name? myapp
    Creating app...
    Your API endpoint: https://myapp.api.skygear.io
    Your Client API Key: DSOJSDOSDKOJASNLSLC
    Your Master API Key: FJOADJOFAJOFJOASDJK
    Created app successfully!

    To setup app project directory, run:
        skycli app scaffold

    # User can choose whether to setup the project folder now.
    ? Do you want to setup the project folder now or you can do it later by
    `skycli app scaffold` command? (Y/n) Y

    # Create app directory with template example
    ? You're about to initialize a Skygear project in this directory: /Users/ubuntu/myapp

    Fetching examples...
    ? Select example: (Use arrow keys)
      empty
    > js-example

    Fetching js-example and initializing..
    > Success! Initialized "js-example" example in /Users/ubuntu/myapp.

    # Deploy application
    $ skycli cf deploy

    # Other application operations
    $ skycli app add-user dev@example.com
    ```
