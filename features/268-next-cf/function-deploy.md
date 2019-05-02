# Function deploy

This is a document that describes the complete flow of function deployment.

## Overview

A complete flow would go through the following steps:

- Create artfiact
- Create cloud code
- Deploy cloud code

## Create artifact

This step is to prepare an artifact record from local source code. The artifact record would be used to create cloud code in the next step.

```
           skycli
          +------------------+
          |                  |
          | Create source    |
          | code archive     |
          |                  |
          |                  |
          +---------+--------+
                    |
                    |
          +---------v--------+
          |                  |
          | Calculate        |
          | archive checksum |
          |                  |
          |                  |
          +---------+--------+
                    |
                    |                 skygear-controller
          +---------v--------+       +-----------------------+
          |                  |       |                       |
          | Find if artifact +-------> GET artifact          |
          | can be reused    <-------+ by appname + checksum |
          |                  |       |                       |
          |                  |       |                       |
          +---------+--------+       +-----------------------+
              Yes   |
+-------------------+
|                   |No
|         +---------v--------+       +-----------------------+
|         |                  |       |                       |
|         | Get presigned    +------->                       |
|         | upload request   <-------+ POST artifact_upload  |
|         |                  |       |                       |
|         |                  |       |                       |
|         +---------+--------+       +-----------------------+
|                   |
|                   |                                                storage backend
|         +---------v--------+                                      +-----------------------+
|         |                  |                                      |                       |
|         |                  +--------------------------------------> Create object in      |
|         | Upload archive   <--------------------------------------+ storage with the      |
|         |                  |                                      | archive               |
|         |                  |                                      |                       |
|         +---------+--------+                                      +-----------------------+
|                   |
|                   |
|         +---------v--------+       +-----------------------+
|         |                  |       |                       |
|         |                  +------->                       |
|         | Create artifact  <-------+ POST artifact         |
|         |                  |       |                       |
|         |                  |       |                       |
|         +---------+--------+       +-----------------------+
|                   |
+------------------>+
                    |
          +---------v--------+
          |                  |
          |                  |
          |   Artifact id    |
          |                  |
          |                  |
          +------------------+
```

## Create cloud code

This step is to prepare a cloud code record for the next step to deploy.

Note that this part does not really deploy anything or create anything in the function backend. The function backend only prepare the resource mapping for the next step to deploy.

```
 skycli                     skygear-controller              function backend
+------------------+       +-----------------------+       +-----------------------+
|                  |       |                       |       |                       |
| Create           +-------> POST cloud_code       +-------> Prepare               |
| cloud code       <-------+ by config +           <-------+ backend resource      |
|                  |       |    artifact_id        |       | mapping               |
|                  |       |                       |       |                       |
+---------+--------+       +-----------+-----------+       +-----------------------+
          |                            |
          |                            |
+---------v--------+                   |
|                  |                   |
|                  |                   |
|   Cloud code id  |                   |
|                  |                   | Submit
|                  |                   | async task
+------------------+                   |
                           +-----------v-----------+
                           |                       |
                           | Deploy cloud code     |
                           | with cloud code id    |
                           |                       |
                           |                       |
                           +-----------------------+
```

## Deploy cloud code

This step is where the cloud code really get deployed to the function backend.

Fission is used as an example here in the flow chart, so the steps for function backend may vary but the steps for skygear-controller should be the same.

At the same time of deploying, skycli should be waiting for the cloud code status changes from pending to other.

