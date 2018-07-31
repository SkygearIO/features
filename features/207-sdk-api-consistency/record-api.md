# Record API

https://github.com/SkygearIO/features/pull/227 is considered in this doc.

### Fetch

#### iOS

##### Old

```objc
- (void)performQuery:(SKYQuery *)query
          completion:
            (void (^_Nullable)(NSArray *_Nullable results, NSError *_Nullable error))completion;


- (void)performCachedQuery:(SKYQuery *)query
         completionHandler:(void (^_Nullable)(NSArray *_Nullable results, BOOL pending,
                                              NSError *_Nullable error))completionHandler;

- (void)fetchRecordWithID:(SKYRecordID *)recordID
        completionHandler:(void (^_Nullable)(SKYRecord *_Nullable record,
                                             NSError *_Nullable error))completionHandler;

- (void)fetchRecordsWithIDs:(NSArray<SKYRecordID *> *)recordIDs
          completionHandler:(void (^_Nullable)(NSDictionary *_Nullable recordsByRecordID,
                                               NSError *_Nullable operationError))completionHandler
      perRecordErrorHandler:(void (^_Nullable)(SKYRecordID *_Nullable recordID,
                                               NSError *_Nullable error))errorHandler;
```

##### New

```objc
@interface SKYQueryInfo

@property (nonatomic, readonly) int overallCount;

@end

- (void)performQuery:(SKYQuery *)query
    completionHandler:(void (^_Nullable)(NSArray *_Nullable results,
                                         SKYQueryInfo *_Nullable queryInfo,
                                         NSError *_Nullable error))completionHandler;

- (void)performCachedQuery:(SKYQuery *)query
                completion:(void (^_Nullable)(NSArray *_Nullable results, BOOL pending,
                                              NSError *_Nullable error))completion;

- (void)fetchRecordWithType:(NSString *)recordType
                   recordID:(NSString *)recordID
                 completion:(void (^_Nullable)(SKYRecord *_Nullable record,
                                               NSError *_Nullable error))completion;

// Generic RecordResult object for fetch, non-atomic save and delete
NS_SWIFT_NAME("__SKYRecordResult")
@interface SKYRecordResult<ObjectType> : NSObject

@property (nonatomic, readonly) ObjectType value;
@property (nonatomic, readonly) NSError* error;

@end

- (void)fetchRecordsWithType:(NSString *)recordType
                   recordIDs:(NSArray<NSString *> *)recordIDs
                  completion:(void (^)(NSArray<SKYRecordResult<SKYRecord*>*> *results,
                                       NSError *operationError))completion NS_REFINED_FOR_SWIFT;
```

```swift
enum SKYRecordResult<T> {
    case success(T)
    case error(NSError)
}

extension SKYDatabase {
    func fetchRecords(type: NSString,
                      recordIDs: [NSString],
                      completion: ([SKYRecordResult<SKYRecord>]?, NSError?) -> Void) {
    }
}
```

#### Android

##### Old

```java
public abstract class RecordQueryResponseHandler implements ResponseHandler {
    public void onQuerySuccess(Record[] records) {}
    public void onQuerySuccess(Record[] records, QueryInfo queryInfo) {}
    public abstract void onQueryError(Error error);
}

public void query(Query query, RecordQueryResponseHandler handler);
```

##### New

```java
/**
 * Generic RecordResult object for fetch, non-atomic save and delete
 * RecordResult represent the result of operation, 
 * value will be the record id or record object if the operation is success
 * otherwise there will be error
 */
public class RecordResult<T> {
    public final T value;
    public final Error error;
}

public abstract class RecordFetchResponseHandler<T> implements ResponseHandler {
    public void onFetchSuccess(T result) {}
    public abstract void onFetchError(Error error);
}

public void fetchRecordById(String recordType,
                            String recordId,
                            RecordFetchResponseHandler<Record> handler);
public void fetchRecordById(String recordType,
                            String[] recordIds,
                            RecordFetchResponseHandler<RecordResult<Record>[]> handler);

public abstract class RecordQueryResponseHandler implements ResponseHandler {
    public void onQuerySuccess(Record[] records) {}
    public void onQuerySuccess(Record[] records, QueryInfo queryInfo) {}
    public abstract void onQueryError(Error error);
}

public void query(Query query, RecordQueryResponseHandler handler);
```

