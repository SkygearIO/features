# Overview

Skygear Cloud Function (CF) is a platform for skygear user to deploy custom logic.

The followings list what are included in CF.

- Fission
- CF Gateway
  - It acts like a proxy of Fission gateway
  - It transforms Skygear requests to Fission requests
- CF Controller
  - It manages functions in Fission
- CF Config Store
  - For CF Gateway, it tells how the request should route to Fission Router
  - For CF Controller, it stores functions configurations
  - Roughly what each function stores: id + path + fission path + config

*Note that: except Fission, these components are more like mental model, they may be merged with existing components, like gateway and its database.*

Here is the diagram of all components. Intereactions between components will be shown in below sections.

```
                                              +-------------------+
                                              |                   |
                                              |                   |
                                              |   Gateway         |
                                              |                   |
                                              |                   |
                                              +-------------------+





+-------------------+                         +-------------------+             +-------------------+           +-------------------+
|                   |                         |                   |             |                   |           |                   |
|                   |                         |                   |             |                   |           |                   |
|   Auth gear       |                         |   CF Gateway      |             |   CF Config Store |           |   CF Controller   |
|                   |                         |                   |             |                   |           |                   |
|                   |                         |                   |             |                   |           |                   |
+-------------------+                         +-------------------+             +-------------------+           +-------------------+


                                  +-------------------------------------------------------------------+
                                  |OpenFaas/Fission                                                   |
                                  |           +-------------------+                                   |
                                  |           |                   |                                   |
                                  |           |                   |                                   |
                                  |           |   Gateway         |                                   |
                                  |           |                   |                                   |
                                  |           |                   |                                   |
                                  |           +-------------------+                                   |
                                  |                                                                   |
                                  |                                                                   |
                                  |                                                                   |
                                  |           +----------------------------------------------+        |
                                  |           |                                              |        |
                                  |           |                                              |        |
                                  |           |               Function pods                  |        |
                                  |           |                                              |        |
                                  |           |                                              |        |
                                  |           |                                              |        |
                                  |           +----------------------------------------------+        |
                                  |                                                                   |
                                  |                                                                   |
                                  +-------------------------------------------------------------------+

```

## Function deployment

```
                                              +-------------------+
                                              |                   |
                                              |                   |
                                              |   Gateway         |
                                              |                   |
                                              |                   |
                                              +-------------------+                                              Request from skycli
                                                                                                                        +
                                                                                                                        |
                                                                                                                        |
                                                                                                                        |
                                                                                                                        |
+-------------------+                         +-------------------+             +-------------------+           +-------v-----------+
|                   |                         |                   |             |                   |           |                   |(Reject if not login or
|                   |                         |                   |             |                   |           |                   |not enough permission)
|   Auth gear       |                         |   CF Gateway      |             |   CF Config Store <-----------+   CF Controller   |
|                   |                         |                   |             |                   |Update     |                   |
|                   |                         |                   |             |                   |           |                   |
+-------------------+                         +-------------------+             +-------------------+           +-------------------+
                                                                                                                        |Call corresponding api to
                                                                                                                        |OpenFaas gateway or k8s cluster
                                  +-------------------------------------------------------------------+                 |
                                  |OpenFaas/Fission                                                   |                 |
                                  |           +-------------------+                                   |                 |
                                  |           |                   |                                   |                 |
                                  |           |                   |                                   |                 |
                                  |           |   Gateway         <-----------------------------------------------------+
                                  |           |                   |                                   |
                                  |           |                   |                                   |
                                  |           +-------------------+                                   |
                                  |                                                                   |
                                  |                                                                   |
                                  |                                                                   |
                                  |           +----------------------------------------------+        |
                                  |           |                                              |        |
                                  |           |                                              |        |
                                  |           |               Function pods                  |        |
                                  |           |                                              |        |
                                  |           |                                              |        |
                                  |           |                                              |        |
                                  |           +----------------------------------------------+        |
                                  |                                                                   |
                                  |                                                                   |
                                  +-------------------------------------------------------------------+
```

## Function invocation

