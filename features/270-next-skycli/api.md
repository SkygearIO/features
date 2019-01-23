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

## Commands

- skycli config
    - skycli login
    - skycli logout
    - skycli config

- skycli user
    - skycli user create
    - skycli user list

- skycli app
    - skycli app list
    - skycli app create
    - skycli app add-user [email]
    - skycli app view
    - skycli app update-config -f [tenant-config.yaml]
    - skycli app add-domain [myapp.com]

- skycli cf
    - skycli cf list
    - skycli cf deploy [function_name]
    - skycli cf logs [function_name]


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