##### Fetch api example

```java
// fetch single record
skygear.getPublicDatabase().fetchRecordById("note", "uuid1", new RecordFetchResponseHandler<RecordResult<Record>>() {
    @Override
    public void onFetchSuccess(Record result) {
        Log.d("Fetched record", "id: " + result.id);
    }

    @Override
    public void onFetchError(Error error) {

    }
});

// fetch multiple records
skygear.getPublicDatabase().fetchRecordById("note", new String[]{"uuid1"}, new RecordFetchResponseHandler<RecordResult<Record>>() {
    @Override
    public void onFetchSuccess(RecordResult<Record>[] result) {
        for (RecordResult<Record> eachResult: result) {
            if (eachResult.error != null) {
                Record record = eachResult.value;
                Log.d("Fetched record", "id: " + record.id);
            }
        }
    }

    @Override
    public void onFetchError(Error error) {

    }
});
```

#### JS

##### Old

```ts
class QueryResult extends Array {
  get overallCount() {
    return this._overallCount;
  }
}

getRecordByID(id: string): Promise<Record>;

type cachedQueryCallback = (result: QueryResult, isCached: true) => void;
query(query: Query, cacheCallback: cachedQueryCallback): Promise<QueryResult>;
```

##### New

```ts
type FetchResult = Record | Error;
/**
 * The function reject if none is found
 */
fetchRecordByID(type: string, id: string): Promise<Record>;
/**
 * The function resolve with individual record not found error.
 * The function reject only for operational error e.g. network or server error.
 */
fetchRecordsByID(type: string, ids: string[]): Promise<FetchResult[]>;

class QueryResult extends Array {
  get overallCount() {
    return this._overallCount;
  }
}
type cachedQueryCallback = (result: QueryResult, isCached: true) => void;
query(query: Query, cacheCallback: cachedQueryCallback): Promise<QueryResult>;
```

### Save

#### iOS

##### Old

```objc
typedef void (^SKYRecordSaveCompletion)(SKYRecord *record, NSError *error);

- (void)saveRecord:(SKYRecord *)record completion:(SKYRecordSaveCompletion _Nullable)completion;

- (void)saveRecords:(NSArray<SKYRecord *> *)records
        completionHandler:(void (^_Nullable)(NSArray *_Nullable savedRecords,
                                             NSError *_Nullable operationError))completionHandler
    perRecordErrorHandler:
        (void (^_Nullable)(SKYRecord *_Nullable record, NSError *_Nullable error))errorHandler;

- (void)saveRecordsAtomically:(NSArray<SKYRecord *> *)records
            completionHandler:
                (void (^_Nullable)(NSArray *_Nullable savedRecords,
                                   NSError *_Nullable operationError))completionHandler;
```

##### New

```objc
typedef void (^SKYRecordSaveCompletion)(SKYRecord *record, NSError *error);

- (void)saveRecord:(SKYRecord *)record
        completion:(SKYRecordSaveCompletion)completion;

- (void)saveRecords:(NSArray<SKYRecord *> *)records
         completion:(void (^)(NSArray *savedRecords,
                              NSError *operationError))completion;

// Generic RecordResult object for fetch, non-atomic save and delete
NS_SWIFT_NAME("__SKYRecordResult")
@interface SKYRecordResult<ObjectType> : NSObject

@property (nonatomic, readonly) ObjectType value;
@property (nonatomic, readonly) NSError* error;

@end

- (void)saveRecordsNonAtomically:(NSArray<SKYRecord *> *)records
                      completion:(void (^)(NSArray<SKYRecordResult<SKYRecord*>*> *results,
                                           NSError *operationError))completion NS_REFINED_FOR_SWIFT;
```

```swift
enum SKYRecordResult<T> {
    case success(T)
    case error(NSError)
}

extension SKYDatabase {
    func saveRecordsNonAtomically(type: NSString,
                                  records: [SKYRecord],
                                  completion: ([SKYRecordResult<SKYRecord>]?, NSError?) -> Void) {
    }
}
```

#### Android

##### Old