```
                                                  HTTP Request
                                                      +
                                                      |
                                                      |
                                                      |     Is it a request to the gear?
                                              +-------v-----------+
                                              |                   |
                                    Yes       |                   |
         +------------------------------------+   Gateway         |
         |                                    |                   |
         |                                    |                   |
         |                                    +-------------------+
         |                                            |No
         |                                            |
         |                                            |
         |                                            |
         |                                            |
+--------v----------+                         +-------v-----------+             +-------------------+           +-------------------+
|                   |                         |                   |             |                   |           |                   |
|                   |                         |                   +------------->                   |           |                   |
|   Auth gear       |                         |   CF Gateway      |Lookup       |   CF Config Store |           |   CF Controller   |
|                   |                         |                   |routing      |                   |           |                   |
|                   |                         |                   |             |                   |           |                   |
+-------------------+                         +-------------------+             +-------------------+           +-------------------+
                                                      |Route to the
                                                      |corresponding function
                                  +-------------------------------------------------------------------+
                                  |OpenFaas/Fission   |                                               |
                                  |           +-------v-----------+                                   |
                                  |           |                   |                                   |
                                  |           |                   |                                   |
                                  |           |   Gateway         |                                   |
                                  |           |                   |                                   |
                                  |           |                   |                                   |
                                  |           +-------------------+                                   |
                                  |                                                                   |
                                  |                                                                   |
                                  |                                                                   |
                                  |           +----------------------------------------------+        |
                                  |           |                                              |        |
                                  |           |                                              |        |
                                  |           |               Function pods                  |        |
                                  |           |                                              |        |
                                  |           |                                              |        |
                                  |           |                                              |        |
                                  |           +----------------------------------------------+        |
                                  |                                                                   |
                                  |                                                                   |
                                  +-------------------------------------------------------------------+
```

# Components

## CF Controller

This provides APIs for skygear users to manage functions under their own authority.

CF Controller would delegate the operations by accessing Fission api directly.

Here is the list of APIs:
- List all deployed functions
- Get configuration, status and metrics of a function
- Create / deploy new function
- Update the configration of a function
  - This will trigger new deployment of the function
- Remove a function
- View log of a function
- Set function version (explain in later section)
- Add secrets

CF Controller is multi-tenant. Skygear users must login to skycli beforehead.

## CF Gateway

CF Gateway receives request from Gateway, and
- forward the request to corresponding function in Fission router
- for configurations of a function would be carried out in the CF Gateway, e.g.
  - access control by keys, roles, etc, the CF Gateway connect to auth gear or the db directly to do authz
  - secrets injection (or use k8s secrets? can be discussed)

### Routing to Fission

Function path is generated by controller, it must be uniquely defined for Fission. CF Gateway will do the path rewrite, based on the cloud code route store.

