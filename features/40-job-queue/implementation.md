# Implemntation for Job Queue

## Skygear Server

* Add action `job:enqueue` to enqueue delayed/scheduled jobs
* Add action `job:cancel` to cancel an enqueued job
* Integrate with an existing open source job queue implementation or created our
  own.
* Support registering lambda function that can only be called from the server.
* Delete dead job and clean completed jobs

### `job:enqueue`

This action requires the use of a master key.

#### Request

* `job` (object) the job definition
   * `action` (string) the name of the lambda to call
   * `args` (array or map) the argument to be passed to the lambda
* `job_id` (string, optional) the ID of the job, server generated if not specified
  or empty
* `run_at` (datetime in ISO format, optional) the time when the job is
  scheduled, to be run immediately after if this is not specified
* `replace` (bool, default false) replace existing job with ID

#### Response

If the job is successfully enqueued, the server will respond with a job ID:

* `job_id` (string) the ID of the job

If there is an existing job and replace is false, the `Duplicated` error will be
returned.

### `job:cancel`

This action requires the use of a master key.

#### Request

* `job_id` (string) the ID of the job to cancel

#### Response

If the job is successfully cancelled, the server will respond with a job ID:

* `job_id` (string) the ID of the job

If there is no job to delete, the `ResourceNotFound` error is returned.

### Job queue management and job dispatch

It is planned to use gocraft/work to implement job queue management and job
dispatch. Job is dispatched via existing plugin transport mechanism.

We will need to implement custom gocraft/work Enqueuer which does the following:

* allow client to specify job ID
* allow replacing existing job with the same job ID (replace = true)
* reject request to enqueue job with the same job ID (replace = false)

Job cancellation is implemented with `DeleteScheduledJob`.

### Lambda Registration and Handler

The lambda registry will support lambda registration that is `server_only` in
lambda registration info. If `server_only` is true, the LambdaHandler should
reject the lambda request.

## Plugin runtime

* New decorator/registration function `job` (TBD)
  * Register a lambda with `server_only=true` behind the scene
* Add `priority` to lambda and job decorator/registration function
* Add support for specifying worker priority in the command line or environment
  variable.
