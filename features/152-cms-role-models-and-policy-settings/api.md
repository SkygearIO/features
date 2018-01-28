# CMS role models and policy settings spec

## Use cases

- An administrator has full access to the cms.
- Some users can only read records of some tables but not other tables.
- Some users can only read records of a table but not create.
- Some users can send push notification while some cannot.
- Some users can grant access to other users so that they can login to the cms.
- Some users can change the password of another user.

## Requirements

The whole feature is divided into two parts.

- Stage 1
  - UI level
  - The web interface would show only what the current user is allowed to see.
- Stage 2
  - Update skygear-server to support policy based access control
  - Update CMS plugin to allow login with CMS role

### Update cms client UI (Stage 1)

- Server will provide API for assigning user to a role.
  - Each user belongs to a role only.
  - CMS user-roles are defined in a separate table.
- Server will provide API for getting cms config for current user.

### Define policies (Stage 2)

- Define the model of a policy.
  - Resource
  - Subject
    - role:{role name}
    - user:{user id}
  - Action
    - resource specific
  - Effect
    - allow
    - deny
- Define resource types in the cms, and the actions for each of them.
  - Record
    - Record-type level
      - query
      - create
  - Push notificaiton, per user
    - send
    - list
  - User, per role
    - list
    - create
    - update role
    - update profile
    - update password
    - delete
- Define the format of how to specify only some resource for each resource type.
  - Records
    - resource:records:{record type}
    - e.g. All records
      - resource:records:::
    - e.g. Specify user record
      - resource:records:user::
  - Push notifications
    - resource:push

### Server Update (Stage 2)

- Skygear server can resolve policy
  - at route level
  - at handler level (for subresource)
- Add env variable `ACCESS_POLICY_FILE_URL`
  - Skygear server would download the policy file from the url
  - Portal should provide UI for updating the file
- CMS login api would update the role in jwt provided by skygear login

#### API access control

Skygear server has only master-key-API and non-master-key-API.

With policy settings, by defining deferent API as resource, developer can implement application specific access control on Skygear server API.

For example, setting new user default role originally requires master key. Now user can define a policy like the following one to only allow some users to call the API.

```json
{
  "resource": "resource:roles:",
  "subject": ["role:Admin"],
  "action": "defineUserDefaultRoles",
  "effect": "allow"
}
```

The concept of master key would be kept, as a convenient way to bypass all access control.

### Route level resource

Note:
These are the description for current api.
- require master key
  - need master key
- dev only
  - need dev mode on, or master key
- require admin
  - need admin role or master key

APIs with these description are master-key-API.


```
- _status:healthz
- auth
  - signup
  - login
  - logout
  - password
- sso/oauth
  - login (require master key)
  - signup (require master key)
  - link (require master key)
  - unlink (require master key)
- sso/custom_token
  - login
- asset
  - put
- record
  - fetch
  - query
  - save
  - delete
- device
  - register
  - unregister
- subscription
  - fetch_all
  - fetch
  - save
  - delete
- relation
  - query
  - add
  - remove
- me
- role
  - default (dev only)
  - admin (dev only)
  - assign (require admin)
  - revoke (require admin)
  - get
- push
  - user
  - device
- schema
  - rename (dev only)
  - delete (dev only)
  - create (dev only)
  - fetch (dev only)
  - access (dev only)
  - default_access (dev only)
- schema/field_access
  - get (require admin)
  - update (require admin)
```

##### Resolving policy setting

For backward compatibility, master-key-APIs are denied by default while non-master-key-APIs are allowed by default. So,

- master-key-APIs
  - e.g. set user default role, schema migration
  - white list, i.e. there must be at least one `allow` for the resource and user
  - `deny` is ignored
- non-master-key-APIs
  - e.g. record save, push notification
  - black list, i.e. there must not be any `deny` for the resource and user
  - `allow` is ignored

##### Example

```
// Users who are in role A cannot send push notifications, but they can list sent push notifications.
[{
  "resource": "resource:push:",
  "subject": ["role:A"],
  "action": "send",
  "effect": "deny"
}]

// Users who are in role A can update record schema, while other users cannot
[{
  "resource": "resource:record-schema:",
  "subject": ["role:A"],
  "action": "update",
  "effect": "allow"
}]
```

#### Work together with Record API

Subresource for record API can be divided into the following levels:

- Record level
  - equivalent to the current record acl
- Record-field level
  - equivalent to the current field acl
- Record-type level
  - does not exist in the current access control model

Only record-type level would be added as the subresource of the new policy setting for record API. Because otherwise, there would be two ways to resolve the permission for the same resource, which add complexity to the server implementation and is hard to explain to the developers.

However, in some situations, like CMS, user may need to bypass record ACL to have access all records. Developer can define a policy specifically to allow some users bypass the record ACL.

```json
{
  "resource": "resource:records:",
  "subject": ["role:CMS-Admin", "role:CMS-Manager"],
  "action": "overrideRecordACL",
  "effect": "allow"
}
```

##### Example for CMS

Record type and fields:

- User
  - email
  - salary
- Secret
  - detail

Roles:

- CMS-Admin
- CMS-Manager

Access control description:

|CMS-Admin|Full access to all records|
|CMS-Manager|Can only read fields in User Record, no access to other records|

Policy:

```
[{
  "resource": "resource:records:",
  "subject": ["role:CMS-Admin", "role:CMS-Manager"],
  "action": "overrideRecordACL",
  "effect": "allow"
}, {
  "resource": "resource:records:Secret",
  "subject": ["role:CMS-Manager"],
  "action": "*",
  "effect": "deny"
}, {
  "resource": "resource:records:User",
  "subject": ["role:CMS-Manager"],
  "action": "create",
  "effect": "deny"
}]
```

Field-ACL setting:

|Record|Field|Target|Access right|Discoverability|
|---|---|---|---|---|
|`*`|`*`|role:CMS-Admin|read write|queryable|
|User|`*`|role:CMS-Manager|read only|queryable|

Note that, in field-acl setting, there are no entries for manager and Secret record, because in the policy setting, manager is not allowed to perform any actions on the Secret record.
