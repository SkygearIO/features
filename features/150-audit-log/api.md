# Security audit logging on Skygear Cloud

## Use cases

* For administrators of an app to download audit log for further investigation.

## Requirements

* Portal to build UI for configuring audit logging
* Portal to build UI for retrieving log files
	* Only showing download links for retrieval. No need to provide searchable UI.
* Controller
	* Will discover log files and generates link for client retrieval
* Log collection daemon
	* The log collection daemon is going to collect the log generated from Skygear Server.
	* The daemon will upload the log entries to a persistent storage for long term storage and for retrieval

## Portal UI

### Enable Audit Log

The portal will have a new section for audit log. The user enables the audit
log by clicking on a button. When clicking on the button, audit log will be
enabled and the portal UI will present UI for retrieving the audit logs.

Behind the scene, the button will set environment variables for the app. App
will deploy automatically as per usual practice:

* `USER_AUDIT_ENABLED=true` to enable audit logging
* `USER_AUDIT_TRAIL_HANDLER_URL` to set audit logging target

### Audit Log Retrival

The portal will present a date picker in which the user can select a date
to limit the nubmer of log files returned to the user. When a date is selected
a table is refreshed to show log entries with these information:

* Date/Time
* Pre-signed URL of the log file for download

There will be multiple log files and the number of log files will depend on
how often the audit log data is flushed to S3.

Audit log is available when the log is flushed to S3. Therefore recent audit
log events might not be immediately available.

## Controller API

The Controller API does not need to update to enable audit logging. Portal
will add environment variable to config.

The Controller will add the following APIs:

### `GET /apps/<id>/audit-logs?from=<date>&to=<date>`

The portal is expected to call this API to obtain a list of audit-logs for
display.

The controller is expected to check that the user is an owner or collaborator
of an app. Then the controller lists all objects with a certain prefix
from the S3 bucket that is storing the audit logs.

* S3 bucket: TBD
* Prefix: `audit-logs/<app>/<date>/`

The controller generates presigned URL for each log file and return them
in the HTTP response.

#### Request

The controller does not expect parameter in the body of the request.

#### Response

The controller returns a list of log entries with the following fields:

* `last_modified` - the time when the audit log file is last modified. Use
  `LastModified` field from S3
*  `download_url` - the download url of the log file

## Log Collector

The log collector is a syslog-compatible daemon.

The daemon is consists of three components:

* Kubernetes pod informer
  * The informer will listen to Kubernetes API for pod creation and termination
    events. The event will include pod IP which is used to build an index of
    Pod IP and app name mapping.
* Syslog server
  * The syslog server will open a syslog socket for accepting syslog connection.
  * The syslog handler will check the pod IP and write the log entries
    to the app-specific log file stored locally.
* Log file upload
  * This component will upload the log files to S3 periodically.

## Log Rotation

* The log file is rotated periodically:
  * per hour - log may be rotated per hour
  * per pod - each pod (i.e. restart/deploy/config change) will have its own
    log file
* Log file is guaranteed to retain for the last 90 days. This is an arbitary
  limit and the log file will remain on the server for longer period, but the
  UI will only show logs for the last 90 days.

