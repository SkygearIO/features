Field-based ACL
================

# API Design Overview

Field-based ACL is a Skygear feature defining the accessibility of the fields
of a Skygear Record type.

## Accessibility levels

The field-based accessibility is divided into 5 levels:

- `ReadWrite`: fields that available for read and write
- `Queryable`: Fields that can be used to perform any query predicates and
  will be returned after query.
- `Discoverable`: Fields that can only be used to perform equality query
  predicate and will be returned in query.
- `ReadOnly`: Fields that cannot be used to perform any query predicates but
  will be returned in query.
- `NoAccess`: Fields that cannot be used to perform any query predicates and
  will not be returned in query.

## Access Control Entity (ACE)

The field-based ACL is an array of field-based Access Control Entities (ACE).
Each field-based ACE model will contains:

- `RecordType`: the record type the entity belongs to, wildcards are allowed
- `UserRole`: the user role the entity apply to
- `Field`: the record field the entity apply to, wildcards are allowed
- `AccessLevel`: the accessibility level the entity defines

By defining field-based ACL, the permission of users performing actions on a
record field is defined. A user would have permission to perform an action on a
record field if any ACEs grant the permission of the role that the user belongs
to, i.e. allow-based policy.

## User Roles

Since multiple rules with different user roles can be applied to a field of a
record type, the resolve order of different user roles is important. The
resolve order will be:

1. **Public**: any users with correct API key
1. **Owner**: the owner of the record instance
1. **Specific User**: the user specified by user ID
1. **Reference Users**: the users specified in a field of the records
1. **Defined Roles**: the user-defined roles
1. **Any Users**: any logged-in users

## Base ACL

Since the field-based ACL is allow-based, the following entities would be added
serving as a base ACL.

| Class | UserRole | Field |   Level   |
|-------|----------|-------|-----------|
| *     | AnyUser  | *     | ReadWrite |

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

# Sample ACL for Use Cases

- Make gender field of user record private to every one except owner

| Class | UserRole | Field  |   Level   |
|-------|----------|--------|-----------|
| *     | AnyUser  | *      | ReadWrite |
| User  | AnyUser  | gender | NoAccess  |
| User  | Owner    | gender | ReadWrite |

- Make gender field of user record private to every one, readable to friends
  and updatable to owner

| Class |  UserRole   | Field  |   Level   |
|-------|-------------|--------|-----------|
| *     | AnyUser     | *      | ReadWrite |
| User  | AnyUser     | gender | NoAccess  |
| User  | Ref:Friends | gender | ReadOnly  |
| User  | Owner       | gender | ReadWrite |

- Make a slug field of photo record, updatable to owner but only discoverable
  by others

| Class |  UserRole   | Field |    Level     |
|-------|-------------|-------|--------------|
| *     | AnyUser     | *     | ReadWrite    |
| Photo | AnyUser     | slug  | Discoverable |
| Photo | Owner       | slug  | ReadWrite    |

# Changes on SDK

The following API will be added to SDKs and expected to be called under
development mode by users with admin role.

- `container.setRecordFieldAccess(RecordClass, fields, userRoles, level)`

  This API will update the ACL of a list of fields (specified by `fields`) of a
  record type (specified by `RecordClass`) for a list of user roles (specified
  by `userRoles`) to a specific access level (specified by `level`).

- `container.setRecordAllFieldAccess(RecordClass, userRoles, level)`

  This API will update the ACL of all the fields of a record type (specified
  by `RecordClass`) for a list of user roles (specified by `userRoles`) to a
  specific access level (specified by `level`).

- `container.setAllRecordFieldAccess(userRoles, level)`

  This API will update the ACL of all the fields of all record types for a list
  of user roles (specified by `userRoles`) to a specific access level
  (specified by `level`).

# Changes on API at skygear-server

An endpoint would be added to Skygear server for updating field-based ACL. The
endpoint name is open to implementor. It is suggested to name it like
`schema:record_field_access`. The endpoint would expected to receive
the following sample payload:

```json
{
  "action": "schema:record_field_access",
  "api_key": "my-api-key",
  "access_token": "admin-user-token",
  "record_type": "Photo",
  "record_fields": ["slug"],
  "user_roles": ["_any_user"],
  "level": "Discoverable",
  "for_all_record_types": false,
  "for_all_record_fields": false
}
```

# Database Scheme

An table would be created for saving field-based access control entities. The
schema would be like:

```SQL
CREATE TABLE "_recrod_field_access" (
    "record_type" text NOT NULL,
    "record_field" text NOT NULL,
    "user_role" text NOT NULL,
    "level" text NOT NULL,
    PRIMARY KEY ("record_type", "record_field", "user_role")
);
```
