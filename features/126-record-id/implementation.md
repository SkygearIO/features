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
    "recordIDs": ["4d4a6018-d365-4103-b35a-249b972ae614"]
    "recordType": "note"
}

// Transitional (maintaining backward compatibility)
{
    "action": "record:delete",
    "ids": ["note/4d4a6018-d365-4103-b35a-249b972ae614"],
    "recordIDs": ["4d4a6018-d365-4103-b35a-249b972ae614"],
    "recordType": "note"
}
```

## iOS SDK

This illustrates how the convenient methods will change. The SKYOperation APIs
will be updated as well but not illustrated here.

The Record fetch, save and delete APIs are changed substantially:

```obj-c
// Old
- (void)fetchRecordWithID:(SKYRecordID *)recordID
        completionHandler:(void (^)(SKYRecord *record, NSError *error))completionHandler;

// New
- (void)fetchRecordWithType:(NSString *)recordType
                   recordID:(NSString *)recordID
                 completion:(void (^)(SKYRecord *record, NSError *error))completion;

// Old
- (void)fetchRecordsWithIDs:(NSArray<SKYRecordID *> *)recordIDs
          completionHandler:(void (^)(NSDictionary *recordsByRecordID,
                                      NSError *operationError))completionHandler
      perRecordErrorHandler:(void (^)(SKYRecordID *recordID,
                                      NSError *error))errorHandler;

// New, no longer support fetching multiple types
- (void)fetchRecordsWithType:(NSString *)recordType
                   recordIDs:(NSArray<NSString *> *)recordIDs
                  completion:(void (^)(NSArray<id> *records,
                                       NSArray<id> *operationError))completion NS_REFINED_FOR_SWIFT;

extension SKYDatabase {
    func fetchRecords(type: NSString,
                      recordIDs: [NSString],
                      completion: (records: [SKYRecord?], errors: [NSError?]) -> Void) {
        ...
    }
}

// Old
- (void)saveRecords:(NSArray<SKYRecord *> *)records
        completionHandler:(void (^_Nullable)(NSArray *_Nullable savedRecords,
                                             NSError *_Nullable operationError))completionHandler
    perRecordErrorHandler:
        (void (^_Nullable)(SKYRecord *_Nullable record, NSError *_Nullable error))errorHandler;

- (void)saveRecordsAtomically:(NSArray<SKYRecord *> *)records
            completionHandler:
                (void (^_Nullable)(NSArray *_Nullable savedRecords,
                                   NSError *_Nullable operationError))completionHandler;

// New, perRecordErrorHandler will be removed
- (void)saveRecords:(NSArray<SKYRecord *> *)records
         completion:(void (^_Nullable)(NSArray<id> *savedRecords,
                                       NSArray<id> *errors))completion NS_REFINED_FOR_SWIFT;

extension SKYDatabase {
    func saveRecords(_ records: [SKYRecord],
                    completion: (savedRecord: [SKYRecord?], errors: [NSError?]) -> Void) {
        ...
    }
}

- (void)saveRecordsAtomically:(NSArray<SKYRecord *> *)records
                   completion:(void (^_Nullable)(NSArray<SKYRecord *> *savedRecords,
                                                 NSError *error))completion;

// Old
- (void)deleteRecordWithID:(SKYRecordID *)recordID
         completionHandler:(void (^)(SKYRecordID *recordID,
                                     NSError *error))completionHandler;

- (void)deleteRecordsWithIDs:(NSArray<SKYRecordID *> *)recordIDs
           completionHandler:(void (^)(NSArray *deletedRecordIDs,
                                       NSError *error))completionHandler
       perRecordErrorHandler:(void (^)(SKYRecordID *recordID,
                                       NSError *error))errorHandler;

- (void)deleteRecordsWithIDsAtomically:(NSArray<SKYRecordID *> *)recordIDs
                     completionHandler:(void (^)(NSArray *_Nullable deletedRecordIDs,
                                                 NSError *_Nullable error))completionHandler;

// New, no longer support deleting multiple types, perRecordErrorHandler will be removed
- (void)deleteRecordWithType:(NSString *)recordType
                    recordID:(NSString *)recordID
                  completion:(void (^)(NSString *recordID,
                                       NSError *error))completion;

- (void)deleteRecordsWithType:(NSString *)recordType
                    recordIDs:(NSArray<NSString *> *)recordIDs
                   completion:(void (^)(NSArray<id> *deletedRecordIDs,
                                       NSArray<id> *errors))completion NS_REFINED_FOR_SWIFT;

extension SKYDatabase {
    func deleteRecords(type: NSString,
                       recordIDs:[NSString],
                       completion: (deletedRecordIDs: [NSString?], errors: [NSError?]) -> Void) {
        ...
    }
}

- (void)deleteRecordsWithTypeAtomically:(NSString *)recordType
                              recordIDs:(NSArray<NSString *> *)recordIDs
                             completion:(void (^)(NSArray<NSString *> *deletedRecordIDs,
                                                  NSError *errors))completion;
```

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

After updating the id format, ids are not necessarily unique in single save
request. So partially save handler will change from map to array. 

```java
// old
public abstract class RecordSaveResponseHandler implements ResponseHandler {

    ...
    public abstract void onPartiallySaveSuccess(Map<String, Record> successRecords, Map<String, Error> errors);
}

public abstract class RecordDeleteResponseHandler implements ResponseHandler {

    ...
    public abstract void onDeletePartialSuccess(Map<String, Record> successRecords, Map<String, Error> errors);
}

// new
public abstract class RecordSaveResponseHandler implements ResponseHandler {

    ...

    public abstract void onPartialSaveSuccess(Record[] successRecords, Error[] errors);
}

public abstract class RecordDeleteResponseHandler implements ResponseHandler {

    ...

    public abstract void onPartialDeleteSuccess(String[] ids, Error[] errors);
}
```

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

### Non-atomic save callback for partially save

- For non-atomic save in SDKs, we will use 2 arrays to represent the result,
array of saved records and array of errors. The length of 2 arrays will be the
same as the length of request records. For example, if we save 10 records and
the first two records can not be saved. The records array should have 8 records
and the first two items will be null. The errors array will have 2 errors
objects and the rest will be null.
