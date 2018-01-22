# CMS role models and policy settings spec

## Use cases

- An administrator has full access to the cms.
- Some users can only read records of some tables but not other tables.
- Some users can only read records of a table but not create.
- Some users can only read some of the fields of a record.
- Some users can send push notification while some cannot.
- Some users can grant access to other users so that they can login to the cms.
- Some users can change the password of another user.

## Requirements

### Update cms client UI

- Server will provide API for assigning user to a role.
  - Each user belongs to a role only.
- Server will provide API for getting cms config for current user.

### Update cms server

- Define the model of a policy.
  - Resource
  - Subject
  - Action
  - Effect (permit / deny)
- Define resource types in the cms, and the actions for each of them.
  - Record
    - Record-type level
      - list
      - create
      - update
      - delete
    - Record-field level
      - read data
      - write data
    - Record level
      - get
      - update
      - delete
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
    - resource:records:{record type}:{record id}:{field name}
    - e.g. All records
      - resource:records:::
    - e.g. Specify user record
      - resource:records:user::
    - e.g. Specify the field username for user record
      - resource:records:user::username
  - Push notifications
    - resource:push
- Server will read and parse a file which contains a list of policies.
- Modify '/cms-api/' to deny request based on the policies
  - Evaluation time depends on the resource of a policy.
