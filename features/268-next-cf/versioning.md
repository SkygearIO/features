# Versioning

## Use case

- Release beta version for testing
- Revert to a previous version due to some error of the running version

## What to include in a version

Although this spec is focusing on skygear CF, from the perspective developer, a version of an app does not only include functions in CF. **One version of an app should represent a set of behaviour of the app.**

It is unavoidable that an app may rely on external services. This spec would ony concern those that are controlled by skygear, here is the list of moving parts of each skygear app,

- Skygear gears, currently Auth gear only
- Tenant config
- CF functions code base
- CF functions configuration
  - permission
  - secrets
  - resource management, e.g. sleep vs non-sleep, cpu, memory
- Static assets
- Secrets
- Pricing plan
  - total resource provided to a user
- (TBD) Skygear managed external services, e.g. db

Due to the limitation of the current design of skygear, gears version is controlled by skygear admin.

Pricing plan, by its nature, may not be able to revert to a specifc version. If a user paid for one of the plan, he can choose to use resources provided by that plan or cheaper plans, but not more expensive plans.

(TBD) Skygear managed external services would be presented to CF functions in the form of secrets. For example, a user opt to use skygear managed redis, the redis url would be added to secrets automatically, once the user include the secret in the functions that require the service would do it.

CF functions code base would be built with docker image, so we can specify the version of the code base of a version by specifying the version of the image as a part of configuration. So they can be grouped to one moving part.

So the moving parts of an app for skygear user would be,

- Tenant configuration
- CF functions configuration
- Static assets

### Moving unit

Moving unit represents a logical unit of a moving part.

- The tenant configuration is a moving unit
- One function configuration is a moving unit
- One static asset configuration is a moving unit

Although tenant configuration contains bunch of keys and nested dictionaries, one of the value changes means the whole tenant config is changed. Same applies to function configuration, change of code base, no matter how small it is, means the function configuration is changed.

## Version, app version and release

- Version: a snapshot of a moving unit
- App version: a collection of version of different moving parts
- Release: an app version that can be accessed by app user

### Release expiration

And due to limited resource, each skygear app will only have a limited number of accessible release.

Let's say a free user can have 3 accessible release, when the 4th release is created, the oldest one would be expired.

### Increment of version and app version

Whenever changes applied to a moving unit, a new version would be created.

Practically, skygear users update tenant configuration and deploy functions through skycli, so each skycli operation that updates the moving unit would create a new version.

For example, a user deploy a function, there will be a new version of function.

At the same time, when one moving unit has a new version, there would be a new app version created.

### Increment of release

Not all app version represents an expected behaviour completely. For example, skygear user may want to update both tenant configuration and CF functions configuration, there would be two app version created, however, only the last one meant to be accessible by app users.

Base on the assumption that:
- it would provide better ux for skygear user that they do not need to learn about the concept of app versoin or release to make a skygear app
- most of the time, a new release only contains of changes of one moving unit

So skycli would not have a new command like `skycli app create-release`, instead for those skycli commands that create a new version and app version would have an argument like `--no-release`. If a new app version created with the argument `--no-release`, the app version would not be accessible.

Those more advanced skygear user who understand the concept of release can make user of this feature and, hopefully, will have the following advantages for them:
- those operations with `--no-release` will be much quicker than those without the argument
- they can only keep a limited number of accessible release, so by reducing non-workable release, they can keep more

## Accessing different releases

All releases would have a unique id, for app user to access.

Normally, user access an app with `{app_name}.skygear.io`. To access a specific release, user need to include the release id as part of subdomain, i.e. `{app_name}.{release_id}.skygear.io`.

If the release id specified in the url is not a valid one or expired, the gateway should return error.

### Special releases

There are a number of type of release:
- Live release
- Latest release
- Tagged release

#### Live release

Live release represents the release that app user can access without specifying any release id.

#### Latest release

Latest release represents the latest one. Unless specified the live release to be another release, the latest release would be the live release.

#### Tagged release

When a release is tagged, it would not be expired even if new release is created and maximum number of accessible release is reached.

The app user may access different version with the tag, i.e. `{app_name}.{release_tag}.skygear.io`. This provides a convenient way when the developer need to whitelist the domain on a 3rd party service.

Live is a special kind of tag, so if a release is marked as live, it would not be expired too.

## Listing app version

skycli should provide a command to list app version and show which are release.

Example:

```
$ skycli app list-version # or skycli app list-history
App name: test-app
App versions:
abcdef 2018-12-31 15:00:00 update tenant configuration | Release qwerty, latest, tag: beta
abcdee 2018-12-30 15:00:00 deploy functions            | Release qwertx, tag: live
abcded 2018-12-30 14:50:00 update tenant configuration |
```

## Static assets versioning

Use s3 as example storage, each version can be held in a folder with version id as name.

### Storage and upload time optimisation

Since each static assets configuration item is one moving unit, if the files of an item does not change (maybe done by looking the last modified date), the upload can be skipped.

To further optimise, developers can put files in different static assets configuration items to skip not-updated file as much as possible, for example,

```yaml
static:
  - src: build/index.html
    path: /
  # js files are most likely updated in each deployment
  - src: build/js
    path: /static/js
  # assets are not updated as frequently as js files
  - src: build/public
    exclude:
      - public/video/very-large-one.mp4
    path: /static
  # the very large file is even less likely to be updated
  - src: build/public/video/very-large-one.mp4
    path: /static/public/video/very-large-one.mp4
```