```java
public abstract class RecordSaveResponseHandler implements ResponseHandler {
    public abstract void onSaveSuccess(Record[] records);
    public abstract void onPartiallySaveSuccess(Map<String, Record> successRecords, Map<String, Error> errors);
    public abstract void onSaveFail(Error error);
}

public void save(Record record, RecordSaveResponseHandler handler);
public void save(Record[] records, RecordSaveResponseHandler handler);
public void saveAtomically(Record record, RecordSaveResponseHandler handler);
public void saveAtomically(Record[] records, RecordSaveResponseHandler handler);
```

##### New

```java
public abstract class RecordSaveResponseHandler<T> implements ResponseHandler {
    public abstract void onSaveSuccess(T records);
    public abstract void onSaveFail(Error error);
}

public void save(Record record, RecordSaveResponseHandler<Record> handler);
public void save(Record[] records, RecordSaveResponseHandler<Record[]> handler);

// Generic RecordResult object for fetch, non-atomic save and delete
public class RecordResult<T> {
    public final T value;
    public final Error error;
}

public abstract class RecordNonAtomicSaveResponseHandler implements ResponseHandler {
    public abstract void onSaveSuccess(RecordResult<Record> results);
    public abstract void onSaveFail(Error error);
}

public void saveNonAtomically(Record[] records, RecordNonAtomicSaveResponseHandler handler);
```

#### JS

##### Old

```ts
/**
 * The function resolve with a single record when input is a single record or array with one record only.
 * The function resolve array of records when input is array of records.
 * The function reject if the operation involves one record and it fails.
 */
save(records: Record | Record[], options: { atomic: boolean }): Promise<Record | Record[]>;
```

##### New

```ts
saveRecord(record: Record): Promise<Record>;
saveRecords(records: Record[]): Promise<Record[]>;

type NonAtomicSaveResult = Record | Error;
/**
 * The function resolve with individual record cannot be saved error.
 * The function reject only for operational error e.g. network or server error
 *
 */
saveNonAtomically(records: Record[]): Promise<NonAtomicSaveResult[]>;
```

### Delete

#### iOS

##### Old

```objc
- (void)deleteRecordWithID:(SKYRecordID *)recordID
         completionHandler:(void (^_Nullable)(SKYRecordID *_Nullable recordID,
                                              NSError *_Nullable error))completionHandler;

- (void)deleteRecordsWithIDs:(NSArray<SKYRecordID *> *)recordIDs
           completionHandler:(void (^_Nullable)(NSArray *_Nullable deletedRecordIDs,
                                                NSError *_Nullable error))completionHandler
       perRecordErrorHandler:(void (^_Nullable)(SKYRecordID *_Nullable recordID,
                                                NSError *_Nullable error))errorHandler;

- (void)deleteRecordsWithIDsAtomically:(NSArray<SKYRecordID *> *)recordIDs
                     completionHandler:
                         (void (^_Nullable)(NSArray *_Nullable deletedRecordIDs,
                                            NSError *_Nullable error))completionHandler;
```

##### New

- Deleted record is an `SKYRecord` Object that contain `recordID`, `recordType` and `deleted`,
`deleted` is `true` and the other part of record is empty.

```objc
- (void)deleteRecordWithType:(NSString *)recordType
                    recordID:(NSString *)recordID
                  completion:(void (^_Nullable)(NSString *_Nullable recordID,
                                                NSError *_Nullable error))completion;

- (void)deleteRecordsWithType:(NSString *)recordType
                    recordIDs:(NSArray<NSString *> *)recordIDs
                   completion:(void (^_Nullable)(NSArray *_Nullable deletedRecordIDs,
                                                 NSError *_Nullable error))completion;

- (void)deleteRecord:(SKYRecord *)record
          completion:(void (^_Nullable)(SKYRecord *_Nullable deleteRecord,
                                        NSError *_Nullable error))completion;

- (void)deleteRecords:(NSArray<SKYRecord*> *)records
           completion:(void (^_Nullable)(NSArray *_Nullable deleteRecords,
                                         NSError *_Nullable error))completion;

// Generic RecordResult object for fetch, non-atomic save and delete
NS_SWIFT_NAME("__SKYRecordResult")
@interface SKYRecordResult<ObjectType> : NSObject

@property (nonatomic, readonly) ObjectType value;
@property (nonatomic, readonly) NSError* error;

@end

// results contain deleted record id
- (void)deleteRecordsNonAtomicallyWithType:(NSString *)recordType
                                 recordIDs:(NSArray<NSString *> *)recordIDs
                                completion:(void (^_Nullable)(
                                    NSArray<SKYRecordResult<NSString*>*> *_Nullable results,
                                    NSError *_Nullable error))completion NS_NS_REFINED_FOR_SWIFT;

// results contain deleted record
- (void)deleteRecordsNonAtomically:(NSArray<SKYRecord *> *)records
                        completion:(void (^_Nullable)(NSArray<SKYRecordResult<Record*>*> *_Nullable results,
                                                      NSError *_Nullable error))completion NS_NS_REFINED_FOR_SWIFT;
```

