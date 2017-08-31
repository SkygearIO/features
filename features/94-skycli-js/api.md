# API Design Overview

This document layout a re-design on `skycli` to make the `skycli` a command line
interface to cloud deployment. It is different to existing `skycli` (renamed
to `go-skycli`), which is interface to skygear-server.

## Usage scenario

- User login and control as in portal
- User doing some quick check of data against database
- User deploy cloud code
- User inspect the cloud code version
- 

## Command list


```
$ skycli --help
Skygear Cloud Command Lin Interface

Usage:
  skycli COMMAND [-h]

commands:

login
logout
init
deploy
status
info
config
permission
browse
apps
logs
push
pubsub
user
schema fetch
schema update
record export
record import
record get
record set
version
```


Flags will not show to user, not as public API
```
Flags

--app
```


## Auth configuration look up

First to look up at current working directory, then home directory

```
./.skyclirc
~/.skycli/.skyclirc
```

- `.skyclirc` should normally modify by `skycli login`
- `skycli login --local` will modify the local `.skyclirc`


## Project configuration look up

```
skygear.json
```

Init by `skycli init`.


### Format

TBC

- Able to have multiple deployment target with a default.

## Example of login flow

### New user

User already registered on portal.skygear.io, this is his first time ueage on
skycli

```bash
$ npm install -g skycli

$ skycli init
Requires authentication, please run skycli login

$ skycli login
Email: 
Password: 

Account info written to ~/.skycli/.skyclirc

$ skycli init

You're about to initialise a Skygear Project in this directory: /Users/chpapa/skygear-project

Confirm (Y/n) Y

Select an app to associate with the directory:
- chpapa x
- maymay
- [create a new project]

Do you want to create your static hosting directory (public)? (Y/n) Y

Created /public_html/index.html

Do you want to start with a Project Template? (Y/n) Y

Select the Project Template:
> Javascript
  Python
  Empty

Writing configuration to ./skygear.json

Initialisation Completed!
```


### User that are invited by other developer

```bash
$ git clone git@github.com:cheungpat/lunchbot.git
$ cd lunchbot
$ ls
skygear.json

$ npm install -g skycli

$ skycli login
Email: 
Password: 

Account info written to ~/.skycli/.skyclirc

$ skycli status
=== lunchbot
Status: Running

$ skycli info
Age: 3 Day
Skygear Version: 1.1.0
Cloud code Version: 4423a84

$ skycli config 
=== lunchbot
FORGOT_PASSWORD_WELCOME_EMAIL_TEXT_URL
  https://skygear-cloud-asset.s3.amazonaws.com/rickmak/forgot-password/welcome-email.txt
MASTER_KEY
  65b562ae5625737c158df0480b4abab8
DATABASE_URL
  postgresql://skygear-cloud-client-db-1.c5fyydwyvna6.us-west-2.rds.amazonaws.com:5432/rickmak-2461?sslmode=require
APNS_ENABLE
  NO
TOKEN_STORE_PATH
  redis://sessions-1-production.services.skygeario.com:6379?prefix=rickmak-1424:
APNS_ENV
  sandbox
FORGOT_PASSWORD_WELCOME_EMAIL_SENDER
  no-reply@skygeario.com
TOKEN_STORE
  redis
FORGOT_PASSWORD_WELCOME_EMAIL_HTML_URL
  https://skygear-cloud-asset.s3.amazonaws.com/rickmak/forgot-password/welcome-email.html
APP_NAME
  rickmak
FORGOT_PASSWORD_WELCOME_EMAIL_ENABLE
  YES
TOKEN_STORE_PREFIX
  rickmak-1424
API_KEY
  2bb3245a3fa1485fb1f1214b632168d3
FORGOT_PASSWORD_WELCOME_EMAIL_SUBJECT
  Welcome!

```

