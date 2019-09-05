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
1. Command is optional. If it is specified, it will override the default command.

### Microservice with preconfigured environment (e.g. nodejs)

```yaml
deployments:
  my-awesome-service:
    type: http-service
    path: /api/
    port: 3000
    context: ./backend/nodejs
    running_environment: nodejs
    environment_version: "10"
    command: "npm start"
```

*`port`, `command`, `environment_version` are optional.*

When the user run `skycli app deploy`, the following steps are taken:

1. Assert `./backend/service` to be a directory.
1. If `running_environment` is specified, `skycli` will require the controller
server to get with `environment_version` to get the `Dockerfile` and default `port`.
1. Update deployment item with default port.
1. Look for `<context>/.dockerignore`. If it is not present, the entire context is archived. Otherwise, use the same mechanism as `.dockerignore` to ignore files. `Dockerfile` will be
added to the archive with default docker file path.
1. Upload the archive and save as an artifact.
1. Follow the existing deployment flow like deploying docker.
1. `dockerfile` cannot be specified in this flow, default docker file path will be used.
1. Command is optional. Controller provided Dockerfile should have default command.
If it is specified, it will override the default command.

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

To avoid maintain too many minor versions, only major versions will be
provided. For example, if user set `running_environment` to `nodejs` and
`environment_version` to `10`, docker base image `node:10` will be used. So the
latest minor version that provided by docker hub will be used during the build
time.