```
                                                                                                             skygear-controller(async)           fission
                                                                                                            +-----------------------+           +-----------------------+
                                                                                                            |                       |           |                       |  +------+
                                                                                                            |                       |           | Create package        |  |      |
                                                                                                            | Deploy cloud code     |     +-----> with presigned url +  <--+ Wait |
                                                                                                            |                       |     |     |      package_id       |  |      |
                                                                                                            |                       |     |     |                       |  +---^--+
                                                                                                            +-----------+-----------+     |     +------------+----------+      |
                                                                                                                        |                 |                  |                 |
                                                                                                                        |                 |          failed  |   pending       |
                                                                                                                        |                 | +----------------+-----------------+
                                                                                                            +-----------v-----------+     | |                |
                                                                                                            |                       |     | |                |sucess
                                                                                                            | Generate artifact     |     | |   +------------v----------+
                                                                                                            | presigned download    |     | |   |                       |
                                                                                                            | request               |     | |   | Create function       |
                                                                                                            |                       |     | +---+ with function_id      |
                                                                                                            +-----------+-----------+     | |   |                       |
                                                                                                                        |                 | |   |                       |
                                                                                                                        |                 | |   +------------+----------+
                                                                                                                        |                 | |                |
                                                                                                            +-----------v-----------+     | |        failed  |
                                                                                                            |                       |     | +----------------+
              skycli                     skygear-controller                                                 | Create                |     | |                |
             +------------------+       +-----------------------+                                           | backend resources     +-----+ |                |
+------+     |                  |       |                       |                                           |                       <-------+   +------------v----------+
|      |     | Check cloud code +-------> GET cloud code        |   trigger changes                         |                       |       |   |                       |
| Wait +-----> status           <-------+ by cloud_code_id      <------+                                    +-----------+-----------+       |   | Create http trigger   |
|      |     |                  |       |                       |      |                    failed                      |                   |   | with httptrigger_id   |
+---^--+     |                  |       |                       |      |                   +----------------------------+                   |   |                       |
    |        +---------+--------+       +-----------------------+      |                   |                            |success            |   |                       |
    |                  |                                               |      +------------v-------------+  +-----------v--------------+    |   +------------+----------+
    |         pending  |                                               |      |                          |  |                          |    |                |
    +------------------+                                               |      |                          |  | Update cloud code status |    |                |
                       |                                               +------+ Update cloud code status |  |            and           |    +----------------+
                       |running /                                      |      |                          |  | Update cloud code route  |
                       |deploy failed                                  |      |                          |  |                          |
                       |                                               |      +------------+-------------+  +-+---------+--------------+
             +---------v--------+       +-----------------------+      |                   |                  |         |
             |                  |       |                       |      +--------------------------------------+         |
             |                  +-------> GET log               |                          |                            |
             | Download log     <-------+ by cloud_code_id      |                          |                +-----------v-----------+
             |                  |       |                       |                          |                |                       |
             |                  |       |                       |                          |                | Check if needed to    |
             +------------------+       +-----------------------+                          |                | clean up old          |
                                                                                           |                | cloud code            |
                                                                                           |                |                       |
                                                                                           |                +-----------+-----------+
                                                                                           |  no                        |
                                                                                           +----------------------------+
                                                                                           |                            |yes
                                                                                           |                +-----------v-----------+
                                                                                           |                |                       |
                                                                                           |                | Update old cloud code |
                                                                                           |                | status                |
                                                                                           |                |                       |
                                                                                           |                |                       |
                                                                                           |                +-----------+-----------+
                                                                                           |                            |
                                                                                           |                            |
                                                                                           |                            |
                                                                                           |                +-----------v-----------+            +-----------------------+
                                                                                           |                |                       |            | Delete                |
                                                                                           |                | Delete                +------------> package and           |
                                                                                           |                | backend resources     <------------+ function and          |
                                                                                           |                |                       |            | http trigger          |
                                                                                           |                |                       |            |                       |
                                                                                           |                +-----------+-----------+            +-----------------------+
                                                                                           |                            |
                                                                                           |                            |
                                                                                           |                            |
                                                                                           |                +-----------v-----------+
                                                                                           |                |                       |
                                                                                           |                | Update old cloud code |
                                                                                           |                | status                |
                                                                                           |                |                       |
                                                                                           |                |                       |
                                                                                           |                +-----------+-----------+
                                                                                           |                            |
                                                                                           +---------------------------->
                                                                                                                        |
                                                                                                            +-----------v-----------+
                                                                                                            |                       |
                                                                                                            |                       |
                                                                                                            | Upload build log      |
                                                                                                            |                       |
                                                                                                            |                       |
                                                                                                            +-----------------------+

```
