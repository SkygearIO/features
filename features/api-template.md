(use this template for api.md in each features' folder)

## Feature Overview

Write a short paragraph of:
* describe the feature
* when it is expected to be used
* a list of sample use cases

## Guides

Pretend you are writing the outline of the guide/changes on guides for the said feature. You
should explain how your SDK function interface/API will works.

This section helps others to understand how users will use your design, NOT how
it will be implemented.

It shall include the following subsections.

### Sample Codes

Please include scenarios and the sample codes here. If it is trivial, you can start with just one
platform. Otherwise, it is okay to include each platform once.

### List of APIs

Please try to include the full list of APIs / interfaces here, and highlight the changes. So that
others can understand how it changes the whole SDK.

## Implementation Details

This is the specification for implementation. My FYP professor once said a good specification is,
assume you're going to hit by a bus tomorrow, another developer can still complete the coding with
the spec.

It might include, but not limited to, the following subsections.

### Changes on SDK

Here you should include how each client SDK will change, any underlying APIs, backward compatibility
tricks.

### Changes on API at skygear-server / plugins

Here you should include how the server will changes, any new API needed, or any backward
compatibility magic you will need.

### Database Schema

The DB schema change.

### Migration

If applicable, the migration plan for old version.