```swift
enum SKYRecordResult<T> {
    case success(T)
    case error(NSError)
}

extension SKYDatabase {
    func deleteRecordsNonAtomically(type: NSString,
                                    recordIDs: [NSString],
                                    completion: ([SKYRecordResult<NSString>]?, NSError?) -> Void) {
    }

    func deleteRecordsNonAtomically(records: [SKYRecords],
                                    completion: ([SKYRecordResult<SKYRecord>]?, NSError?) -> Void) {
    }
}
```

#### Android

##### Old

```java
public abstract class RecordDeleteResponseHandler implements ResponseHandler {
    public abstract void onDeleteSuccess(String[] ids);
    public abstract void onDeletePartialSuccess(String[] ids, Map<String, Error> errors);
    public abstract void onDeleteFail(Error error);
}

public void delete(Record record, RecordDeleteResponseHandler handler);
public void delete(Record[] records, RecordDeleteResponseHandler handler);
```

##### New

- Deleted record is an `Record` Object that contain `id`, `type` and `deleted`,
`deleted` is `true` and the other part of record is empty.

```java
public abstract class RecordDeleteResponseHandler<T> implements ResponseHandler {
    /**
    *
    * @param result record id or ids
    *
    **/
    public abstract void onDeleteSuccess(T result);
    public abstract void onDeleteFail(Error error);
}

public void delete(String type, String recordID, RecordDeleteResponseHandler<String> handler);
public void delete(String type, String[] recordIDs, RecordDeleteResponseHandler<String[]> handler);
public void delete(Record record, RecordDeleteResponseHandler<Record> handler);
public void delete(Record[] records, RecordDeleteResponseHandler<Record[]> handler);


// Generic RecordResult object for fetch, non-atomic save and delete
public class RecordResult<T> {
    public final T value;
    public final Error error;
}

public abstract class RecordNonAtomicDeleteResponseHandler<T> implements ResponseHandler {
    /**
    *
    * @param results for record delete successfully, result.value will be recordID
    *
    **/
    public abstract void onDeleteSuccess(RecordResult<T>[] results);
    public abstract void onDeleteFail(Error error);
}

public void deleteNonAtomically(String[] recordIDs, RecordNonAtomicDeleteResponseHandler<String> handler);
public void deleteNonAtomically(Record[] records, RecordNonAtomicDeleteResponseHandler<Record> handler);
```

#### JS

##### Old

```ts
type DeleteResult = Error | undefined;
/**
 * The function resolve with one single result when input is one record or array with one record only.
 * The function resolve array of results when input is array of records.
 * The function reject if the operation involves one record and it fails.
 */
del(records: Record | Record[] | QueryResult): Promise<DeleteResult | DeleteResult[]>;
// alias to
// delete(records: Record | Record[] | QueryResult): Promise<DeleteResult | DeleteResult[]>;
```

##### New

- Deleted record is an `Record` Object that contain `_recordID`, `_recordType` and `_deleted`,
`_deleted` is `true` and the other part of record is empty.

```ts
deleteRecordByID(type: string, id: string): Promise<String>;
deleteRecordsByID(type: string, ids: string[]): Promise<String[]>;

deleteRecord(record: Record): Promise<Record>;
deleteRecords(records: Record[] | QueryResult): Promise<Record[]>;

type NonAtomicDeleteByIDResult = String | Error;
type NonAtomicDeleteResult = Record | Error;
/**
 * The function resolve with individual record is not deleted error.
 * The function reject only for operational error e.g. network or server error.
 */
deleteRecordsNonAtomicallyByID(type: string, ids: Record[] | QueryResult): Promise<NonAtomicDeleteByIDResult[]>;
deleteRecordsNonAtomically(records: Record[] | QueryResult): Promise<NonAtomicDeleteResult[]>;
```
