Field-based ACL
================

# API Design Overview

Field-based ACL is a Skygear feature defining the accessibility and
discoverability of the fields of a Skygear Record type.

## Accessibility levels

The field-based accessibility is divided into 3 levels:

- `ReadWrite`: Fields that available for read and write.
- `ReadOnly`: Fields that will be returned in query.
- `NoAccess`: Fields that will not be accessible.

## Discovery levels

- `Queryable`: Fields that can be used to perform any query predicates.
- `Discoverable`: Fields that can only be used to perform equality query
  predicate (`=` or `IN` operator, but not wrapping in `NOT` nor `OR`).
- `NotQueryable`: Fields that not available to perform query.

## Access Control Entity (ACE)

The field-based ACL is an array of field-based Access Control Entities (ACE).
Each field-based ACE model will contains:

- `RecordType`: the record type the entity belongs to, or `*` which implies all
  record types
- `UserRole`: the user role the entity apply to
- `Field`: the record field the entity apply to, or `*` which implies all
  record fields
- `AccessLevel`: the accessibility level the entity defines
- `DiscoveryLevel`: the discovery level the entity defines

By defining field-based ACL, the permission of users performing actions on a
record field is defined. A user would have permission to perform an action on a
record field if any ACEs grant the permission of the role that the user belongs
to, i.e. allow-based policy.

## User Roles

Since multiple rules with different user roles can be applied to a field of a
record type, the resolve order of different user roles is important. The
resolve order will be:

1. **Owner**: the owner of the record instance
1. **Specific User**: the user specified by user ID
1. **Dynamic User Set**: the users specified in a field of the records
1. **Defined Roles**: the user-defined roles
1. **Any Users**: any logged-in users
1. **Public**: any users with correct API key

## Base ACL

Since the field-based ACL is allow-based, the following entities would be the
base case of the ACL. The base ACL will be used when no field-based ACE is
found for a specific operation. Developers can define their ACE to avoid
falling onto the base ACL.

| Class | UserRole | Field | AccessLevel | DiscoveryLevel |
|-------|----------|-------|-------------|----------------|
| *     | Public   | *     | ReadWrite   | Queryable      |

## Work together with record-based ACL

The field-based ACL would be working together with the record-based ACL.
Record-based ACL controls whether the user can access a record. Field-based ACL
controls whether the user can access a field of a record. When a user is
operating on some fields of some records, it would be tested by both
record-based ACL and field-based ACL.

The following pseudo code shows how an record operation being tested by both
record-based ACL and field-based ACL:

```js
function recordOperationVeridation (operation) {
  const currentUser = global.context.getUser();
  const originalRecord = operation.originalRecord;
  const operationType = operation.operationType;

  const recordAccess = originalRecord.access.hasAccess(
    operationType,
    currentUser
  );
  if (recordAccess == false) {
    throw new NoAccessError(currentUser, operationType);
  }

  const recordFieldAccess = originalRecord.class.fieldAccess;
  const operatingFields = operation.operatingFields;

  // not considered access depends on data of the record
  operatingFields.forEach(function (eachOperatingField) {
    const eachOperatingFieldAccess = recordFieldAccess.hasAccess(
      eachOperatingField,
      operationType,
      currentUser
    );
    if (eachOperatingFieldAccess == false) {
      throw new NoAccessError(currentUser, operationType, eachOperatingField);
    }
  });

  return true;
}
```

# Changes on SDK

No changes on SDK since this feature would be expected to be used on Skygear
Cloud Portal or Skygear CLI, which will be specified on another document.

# Samples for Some Use Cases

Use Case 1: Make gender field of user record private to every one except owner

| Class | UserRole | Field  | AccessLevel | DiscoveryLevel |
|-------|----------|--------|-------------|----------------|
| *     | Public   | *      | ReadWrite   | Queryable      |
| User  | AnyUser  | gender | NoAccess    | NotQueryable   |
| User  | Owner    | gender | ReadWrite   | Queryable      |

Use Case 2: Make gender field of user record private to every one, readable
and queryable to stared users and updatable to owner

| Class |  UserRole      | Field  | AccessLevel | DiscoveryLevel |
|-------|----------------|--------|-------------|----------------|
| *     | Public         | *      | ReadWrite   | Queryable      |
| User  | AnyUser        | gender | NoAccess    | NotQueryable   |
| User  | UserSet:stared | gender | ReadOnly    | Queryable      |
| User  | Owner          | gender | ReadWrite   | Queryable      |

Use Case 3: Make a slug field of photo record, updatable to owner but only
discoverable by others

| Class |  UserRole   | Field | AccessLevel | DiscoveryLevel |
|-------|-------------|-------|-------------|----------------|
| *     | Public      | *     | ReadWrite   | Queryable      |
| Photo | AnyUser     | slug  | Readable    | Discoverable   |
| Photo | Owner       | slug  | ReadWrite   | Queryable      |

# Changes on API at skygear-server

Two actions would be added to Skygear server for getting and updating the
field-based ACL. Both of them are expected to called with master key.

## Get the field-based ACL

The sample request is shown as followed:

```json
{
  "action": "schema:field_access:get",
  "api_key": "my-master-key"
}
```

## Update the field-based ACL

The sample request is shown as followed:

```json
{
  "action": "schema:field_access:update",
  "api_key": "my-master-key",
  "access": [
    {
      "record_type": "User",
      "record_field": "*",
      "user_role": "_owner",
      "writable": true,
      "readable": true,
      "comparable": true,
      "discoverable": true
    },
    {
      "record_type": "Photo",
      "record_field": "slug",
      "user_role": "_any_user",
      "writable": false,
      "readable": true,
      "comparable": false,
      "discoverable": true
    },
    {
      "record_type": "Photo",
      "record_field": "slug",
      "user_role": "_owner",
      "writable": true,
      "readable": true,
      "comparable": true,
      "discoverable": true
    }
  ]
}
```

# Database Scheme

An table would be created for saving field-based access control entities. The
schema would be like:

```SQL
CREATE TABLE "_record_field_access" (
    "record_type" text NOT NULL,
    "record_field" text NOT NULL,
    "user_role" text NOT NULL,
    "writable" boolean NOT NULL,
    "readable" boolean NOT NULL,
    "comparable" boolean NOT NULL,
    "discoverable" boolean NOT NULL,
    PRIMARY KEY ("record_type", "record_field", "user_role")
);
```
