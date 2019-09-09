# Microservice

## Overview

The document specifies the details of `type: http-service` of a deployment item.

## Configuration of the deployment item

### Microservice with docker

```yaml
deployments:
  my-awesome-service:
    type: http-service
    path: /api/
    port: 8888
    context: ./backend/service
    dockerfile: Dockerfile
    command: "<start server command>"
```

*`dockerfile`, `command` are optional.*

When the user run `skycli app deploy`, the following steps are taken:

1. Assert `./backend/service` to be a directory.
1. If `dockerfile` is specified, it is relative to `context`. Otherwise, the default value is `context/Dockerfile`.
1. Assert the Dockerfile to be a file.
1. Look for `<context>/.dockerignore`. If it is not present, the entire context is archived. Otherwise, use the same mechanism as `.dockerignore` to ignore files.
1. Upload the archive and save as an artifact.
1. Follow the existing docker deployment flow.
1. `command` is optional. If it is provided, it will be set as `args` of container spec in k8s.


### Microservice with preconfigured environment (e.g. nodejs)

```yaml
deployments:
  my-awesome-service:
    type: http-service
    path: /api/
    port: 3000
    context: ./backend/nodejs
    template: nodejs:10
    command: "npm start"
```

*`command` is optional.*

When the user run `skycli app deploy`, the following steps are taken:

1. Assert `./backend/service` to be a directory.
1. If `template` is specified, `skycli` will request the controller with `template` to download the template in `tarball` format.
1. Unzip the template and merge to the user code (see [Preconfigured environment](#preconfigured-environment) for details).
1. `skycli` will read the `<context>/.dockerignore` file and ignore files with the same mechanism as `.dockerignore`.
1. `skycli` will read the `<context>/.skyignore` file and ignore files with the same mechanism as `.gitignore`.
1. User should use `.skyignore` in their code, `.dockerignore` is provided by the template.
1. Upload the archive and save as an artifact.
1. Follow the existing deployment flow like deploying docker.
1. `dockerfile` cannot be specified in this flow, default dockerfile will be included in the template.
1. `command` is optional. If it is provided, it will be set as `args` of container spec in k8s. Template should provide default `ENTRYPOINT` and `CMD`.

When the built image is run, it must expose an HTTP service listening at `port`.

## Docker Image Registry

A Docker registry is deployed to store all microservice images.
It is served with plain HTTP and requires basic authentication.
The username and password of basic authentication is stored with a Kubernetes secret.
The backing storage of the registry is the cloud provider storage.

## Building the Docker Image

The docker image is built on the cluster rather the client machine.

Docker in Docker is used instead of using the Kubernetes' node docker daemon.
It allows us to build with a user specified docker version in the future.
The docker version is not configurable now.

A new Kubernetes Job is created to build a docker image from an artifact.
Before building the image, the docker daemon is not authenticated to the registry.
This should prevent malicious Dockerfile from accessing the registry.
After building the image, the docker daemon logins the registry with Kubernetes secret and
push the image to the registry.

## Deploying the microservice

A new model Microservice to represent the deployment item of microservice

```go
type MicroserviceStatus string

const (
  MicroserviceStatusPending MicroserviceStatus = "building"
  MicroserviceStatusBuildFail = "build_failed"
  MicroserviceStatusBuilt = "built" // At this time, Image is meaningful.
  MicroserviceStatusRunning = "running"
  MicroserviceStatusStopped = "stopped"
)

type Microservice struct {
  ID string
  AppID string
  Status MicroserviceStatus
  ArtifactID string
  Image string
  // The following fields are copied from the deployment item config.
  Path string
  Port string
  Context string
  Dockerfile string
}
```

A Kubernetes deployment of replicas 1 is created to deploy the microservice.
In the future, it is possible to have configurable replicas or even auto horizontal scaling.

## Routing to the microservice

The existing routing mechanism for cloud code is enhanced to support routing to microservices.

## Preconfigured environment

Folder structure of template

```
/Dockerfile
/.dockerignore
/.skygear/
```

Every `template` has its own `Dockerfile` and `.dockerignore`. For template that requires scripts, we should put them into the `.skygear` folder. If there is name conflict between template and user files, `skycli` will stop archiving with error message.

Templates will be defined based on language. For example, version 8, 10 and 12 will be supported in `nodejs`, and 2.7, 3.5, 3.6, 3.7 and 3.8 will be supported in `python`. If user want to use specific minor or patch version, they should write their own dockerfile.

### Nodejs example

Dockerfile

```Dockerfile
FROM node:12

WORKDIR /usr/src/app

COPY package*.json ./

RUN set -ex \
    && ([ -f package-lock.json ] && npm ci) \
    || ([ -f package.json ] && npm install)

COPY . .

CMD [ "npm", "start" ]
```

.dockerignore

```
node_modules
npm-debug.log
```
