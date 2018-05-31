# Removing `type/` from APIs

## Record Payload

```json
// Old
{
    "_id": "note/4d4a6018-d365-4103-b35a-249b972ae614",
    "_access": null,
    "category": {
        "$id": "category/de3365c0-b89e-4e1e-8645-bd1ef33012af",
        "$type": "ref"
    },
}

// New
{
    "_recordID": "4d4a6018-d365-4103-b35a-249b972ae614",
    "_recordType": "note",
    "_access": null,
    "category": {
        "$recordType": "category", 
        "$recordID": "de3365c0-b89e-4e1e-8645-bd1ef33012af", 
        "$type": "ref"
    },
}

// Transitional (maintaining backward compatibility)
{
    "_id": "note/4d4a6018-d365-4103-b35a-249b972ae614",
    "_recordID": "4d4a6018-d365-4103-b35a-249b972ae614",
    "_recordType": "note",
    "_access": null,
    "category": {
        "$id": "category/de3365c0-b89e-4e1e-8645-bd1ef33012af",
        "$recordType": "category", 
        "$recordID": "de3365c0-b89e-4e1e-8645-bd1ef33012af", 
        "$type": "ref"
    },
}
```

## Server

```
// Deprecated
// Note: There is no plan to update record:fetch because SDK should use record:query.
{
    "action": "record:fetch",
    "ids": ["note/4d4a6018-d365-4103-b35a-249b972ae614"]
}

// Old
{
    "action": "record:delete",
    "ids": ["note/4d4a6018-d365-4103-b35a-249b972ae614"]
}

// New
{
    "action": "record:delete",
    "ids": ["4d4a6018-d365-4103-b35a-249b972ae614"]
    "type": "note"
}
```

## iOS SDK

This illustrates how the convenient methods will change. The SKYOperation APIs
will be updated as well but not illustrated here.

The Record fetch and delete APIs are changed substantially:

```obj-c
// Old
- (void)fetchRecordWithID:(SKYRecordID *)recordID
        completionHandler:(void (^)(SKYRecord *record, NSError *error))completionHandler;

// New
- (void)fetchRecordWithType:(NSString *)recordType
                   recordID:(NSString *)recordID
          completionHandler:(void (^)(SKYRecord *record, NSError *error))completionHandler;

// Old
- (void)fetchRecordsWithIDs:(NSArray<SKYRecordID *> *)recordIDs
          completionHandler:(void (^)(NSDictionary *recordsByRecordID,
                                      NSError *operationError))completionHandler
      perRecordErrorHandler:(void (^)(SKYRecordID *recordID,
                                      NSError *error))errorHandler;

// New, no longer support fetching multiple types
- (void)fetchRecordsWithTypes:(NSString *)recordType
                     recordID:(NSString *)recordID
            completionHandler:(void (^)(NSDictionary<NSString *, SKYRecord *> *recordsByRecordID,
                                      NSError *operationError))completionHandler
      perRecordErrorHandler:(void (^)(NSString *recordID,
                                      NSError *error))errorHandler;

// Old
- (void)deleteRecordWithID:(SKYRecordID *)recordID
         completionHandler:(void (^)(SKYRecordID *recordID,
                                     NSError *error))completionHandler;

// New
- (void)deleteRecordWithType:(NSString *)recordType
                    recordID:(NSString *)recordID
           completionHandler:(void (^)(NSString *recordID,
                                       NSError *error))completionHandler;

// Old
- (void)deleteRecordsWithIDs:(NSArray<SKYRecordID *> *)recordIDs
           completionHandler:(void (^)(NSArray *deletedRecordIDs,
                                       NSError *error))completionHandler
       perRecordErrorHandler:(void (^)(SKYRecordID *recordID,
                                       NSError *error))errorHandler;

// New, no longer support deleting multiple types
- (void)deleteRecordsWithType:(NSString *)recordType
                    recordIDs:(NSArray<NSString *> *)recordIDs
           completionHandler:(void (^)(NSArray<NSString *> *deletedRecordIDs,
                                       NSError *error))completionHandler
       perRecordErrorHandler:(void (^)(NSString *recordID,
                                       NSError *error))errorHandler;
```

The record save API does not need to be changed for the purpose of this
document.

The Record class will be changed as follows:

```obj-c
// Deprecated
@property (nonatomic, readonly, copy) NSString *recordName;

// Old
@property (nonatomic, readonly, copy) SKYRecordID *recordID;
@property (nonatomic, readonly, copy) NSString *recordType;

// New
@property (nonatomic, readonly, copy) NSString *recordID;
@property (nonatomic, readonly, copy) NSString *recordType;

// Deprecated
+ (instancetype)recordWithRecordID:(SKYRecordID *)recordId
                              data:(NSDictionary<NSString *, id> *_Nullable)data;

// Old
+ (instancetype)recordWithRecordType:(NSString *)recordType name:(NSString *)recordName;
+ (instancetype)recordWithRecordType:(NSString *)recordType
                                name:(NSString *)recordName
                                data:(NSDictionary<NSString *, id> *_Nullable)data;

// New
+ (instancetype)recordWithRecordType:(NSString *)recordType recordID:(NSString *)recordID;
+ (instancetype)recordWithRecordType:(NSString *)recordType
                            recordID:(NSString *)recordID
                                data:(NSDictionary<NSString *, id> *_Nullable)data;
```

The Reference class will be changed as follows:

```obj-c
// Old
@property (nonatomic, readonly, copy) SKYRecordID *recordID;

// New
@property (nonatomic, readonly, copy) NSString *recordID;
@property (nonatomic, readonly, copy) NSString *recordType;
```

The Reference class will be changed as follows:

```obj-c
// Old
@property (nonatomic, readonly, copy) SKYRecordID *recordID;

// New
@property (nonatomic, readonly, copy) NSString *recordID;
@property (nonatomic, readonly, copy) NSString *recordType;

// Old
+ (instancetype)referenceWithRecordID:(SKYRecordID *)recordID;

// New
+ (instancetype)referenceWithRecordType:(NSString *)recordType
                               recordID:(NSString *)recordID;
```

## Android SDK

The SDK does not expose deprecated ID in the API. The Android SDK does not
support fetching record by ID (need to use query API) and deletion requires
Record object.

## JS SDK

The `recordId` property of Record class will return Record ID instead of
deprecated ID.

```javascript
var Note = Record.extend('note');
var note = new Note({});

// Removed
console.log(note._id);  // undefined

// Old
console.log(note.id);  // 'note/91c02d33-ea8a-41d3-ae6c-a87e064eaa5c'
console.log(note.recordType);  // 'note'

// New
console.log(note.recordID);  // '91c02d33-ea8a-41d3-ae6c-a87e064eaa5c'
console.log(note.recordType);  // 'note'
```
