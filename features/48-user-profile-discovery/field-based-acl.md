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

- `RecordType`: the record type the entity belongs to, or `*` which applies
  when no other ACE matches the record type
- `Field`: the record field the entity apply to, or `*` which applies
  when no other ACE matches the record type and record field
- `UserRole`: the user role the entity apply to
- `AccessLevel`: the accessibility level the entity defines
- `DiscoveryLevel`: the discovery level the entity defines

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

## ACE matching and resolve order

Field-based ACL is allow-based matching. The allow-based matching tuples are
`RecordType` and `Field`. The ACEs are matched in the following order:

1. All ACEs having the same RecordType and Field as the record
2. All ACEs having the same RecordType as the record and Field is `*`
3. All ACEs having RecordType `*` and Field `*`

When there are ACEs matching the record, the look up will stop. All matching
ACEs are evaluated in the resolve order defined by User Roles. 

In this example, suppose a user is querying `Note.content`:

- Find all ACE with `recordType` equal to `Note` and `field` equal to
  `content`.
  - If one or more ACE is found,
    - Check the user on `Role` and `Permission` with the matched ACE.
    - If no permission is granted, the ACE is not returned. Permission will
      not be granted. Matching will stop.
  - If no ACE is found, continue to next step.
- Find all ACE with `recordType` equal to `Note` and `field` equal to `*`.
  - If one or more ACE is found,
    - Check the user on `Role` and `Permission` with the matched ACE.
    - If no permission is granted, the ACE is not returned. Permission will
      not be granted. Matching will stop.
  - If no ACE is found, continue to next step.
- Find all ACE with `recordType` equal to `*` and `field` equal `*` .
  - Check the user on `Role` and `Permission` with the matched ACE.
  - If no ACE is found, no permission is granted.

#### Example

When a user `Rick` is querying a record type `Note` with `content` field:

Example 1:

| RecordType | Field   | UserRole      | AccessLevel | DiscoveryLevel |
|------------|---------|---------------|-------------|----------------|
| Note       | content | Role:Employee | ReadWrite   | Queryable      |
| Note       | content | AnyUser       | Read        | Queryable      |
| Note       | *       | Public        | ReadWrite   | Queryable      |
| *          | *       | Public        | ReadWrite   | Queryable      |

Only following ACEs will be effective:

| RecordType | Field   | UserRole      | AccessLevel | DiscoveryLevel |
|------------|---------|---------------|-------------|----------------|
| Note       | content | Role:Employee | ReadWrite   | Queryable      |
| Note       | content | AnyUser       | Read        | Queryable      |

If `Rick` has `Employee` role, the access level is `ReadWrite`. If he doesn't
have the role, the access level is `Read`.

For a user that is not logged in (i.e. user role is `Public`), the user will
have `NoAccess`, because no matching ACEs grant access.

Example 2:

| RecordType | Field  | UserRole | AccessLevel | DiscoveryLevel |
|------------|--------|----------|-------------|----------------|
| Note       | *      | Public   | ReadWrite   | Queryable      |
| *          | *      | Public   | Read        | Queryable      |

Only this ACE will be effective:

| RecordType | Field | UserRole | AccessLevel | DiscoveryLevel |
|------------|-------|----------|-------------|----------------|
| Note       | *     | Public   | ReadWrite   | Queryable      |

Since the `Public` user role applies to all users, the AccessLevel is
`ReadWrite`. The `*:*` ACE will not applies because matching stopped
when `Note:*` ACE matches.

### Base ACL

Since the field-based ACL is allow-based, the following entities would be the
base case of the ACL. The base ACL will be used when no field-based ACE is
found for a specific operation. Developers can define their ACE to avoid
falling onto the base ACL.

| RecordType | Field | UserRole | AccessLevel | DiscoveryLevel |
|------------|-------|----------|-------------|----------------|
| *          | *     | Public   | ReadWrite   | Queryable      |

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

## Record Partial Update

For backward compatibility of Skygear API, record partial update is
introduced. For **non-atomic** record save request, partial fields update is
allowed, which means that even some record fields are not writable for the
requesting user, the record will still be updated on other writable fields.
An warning message would be responded to developers showing which field updates
are rejected because of the field-based ACL.

# Changes on SDK

Skygear SDKs have not many changes since the setup of field-based ACL would be
expected on Skygear Cloud Portal or Skygear CLI, which will be specified on
another document.

The record save API on Skygear SDKs would be updated to support record partial
update on **non-atomic** request.

