# Re-organize Github Repo to focus on NEXT

## Repository layout

The top level is the git repository.

- skygear
    - gateway
    - auth gear
    - cloud functions and microservices
- skycli
- skygear-SDK-JS
- skygear-SDK-iOS
- skygear-SDK-Android
- skygear-controller
    - skycli and portal backend
    - manage cluster users
    - manage app tenant config
    - CF controller (deploy cf to openfaas)
- skygear-next-cloud
    - Documentation, instructions and scripts to create cloud version cluster
- skygear-deploy
    - Documentation, instructions and scripts to create EE version cluster
    - Documentation, instructions and scripts to run CE version (maybe another repo if they are too different)
- skygear-doc
- guides

## Todo Checklist

- skygear-server
    - Change `master` to `v1-record-id`, change `next` to `master`
    - Remove obsolete v1 code (Remove all v1 code, push, pubsub, record... etc. Except auth and gateway)
    - Update ci
        - Only run `next` test
        - Remove upload binary when creating github release
        - Update `docker-hub` and `quay` docker image deployment script to deploy `skygear-auth`, `skygear-gateway` and `skygear-migrate` images.

- skygear-SDK-JS
    - Change `master` to `v1-record-id`, change `next` to `master`
    - Remove obsolete v1 code (Remove all v1 code, push, pubsub, record... etc. Except auth)
    - We will deploy to the same package with version 2.0, so no change for the release

- skygear-SDK-iOS
    - Change `master` to `v1-record-id`, change `next` to `master`
    - Remove obsolete v1 code (Remove all v1 code, push, pubsub, record... etc. Except auth)
    - We will deploy to the same package with version 2.0, so no change for the release

- skygear-SDK-Android
    - Change `master` to `v1-record-id`, change `next` to `master`
    - Remove obsolete v1 code (Remove all v1 code, push, pubsub, record... etc. Except auth)
    - We will deploy to the same package with version 2.0, so no change for the release

- skycli
    - Change `master` to `v1-branch`
    - Remove all code and start next code in `master`

- skygear-doc and guides
    - Change `master` to `v1-branch`
    - Remove obsolete content and start new content in `master`. Use docs-staging.skygear.io to before release.
    - (When release) Deploy v1 guides and api reference to another domain and deploy v2.0 to docs.skygear.io

- Archive all v1 repositories
