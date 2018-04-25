# Structured Logging

## Feature Overview

* Support production logs filtering for user get the logs they want
* Show logs with color to make different kinds of log easier to see

## Requirements

* Support filters to make developer easier to discover the logs they want. Allow select multiple filters, `Cloud Functions & Error` is the default.
    - Cloud Functions & Error
    - API Request
    - Authentication
    - Database
    - Pubsub
    - Push Notification
    - Auth Plugin (Welcome email, Forgot Password, Verify user by email or SMS)
    - Chat Plugin
    - CMS Plugin
    - SSO Plugin

* A toggle to allow user group logs by request ID (Logs without request ID will not be shown when this is ON)

* Different color based on log level

## Use cases

1. When user is debugging their own cloud code, they only want to see the their own logs and exceptions. Use filter: `Cloud Functions & Error`
1. Debug cannot receive notification problem. Maybe incorrect certificate or want to see any error return from apns or fcm. Use filter: `Push notification`
1. Cannot load the CMS correctly. Use filter: `Cloud Functions & Error` + `CMS Plugin`
1. Debug app real time update problem, need checking if pubsub publish the event correctly. Use filter: `Pubsub`
1. Logs interleaved, difficult to trace logs related to the currecnt request. Turn on group by request ID toggle.
    
## Usage example

For user who is writing cloud function, they can just use `print`, `console.log` or python logger. All the unrecognized logs will be shown in `Cloud Functions & Error` sections or `--tag=others` in `skycli`.