```js
// saving one record
skygear.publicDB.save(record1)
.then((savedRecord) => {
  console.log(`Successfully saved record: ${savedRecord}`);
  console.warn(`Rejected saving fields: ${savedRecord.$rejectedFields}`)
}, (err) => {
  console.error(`Failed to save: ${err}`);
});

// saving multiple records
skygear.publicDB.save([record1, record2])
.then((result) => {
  const { savedRecords, errors } = result;
  savedRecords.foeEach((eachRecord, idx) => {
    if (eachRecord) {
      console.log(`Successfully saved record: ${eachRecord}`);
      console.warn(`Rejected saving fields: ${eachRecord.$rejectedFields}`)
    } else {
      console.log(`Failed to save: ${errors[idx]}`);
    }
  });
}, (err) => {
  console.error(`Failed to save: ${err}`);
});
```

# Samples for Some Use Cases

Use Case 1: Make gender field of user record private to every one except owner

| RecordType | Field  | UserRole | AccessLevel | DiscoveryLevel |
|------------|--------|----------|-------------|----------------|
| *          | *      | Public   | ReadWrite   | Queryable      |
| User       | gender | AnyUser  | NoAccess    | NotQueryable   |
| User       | gender | Owner    | ReadWrite   | Queryable      |

Use Case 2: Make gender field of user record private to every one, readable
and queryable to stared users and updatable to owner

| RecordType | Field  |  UserRole      | AccessLevel | DiscoveryLevel |
|------------|--------|----------------|-------------|----------------|
| *          | *      | Public         | ReadWrite   | Queryable      |
| User       | gender | AnyUser        | NoAccess    | NotQueryable   |
| User       | gender | UserSet:stared | ReadOnly    | Queryable      |
| User       | gender | Owner          | ReadWrite   | Queryable      |

Use Case 3: Make a slug field of photo record, updatable to owner but only
discoverable by others

| RecordType | Field |  UserRole   | AccessLevel | DiscoveryLevel |
|------------|-------|-------------|-------------|----------------|
| *          | *     | Public      | ReadWrite   | Queryable      |
| Photo      | slug  | AnyUser     | Readable    | Discoverable   |
| Photo      | slug  | Owner       | ReadWrite   | Queryable      |

# Changes on API at skygear-server

## Get / Update the field-based ACL

Two actions would be added to Skygear server for getting and updating the
field-based ACL. Both of them are expected to called with **master key**.

The following is a sample request of **getting field-based ACL**:

```json
{
  "action": "schema:field_access:get",
  "api_key": "my-master-key"
}
```

The following is a sample request of **updating field-based ACL**:

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

## Record Partial Update

To support record partial update, warnings are added to the response
interface of `record:update` action to indicate the rejected fields on a
**non-atomic** save action.

The following is a sample response of a record partial update:

```js
{
  "result": [
    {
      // record that saved successfully
      "_access": [
        { "level": "read", "public": true }
      ],
      "_created_at": "2017-06-19T06:06:16.734626Z",
      "_created_by": "3c25ddff-b6d4-4d1d-8e67-45c3d82c90f5",
      "_id": "note/1",
      "_ownerID": "3c25ddff-b6d4-4d1d-8e67-45c3d82c90f5",
      "_type": "record",
      "_updated_at": "2017-06-19T06:33:33.081303Z",
      "_updated_by": "3c25ddff-b6d4-4d1d-8e67-45c3d82c90f5",
      "content": "hello world",
      "tags": ["important", "must-read"]
    },
    {
      // record that saved partially
      "_access": [
        { "level": "read", "public": true }
      ],
      "_created_at": "2017-06-19T06:06:30.125993Z",
      "_created_by": "3c25ddff-b6d4-4d1d-8e67-45c3d82c90f5",
      "_id": "note/2",
      "_ownerID": "3c25ddff-b6d4-4d1d-8e67-45c3d82c90f5",
      // list of warnings for the request
      "_warnings": [
        {
          "code": 999,
          "message": "fields permission denied",
          "info": {
            "fields": ["tags"]
          }
        }
      ],
      "_type": "record",
      "_updated_at": "2017-06-19T06:33:33.089476Z",
      "_updated_by": "3c25ddff-b6d4-4d1d-8e67-45c3d82c90f5",
      "content": "foo bar",
      "tags": ["must-read"]
    },
    {
      // record that failed to update
      "_id": "note/3",
      "_type": "error",
      "code": 102,
      "message": "no permission to modify",
      "name": "PermissionDenied"
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
