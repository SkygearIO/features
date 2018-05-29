# Removing `type/` from APIs

## Overview of changes

This document propose what changes are needed to remove `type/` from Skygear API
so that developer will have consistent experience when needing to specify
a Record ID.

Throughout this document the different ID formats are described as:

Deprecated ID - "note/0ebd484c-ed82-4b04-aba7-33fc530f3c88"
Record Type - "note"
Record ID - "0ebd484c-ed82-4b04-aba7-33fc530f3c88"

### Changes to SDK API

* API that accepts deprecated ID as parameter should accept a Record Type and
  a Record ID as parameter, both of `string` type.
* API that accepts a list of deprecated IDs as parameter should accept a Record
  Type (string) and a list of Record ID (string).
* API that returns deprecated IDs (or list) should return Record ID (string),
  the Record Type is either
  * Will be omitted if Record Type is already known. For example, delete
    operation will return a Record IDs, and the Record Type is inferred from
    the Record Type used in the delete operation.
  * Will return a Reference instead, which has separate Record ID and Record
    Type fields.
  * Other cases will need to be discussed.
* API that supports deprecated IDs with multiple Record Types will no longer
  be available. Make multiple API calls instead. Saving record is different,
  because it operates on a list of Records, not a list of deprecated IDs.
* Record class and encoded payload should have Record Type separated
  to a different field.

### Changes to Server API

* Parameters which accept deprecated IDs will be deprecated. New parameters
  will be added for specifying Record Type and Record IDs.
* Encoded Record payload will have deprecated ID replaced with a Record Type
  and a Record ID.
* Reference will have deprecated ID replaced with a Record Type and
  a Record ID.

### Payload Format

Old:

```json
{
	"_id": "note/note1",
	"_access": null,
	"_ownerID": "ownerID",
	"category": {"$id":"category/important","$type":"ref"},
	"city": {"$id":"city/beautiful","$type":"ref"},
	"secret":{"$id":"secret/secretID","$type":"ref"},
	"_transient": {"secret":null}
}
```

New:

```json
{
	"_recordID": "b7c66af9-cabd-4e12-bcce-0a873dfb6328",
	"_recordType": "note",
	"_access": null,
	"_ownerID": "ownerID",
	"category": {"$recordID":"important","$recordType":"category","$type":"ref"},
	"city": {"$recordID":"beautiful","$recordType":"city","$type":"ref"},
	"secret":{"$recordID":"secret","$recordType":"secret","$type":"ref"},
	"_transient": {"secret":null}
}
```