See [Route matching](#route-matching) for the full picture of routing when a request enters the cluster.

## CF Config Store

For the cloud config model, please see [interface](./interface.md)

### Immutable deployment

When function of the same name get deployed again, a new record of a version of the function would be created and the old function would not be deleted immediately. There would be a number of version of the same function deployed on Fission.

By default, the latest version of the function would be exposed to the endpoint as configured by the skygear user. When there are needs to access to older version, the request only need to includes the version hash to tell the CF Gateway to invoke the specific version. (Where and how to put the version hash can be further discussed, e.g. path or header)

Depending on our pricing model and resource management on cloud, when new version of a function is deployed, the older version may be stopped to restrict concurrent functions. And older versions may be restricted to sleep in a shorter period of idle time.

Skycli may have command to set the current version of a function to a specific version.

Update: [CF versioning](./versioning.md)

# Function configuration

Function configuration may be placed in the file for other skycli configuration.

Example:

```yaml
deployments:
- name: function1
  type: http-handler
  path: /hello-world
  env: nodejs
  src: js/hellow-world
  environment:
  - secret: DATABASE_URL
  permission:
    - name: key_required
    - name: user_required
```

- `deployments` is an array of deployment items.
- `name` is the name of deployment item, item deployed with the same name will considered as the same item with different version
- `type` is the type of the function
  - `http-handler`
    - a single function that accepts http requests from an exact path
    - anytime may be scaled down to zero
  - `http-service`
    - an http server that accepts http requests from the path
    - may be long running
  - `function`:
    - a single function (in a program) that read input from stdin and write output to stdout
    - anytime may be scaled down to zero
- `env` indicates the environment that the code would be built with, e.g.
  - `docker` is the base environment that the Dockerfile would be deployed directly, or would be wrapped by another minimal Dockerfile
  - environment of other languages (e.g. `node`, `python`, `golang`) would accept source files from the developers and build with a Dockerfile provided by us
  - `http-handler`, `http-service` and `function` only
- `src` may specify where to find Dockerfile or source code files
- `secrets` list what secrets would be passed to the functions, developer need to set secrets with skycli
  - `http-handler`, `http-service` and `function` only
- `permission` describes how the request can access the function
  - `key_required`, if true, need API key or master key
  - `user_required`, if true, need access token of a verified and not disabled user
  - `admin_required`, if true, need the user have admin role
  - `role_required` with `roles` tells the function require specified roles
  - `http-handler`, `http-service` and `function` only

**Configure auth hooks**

Both function, http-handler, http-service or external links can accept auth
hooks, hooks can be defined in the `hooks` section in `skygear.yaml`.

```
deployments:
- name: function1
  type: http-handler
  path: /hello-world
  env: nodejs
  src: js/hellow-world
  environment:
  - secret: DATABASE_URL
- name: api
  type: http-service
  path: /api
  context: express
  port: 8080

hooks:
  - url: /api/after_signup
    event: after_signup
  - url: http://external-service.com/signup-hook
    event: after_signup
```

- `hooks` defines list of auth hooks event listener. Auth gear will make http
    `POST` request to the url when the event happens.
  - `url` is the endpoint that accepts the auth event. If the value is full url,
    auth gear will call the provided url directly. If the value is path only,
    api endpoint url (e.g. https://myapp.skygear.io) will be added.
  - `event` is the name of the listening event

# Serving content

## Server side rendering

`http-service` would fulfill server side rendering because it works on http request and response, developers can
- get the path of the request after the gateway rewrite
- set the corresponding http headers and write content to the response body

# Route matching

To easily distinguish gear route and non-gear route, I suggest we add the following two rules:
- All gear routes start with `_`, e.g. auth gear routes are `/_auth/`, signup path would be `/_auth/signup`
  - So any request with its path start with `_` would be considered request to gear
- Non-gear path cannot be start with `_`

Here is the route matching rules when a request enter the cluster:
- If the path starts with `_`, it would try find the gear by matching `/_{gear_name}` first
  - If a gear is found, the request would be forwarded to that gear
  - Otherwise, return function not found error
- Trailing slash in `path` is insignificant. That is, `/a` and `/a/` is equivalent.
- All paths are matched in a longest prefix match fashion.
- There is no partial match. That is, the pattern `/a` does not match the path `/apple`.
- The matched prefix of `http-service` is removed.
- If none of the registered path is matched, return not found error.

For example, with the following skycli configuration:

```yaml
deployments:
- name: functionABC
  type: function
  path: /functionABC
  # other config
- name: function-server
  type: http-service
  path: /function
  # other config
- name: api-server
  type: http-service
  path: /api
  # other config
```

- `https://myapp.skygear.io/function/ABC` -> `function-server`, forwarded path `/ABC`
- `https://myapp.skygear.io/function/ABC/` -> `function-server`, forwarded path `/ABC/`
- `https://myapp.skygear.io/functionABC` -> `functionABC`
- `https://myapp.skygear.io/functionABC/` -> `functionABC`
- `https://myapp.skygear.io/functionABCD` -> Not found
- `https://myapp.skygear.io/function/` -> `function-server`, forwarded path `/`
- `https://myapp.skygear.io/function` -> `function-server`, forwarded path `/`
- `https://myapp.skygear.io/api/function` -> `api-server`, forwarded path `/function`
- `https://myapp.skygear.io/api/` -> `api-server`, forwarded path `/`
- `https://myapp.skygear.io/api` -> `api-server`, forwarded path `/`

# Example Configuration

## Mixing functions with micro-service

```yaml
deployments:
- name: function1
  type: http-handler
  path: /function1
  env: node
  src: /functions/1
  permission:
    - name: key_required
- name: function2
  type: http-handler
  path: /function2
  env: node
  src: /functions/2
  permission:
    - name: key_required
    - name: user_required
- name: api-server
  type: http-service
  path: /api
  env: node
  src: js
  environment:
  - secret: DATABASE_URL
  permission:
    - name: key_required
    - name: user_required
```

There are three separate function configurations here, the `api-server` is a `http-service` so will match all `/api/*` request.


## Server side rendering and api server

```yaml
deployments:
- name: ssr-server
  type: http-server
  path: /
  env: js
  src: web
- name: api-server
  type: http-service
  path: /api
  env: golang
  src: api
  environment:
  - secret: DATABASE_URL
```

# Security Concern

## Restricted access to skygear gateway and gear pods in the same k8s cluster

By default, all pods on the same k8s cluster will have a pod IP which is accessable by other pods in the same cluster. Since cloud function pods are in the same pods of skygear gateway and gear pods, cloud functions can call API to those pods directly.

Skygear gateway is responsible for injecting tenant configuration and access key type to the request that is forwarded to the gears. And unless the gears verify the requests from the gateway, it would be unprotected, e.g. cloud function can act as another app by injecting tenant configuration in the header.

We have two options:
- Gears need to verify requests from gateway, maybe by having a shared secret
- Applying network policy to restrict traffic between gear pods and other pods, https://kubernetes.io/docs/concepts/services-networking/network-policies/#isolated-and-non-isolated-pods

# Features

## Private functions / Micro-service discoverability

- If a pod needs to be discovered by external network, services need to be setup
- CF Gateway may block function request from outside if a function is marked as private
- If a `http-service` needs to be discovered another one, services need to be setup, and developer need specify which functions need to discover that `http-serivce`, network policy may be setup to restrict the discoverability. The config should be something like `link` in docker-compose config file.

```yaml
deployments:
- name: service-internal
  type: http-service
  private: true
  # other config
- name: api-server
  type: http-service
  path: /api/
  link:
    - service-internal
  # other config
```

*Need to prove if this feature can be implemented in a user-friendly way, i.e. wheather one service can connect to another one by a custom hostname, or they must use one given by k8s. Please see the notes below.*

Notes:
- DNS for service for internal discoverability: https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/#services
- Feature request: support dns aliases for service: https://github.com/kubernetes/kubernetes/issues/39792

## Parameterised Paths in HTTP handler

Currently, micro-service allow developers to do routing in the app, while others need exact match of path.

## Optimisation for development

- Easy for developers to write and run functional / integration test for each endpoint #204 (https://github.com/SkygearIO/features/issues/204)
- Easy for debug (such as hot reload & local testing #170 (https://github.com/SkygearIO/features/issues/170)?)

## Support triggers by HTTP and cronjob

- HTTP: Fission natively support
- (TBD) Cronjob: k8s cronjob or fission time trigger see (https://docs.fission.io/usage/trigger/#create-a-time-trigger)

## Logging (TBD)

- For the current design, only logging per function is supported
- Need to handle the case of function which relies on stdin and stdout for function input and output. e.g. how to distinguish between log and function output
- Stream / search logs

## Custom domain and SSL certs

- Allow custom ssl certs #153 (https://github.com/SkygearIO/features/issues/153)
- Custom Domains Support #246 (https://github.com/SkygearIO/features/issues/246)

Handled by the k8s ingress controller. Skycli may provide command for skygear user to add these features.

## Secret management

With immutable deployment, secrets are also immutable. For managing secrets,
following operations are allowed.

- skycli secret create
- skycli secret remove

To avoid human error, deployment will be failed if config file is using secrets
that are not exist. Removing secret will not affect existing deployment.

### Example: Key rotation

1. Create new secret with another key.
2. Update `skygear.yaml` `environment` to use new secret key and re-deploy.
3. Test and see if new deployment works.
4. Remove the old secret by `skycli secret remove`.

### Implementation Details

**Secret Model**

- id
- name
- k8s_secret_name
- created_at
- app_id
- deleted

Controller will only store the secret name to k8s secret name mapping. Controller
will not keep a copy of the secret value, the values will be stored in k8s only.
`skycli secret remove` will only soft delete the mapping record, the k8s secret
will still be there, in case some old deployment are using them. After a secret
is removed, it cannot be used in the new deployment. Rename a secret will soft
delete the mapping record, and re-create a new secret with new name.

When deploying a cloud function, skygear user can specify the secrets for a
function. Controller will check the mapping and create fission function with
k8s secrets. Fission support reading secrets value from files. We will update
the fission environment runtime to convert those values to environment variable,
so skygear user can access those secret form env.

## Batch deploy items in skygear.yaml

`skycli app deploy` will deploy all deployment items in `skygear.yaml`.
`skycli app deploy [ITEM_NAME]` will only create or update item with name
`[ITEM_NAME]`.

When user use `skycli app deploy`, they need to have all items in the
`skygear.yaml`. The deployment will not keep the previously deployed item, if
they don't exist in `skygear.yaml`. e.g. User had deployed function 1 to 4. If
user run deploy with a config file that only has function 1 to 2. The new
version app will only have function 1 to 2. User has responsibility to keep the
full version of `skygear.yaml` and codes.

User can create or update particular item by `skycli app deploy [ITEM_NAME]`.
e.g. User had deployed function 1 to 4. If user use
`skycli app deploy function5` to deploy function 5, the new app version will
have function 1 to 5 after deployment.

### Implementation Details

#### Models

**`deployment`**

Every deployment (one or multiple items) will create a new deployment.

- `id`
- `created_at`: deployment time
- `app_id`: skygear app id
- `version`: deployment version, uuid or hash
- `tag`: deployment tag, the live version will have tag with `latest`
- `status`: deployment status (pending, running, deploy failed, stopping, stopped, stop failed)

**`deployment_cloud_code`**

deployment to cloud_code relationship

- `deployment_id`
- `cloud_code_id`

**`cloud_code_route`**

Denormalized routing table for gateway routing.

- `id`
- `created_at`
- `version`: deployment version, will be the same as `version` of `deployment`
- `path`: user defined path
- `target_path`: skygear internal path for cloud code routing 
- `app_id`: skygear app id
- `backend_url`: cloud code backend url
- `tag`: deployment tag, the live version will have tag with `latest`

#### Deployment and Cloud Code Status

Deployment and cloud code status values: pending, running, deploy failed, stopping, stopped, stop failed

Status of deployment flow

```
          +
          | Start deploy
+---------v-----------+              +-----------------------------------------+
| Deployment: pending |  same failed |Deployment: deploy failed                |
| Cloud code: pending +-------------->Cloud code: running/pending/deploy failed|
+---------+-----------+              +-----------------------------------------+
          |
          | all success
          |
+---------v-----------+
| Deployment: running |
| Cloud code: running |
+---------------------+
```

Status of cleanup flow

```
         + Start cleanup
         |
+--------v-----------+             +----------------------------------------+
|Deployment: stopping| same failed |Deployment: stop failed                 |
|Cloud code: stopping+------------->Cloud code: stopping/stopped/stop failed|
+--------+-----------+             +----------------------------------------+
         |
         | all success
         |
+--------v-----------+
|Deployment: stopped |
|Cloud code: stopped |
+--------------------+
```

#### Deployment flow

- Deploy api accept multiple deploy items
- Validate
  - Validate items payload
  - Validate items whether paths have conflict
- Create `deployment`, `cloud_code`, `deployment_cloud_code`
- Call deploy async task and return deployment id
- In async task, deploy items sequentially. (Don't deploy them
  simultaneously to avoid high server load.)
  - If deployment fails in the middle, update deployment status and stop.
  - If all items are deployed successfully, update deployment status. Unset
    pervious deployment tag and update current deployment as latest. Unset
    pervious cloud_code_route tag, create new cloud_code_route with latest
    tag. Avoid occupying resources, trigger cleanup task to remove old
    deployed resources (Before support multiple version).
- skycli use deployment id to keep track the deployment status when the async
  task is running

#### Improvement

- During deployment, skip the items if there are no change in content
  (code) and config. By checking the zip checksum.
