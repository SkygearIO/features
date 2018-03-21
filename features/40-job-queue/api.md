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

To futher enhance the feature:

* Support querying job status.
* Support getting job return value.

### Using PostgreSQL server as queue store

Job queue requires persistent storage because job can be scheduled in the
future, which should survive application restarts. On Skygear Cloud, the only
supported persistent store is PostgreSQL. Since we have to support Skygear
Cloud, an obvious approach is to store the job queue in PostgreSQL.

There are prior works in using PostgreSQL as job queue:

* https://github.com/chanks/que
* https://github.com/bgentry/que-go

This approach uses PostgreSQL advisory lock to manage jobs.

Alternatively, we could deploy Redis on the Skygear Cloud, but doing so is
non-trivial because:

* Redis does not natively support multi-tenancy.
* We will need to develop a management interface to modify the job queue in case
  developer need low-level access.
* Difficult to provide the same level of persistence guarantee in Redis.

## Sample Usage

Usage will be like this:

```python
@skygear.job('user:send-email')
def send_email(user_id):
    # send logic
    pass

@skygear.op('user:register')
def register_user(email):
    user = create_user(email)
    job = enqueue_job('user:send-email',
                      {'user_id': user.id},
                      job_id='send-email:'+email,
                      run_at=tomorrow_datetime())
    print('job_id: ' + job.id)

    # job can be cancelled
    job.cancel()

```
