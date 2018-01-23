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

The whole feature is divided into two parts.

- Stage 1
  - UI level
  - The web interface would show only what the current user allow to see.
- Stage 2
  - Define access control policies for resources.
- Stage 2.1
  - API level
  - Solution 1: skygear-content-manager plugin implementation
  - Solution 2: skygear-server implementation

Rationale:

- Changes in Stage 1 are small and straight-forward.
- Stage 2 is the security feature implementation.
- Some offline discussion:
  - We forsee that both solutions are big changes to the existing system, and the required time is similar.
  - Most team members prefer solution 2, because it has more benefits. But the change to the existing system seems too broad, so we think that this needs more discussion.
  - (details below)

### Update cms client UI (Stage 1)

- Server will provide API for assigning user to a role.
  - Each user belongs to a role only.
- Server will provide API for getting cms config for current user.

### Define policies (Stage 2)

The detail of this part (esp. the resource definition) is just a draft, since the implementation vary for different solution. See stage 2.1.

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

### Update cms plugin (Stage 2.1 - solution 1 / 2)

- The resource of the policies is defined by the cms config file, so server will also read the cms config file.
- Server will read a file which contains a list of policies.
- Modify '/cms-api/' to deny request based on the policies
  - Evaluation time depends on the resource of a policy.

good:
- scoped implementation

bad:
- performance issue
- the policy-based access control looks more powerful than the existing access control in skygear-server

### Update skygear server (Stage 2.1 - solution 2 / 2)

- Skygear server can resolve policy
  - at route level
  - at handler level (for subresource)
- Namespaced roles to avoid overloading the roles in different context.
- Generates access token for different roles (to permit different policies)

good:
- policies can also work on exisiting api
  - e.g. everyone can send push to everyone now
- maintainance
  - more test case on skygear-server

bad:
- definition of subresource can be complicated
- hard to explain when working with the existing ACL in record API
