# Job Queue

## Use Cases

* For cloud function that need to send an email to the user, it is preferable
  to send the email outside the request lifecycle (i.e. async) because sending
  email typically takes multiple seconds
* After liking a post, the user statistics may need to be updated, which could
  take several seconds.
* Sending a notification reminder to a user who added products to shopping,
  these notifications is scheduled in the future and notification can be
  cancelled in case the user has completed the order.
* Retrying a failed job and/or cancelling a job.

## Requirements

* Enqueue a job asynchronously.
* Enqueue a job to be executed at a date/time.
* Support enqueuing job with parameters.
* Support job cancellation.
* Support job retry.
* Maintenance such as deleting completed jobs or jobs that are too old.
* Support enqueuing job written in JS from Python and vice versa.

To futher enhance the feature:

* Support querying job status.
* Support getting job return value.

## Using Redis as job queue

The reason for using Redis as job queue is better understood in Oursky projects
and there are few problems with using Redis an job queue. Redis is simple to
deploy in a single tenant environment and the performance characteristics is
trivial--it has single thread and database is entirely memory based.

For cloud, it is non-trivial in how to deploy redis for multi-tenancy. To work
around that, we opt to deploy an instance of Redis in a kubernetes Pod for each
Skygear Cloud app. This will likely require a paid subscription. Therefore job
queue will be disabled on free apps.

The cited complexities in deploying Redis on the cloud include:

* No support for multi-tenancy. Each app will have an instance of Redis.
* Backing up and restoring Redis database backup.
* Requires the entire database to be stored in memory.
* Deploying in Pod means more resource burden on cluster.
* Figure out how to secure Redis in a shared computing environment.

Deployment will be discussed in an internal document.

It is not required for cloud deployment to be ready before we roll out the open
source version of redis job queue support. For open source users, they will be
responsible for managing the redis instance.

## Job Queue management and dispatch

Job queue will be implemented in skygear server and task dispatch
will be implemented via existing plugin transport.

To save time we should use an open source job queue implementation that works
with Redis and written in golang. One such implementation is
https://github.com/gocraft/work.

The server will implement actions that expose job queue management such as
enqueue and cancellation to cloud function runtime. The server will also acts
as a dispatcher which continuously monitor the job queue and dispatch job when
job is ready to run.

Dispatch use the existing mechanism of calling lambda via plugin transport.

The server is also required to run maintenance tasks to delete dead jobs from
queue.

## Declaring async job

Declaration of async job is done via a new decoration/registration function
called `job` (TBD, maybe `async`), which register the cloud function as a
lambda behind the scene.

A `job` is a lambda function that allows async execution and it can
only be called by the server (cannot be called by client). This is better than
using `op` because a `job` and a `op` has different assumption on how the cloud
function is executed (e.g. context, input/output etc).

## Priority

When providing a job queue, a common use case is to provide a long running
task, with "long running" means execution duration longer than the current
limit of 60 seconds. Such tasks may take all the available workers
in the plugin runtime and leave client requests without available workers.  
This problem will also affect regular lambda function.

By introducing priority, workers running on the same code base will
register different set of lambdas/async jobs based on registration parameters.

For example, `high` priority worker will only register lambdas to skygear
server with lambdas that are decorated with `high` priority.

The semantics of priority is defined by the user. Defining a `high` priority for
a lambda means that request for this lambda will be dispatched to a specific
group of workers. It doesn't mean that the request will be dispatched earlier.

## Configurations

Will support configuration including:

* Job queue enable/disable
* Redis configuration (connection string)
* Retry parameters
  * max retry count
  * backoff calculation

Plugin runtime will add support for specifying cloud function priority.

## Sample Usage

Usage will be like this:

```python
@skygear.job('user:send-email', priority='low')
def send_email(user_id):
    # send email logic
    pass

@skygear.op('user:register')
def register_user(email):
    user = create_user(email)
    # Enqueue job with a specific job id so it can be cancelled later
    # If there is another job with the same ID, the previous job will be replaced
    job = enqueue_job('user:send-email',
                      {'user_id': user.id},
                      job_id='send-email:'+email,
                      run_at=tomorrow_datetime())
    print('job_id: ' + job.id)

    # Enqueue job to be run immediately after
    job = enqueue_job('user:send-email',
                      {'user_id': user.id})
    print('job_id: ' + job.id)

    # Enqueue job and retry 10 times if failed
    job = enqueue_job('user:send-email',
                      {'user_id': user.id},
                      retry=10)

@skygear.op('user:deregister')
def deregister_user(email):
    cancel_job('send-email:' + email)
```

## Other Discussions

### Using PostgreSQL server as queue store

There were a previous discussion of using PostgreSQL as job queues. Cited
deficiencies were:

> using PostgreSQL as job queue is not well understood

The reason for using PostgreSQL as job queue were followings.

> Job queue requires persistent storage because job can be scheduled in the
> future, which should survive application restarts. On Skygear Cloud, the only
> supported persistent store is PostgreSQL. Since we have to support Skygear
> Cloud, an obvious approach is to store the job queue in PostgreSQL.
> 
> There are prior works in using PostgreSQL as job queue:
> 
> * https://github.com/chanks/que
> * https://github.com/bgentry/que-go
> 
> This approach uses PostgreSQL advisory lock to manage jobs.
> 
> Alternatively, we could deploy Redis on the Skygear Cloud, but doing so is
> non-trivial because:
> 
> * Redis does not natively support multi-tenancy.
> * We will need to develop a management interface to modify the job queue in case
>   developer need low-level access.
> * Difficult to provide the same level of persistence guarantee in Redis.
