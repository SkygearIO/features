# Overview

Coming from a long journey, skygear SDKs are developed by multiple developers, different functions are introduced from time to time. When comparing the function signature inside one SDK or across the three SDKs, ones may find inconsistent functions appear in different part of the SDKs.

This document is:
- To provide guidelines for updating the current functions and new functions
- **Opinionated**
- **Just guideline, so exceptions are acceptable with reasons**

# High level guidelines

### Consistent vocabulary and / vs Language convention

#### Vocabulary

- verb: save, assign, delete, change, subscribe, login
- noun: password, record, user role
- adverb/adj.: anonymously, atomically

#### Consistent vocabulary

For API with same purpose / calling the same skygear-server API, the same set of vocabulary should be used.

<table>
  <tr>
    <td>iOS</td>
    <td>Android</td>
    <td>JS</td>
  </tr>
  <tr>
    <td>[container signupAnonymouslyWithCompletionHandler:]</td>
    <td>signupAnonymously(AuthResponseHandler handler)</td>
    <td>signupAnonymously(): Promise< Record ></td>
  </tr>
</table>

#### Conflict

Each language has its own convention on naming and patterns.

For example,
- name of arguments in ObjC are put in the function name, however the other two does not.
- ObjC and Java use interface for callback handler, while (in skygear) JS use Promise.

**Language convention is more important than consistency across different SDKs, i.e. if the vocab would make the function name hard to understand or grammatically incorrect, should follow language convention instead.**

<table>
  <tr>
    <td>iOS</td>
    <td>Android</td>
    <td>JS</td>
  </tr>
  <tr>
    <td>setNewPassword:oldPassword:completionHandler:</td>
    <td>changePassword(String newPassword, String oldPassword, AuthResponseHandler handler)</td>
    <td>changePassword(newPassword: String, oldPassword: String, invalidate: Boolean): Promise< Record ></td>
  </tr>
  <tr>
    <td>fetchRolesOfUsers:completion:</td>
    <td>fetchUserRole(Record[] users, FetchUserRoleResponseHandler handler)</td>
    <td>fetchUserRole(users: Record[] | Record | String[] | String): Promise< Object ></td>
  </tr>
</table>

### How many functions to provide, aka maintain

Don't just add functions because it looks cool.

For example, `assignUserRole(Record[] users, Role[] roles)`, the following versions can be provided.

```
- assignUserRole(Record[] users, Role[] roles)
- assignUserRole(String[] userIds, Role[] roles)
- assignUserRole(Record user, Role[] roles)
- assignUserRole(String userId, Role[] roles)

- assignUserRole(Record[] users, String[] roleNames)
- assignUserRole(String[] userIds, String[] roleNames)
- assignUserRole(Record user, String[] roleNames)
- assignUserRole(String userId, String[] roleNames)

...and more
```

**Unless we use code generation in the SDKs, DON'T do this!**

# General guidelines

### Getter and Setter

Getter and setter of properties should follow the language convention.

<table>
  <tr>
    <td>iOS</td>
    <td>Android</td>
    <td>JS</td>
  </tr>
  <tr>
    <td>[container endpoint] or container.endpoint</td>
    <td>container.getEndpoint()</td>
    <td>container.endpoint</td>
  </tr>
</table>

### Platform specific API

If an API appears due to platform specific problem, the reason should be stated in the API reference clearly, e.g. `clearCache()` in JS.

### Local operation vs Remote operation

Local operation should use get/set, remote operation should use fetch/save.

### s or no-s

For functions accepting single object or collection of object, in untyped language and language that support function overload, the noun of the function should use singular form, otherwise the function accepting collection of object should use plural form.

So.

```
# ObjC
saveAdminRoles:completion:

# Java
saveAdminRole(Role[] roles, SaveRoleResponseHandler handler)

# JS
saveAdminRole(roles: Role[] | Role | String[] | String): Promise<String[]>
```

### Function parameters

#### Follow the same order

```
# if Java has this function
changePassword(String newPassword, String oldPassword, AuthResponseHandler handler)

# DON'T do this in JS
changePassword(oldPassword: String, newPassword: String): Promise<Record>
```

#### Array or not array

For server API that accept collections of data, **JS would accept both single object and collections of object, while others would accept only collections of object**, the principle is to keep only ONE function.

See example in the next section.

### ID or object

For server API that accept id/name of data, e.g. role, user, **SDK should provide functions for both object and id/name**, because the object to id/name conversion is a knowledge to skygear SDK.

```
# ObjC
saveAdminRoles:completion:
saveAdminRolesWithNames:completion:

# Java
saveAdminRole(Role[] roles, SaveRoleResponseHandler handler)
saveAdminRole(String[] roleNames, SaveRoleResponseHandler handler)

# JS
saveAdminRole(roles: Role[] | Role | String[] | String): Promise<String[]>
```

### Number of parameters

- SDKs should provide at least one function that accept all possible parameters for an API.
- Functions with default value of arguments should be determined by scenario.

```
# This must be provided
createMessage(Conversation conversation, String body, Asset asset, JSONObject metadata, SaveCallback<Message> callback)

# These are handy, but make sure iOS and Android have the same set of APIs
createMessage(Conversation conversation, String body, SaveCallback<Message> callback)
createMessage(Conversation conversation, Asset asset, SaveCallback<Message> callback)

# JS would be like this
createMessage(conversation: Conversation, body?: String, asset?: Asset, metadata?: Object)
```

### Callback registration

In iOS and Android, there are two options. Choose one suitable for the case.

##### Group of callback functions in an interface

iOS: `[container pubsub].delegate = xxx`
Android: `container.getPubsub().setListener(xxx)`

##### Single callback function

iOS: `[[container pubsub] subscribeTo:@"xxx" handler:xxx]`
Android: `container.getPubsub().subscribe("xxx", xxx)`

While in JS, `skygear.pubsub.on('xxx', function() { xxx })`.

# Platform specific guidelines

### JS

#### Composition over Inheritance for models in plugin SDK

*Models in Plugin SDK should HAVE a record instead of IS a record.*

Currently, `Conversation`, `Message` etc., are just extending the skygear Record, i.e. `Record.extend('Conversation')`, which is not the case in other Chat SDK. In this case, the model does not have typed properties, developers can set whatever they want with the model object and save to skygear.

This would affect what parameters to put in the function. Because if the model itself does not have properties, it relies on the function to reflect what properties can be set.

# Exceptional cases

### Query in iOS

iOS (ObjC/Swift) provides predicate class(es) natively.

### Record save, mutliple or singular

`save(Records)` and `save(Record)` should be separate functions.

When saving multiple records, the client may specify if the operation should be atomic. The behaviour is different for multiple and singlar record save.
