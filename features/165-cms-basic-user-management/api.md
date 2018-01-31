# CMS Basic User Management

## Use case

- Allow existing cms user to allow other user to use cms
  - Add cms required role to user
  - Change user password, because some users may use auth provider or sso to login Skygear

## Requirement

### Add User Management Page

New type under site config in the cms config file.

*At this stage, no customisation is provided.*

```
site:
  - type: user-management
```

In the user management page can:

- Display list of users, and provide enough information for cms user to identify
- Filter user with username or email to find a user quickily
- Allow cms user to perform action to the user

The table would be like:

|`id`|username|email|CMS access|actions|
|---|---|---|---|---|
|user1|i am your father|iamyourfather@oursky.com|✔|{Change Password}|
|user2|i am your brother|iamyourbrother@oursky.com||{Change Password}|

Client would call skygear record query to fetch users, with pagination. `CMS access` requires calling a separate API of cms plugin.

`CMS access` is a checkbox which show if the user has cms access. Clicking the checkbox would call cms API to assign or revoke cms access. The action is non-blocking so require loading state.

There will be a `Change Password` button in actions column for each user, which will direct to another page.

### User role management

- Pass the cms role to client
  - python generated html: pass from plugin env
  - `skygearCMS.start({ adminRole: 'Admin' })`

#### Display CMS access

```
skygear.auth.fetchUserRole((userRoles) => {
  // check against cms admin role
  // reflect on user table
})
```

#### Check or uncheck CMS access

```
skygear.auth.assignUserRole(user, cmsAdminRole);
// or
skygear.auth.revokeUserRole(user, cmsAdminRole);
```

### Change Password

- Skygear server add API
  - changePassword
    - master key required
    - input (json):
      - user_id: string
        - id of the user that want to change password
      - new_password: string
        - new password of the user
    - output (json):
      - error
- UI show a form
  - password input
  - submit button
