# Record API

https://github.com/SkygearIO/features/pull/227 is considered in this doc.

### Fetch

#### iOS

##### Old

```objc
- (void)performQuery:(SKYQuery *)query
    completionHandler:
        (void (^_Nullable)(NSArray *_Nullable results, NSError *_Nullable error))completionHandler;

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
@interface SKYFetchRecordResult

@property (nonatomic, readonly) SKYRecord *_Nullable record;
@property (nonatomic, readonly) NSError *_Nullable error;

@end

- (void)performQuery:(SKYQuery *)query
          completion:
            (void (^_Nullable)(NSArray *_Nullable results, NSError *_Nullable error))completion;

- (void)performCachedQuery:(SKYQuery *)query
                completion:(void (^_Nullable)(NSArray *_Nullable results, BOOL pending,
                                              NSError *_Nullable error))completion;

- (void)fetchRecordWithType:(NSString *)recordType
                   recordID:(NSString *)recordID
                 completion:(void (^_Nullable)(SKYRecord *_Nullable record,
                                               NSError *_Nullable error))completion;

- (void)fetchRecordsWithType:(NSString *)recordType
                   recordIDs:(NSArray<NSString *> *)recordIDs
                  completion:(void (^)(NSArray<SKYFetchRecordResult*> *results,
                                       NSError *operationError))completion;
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
public class FetchRecordResult {
    public final Record record;
    public final Error error;
}

public abstract class RecordFetchResponseHandler implements ResponseHandler {
    public void onFetchSuccess(FetchRecordResult[] results) {}
    public abstract void onFetchError(Error error);
}

public abstract class RecordQueryResponseHandler implements ResponseHandler {
    public void onQuerySuccess(Record[] records) {}
    public void onQuerySuccess(Record[] records, QueryInfo queryInfo) {}
    public abstract void onQueryError(Error error);
}

public void fetchRecordById(String recordType, String recordId, RecordFetchResponseHandler handler);
public void fetchRecordById(String recordType, String[] recordIds, RecordFetchResponseHandler handler);
public void query(Query query, RecordQueryResponseHandler handler);
```

#### JS

##### Old

```ts
getRecordByID(id: string): Promise<Record>;

type cachedQueryCallback = (result: QueryResult, isCached: true) => void;
query(query: Query, cacheCallback: cachedQueryCallback): Promise<QueryResult>;
```

##### New

```ts
class FetchRecordResult {
    public record: Record;
    public error: Error;
}

/**
 * The function resolve if sdk call the operation successfully, no matter
 * how many records can be saved. The function reject only if the whole request
 * reject. e.g. network error
 */
fetchRecordByID(type: string, id: string | string[]): Promise<FetchRecordResult[]>;

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


@interface SKYSaveRecordResult

@property (nonatomic, readonly) SKYRecord *_Nullable record;
@property (nonatomic, readonly) NSError *_Nullable error;

@end

- (void)saveRecordsNonAtomically:(NSArray<SKYRecord *> *)records
                      completion:(void (^)(NSArray<SKYSaveRecordResult*> *results,
                                           NSError *operationError))completion;
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
public class SaveRecordResult {
    public final Record record;
    public final Error error;
}

public abstract class RecordSaveResponseHandler implements ResponseHandler {
    public abstract void onSaveSuccess(Record[] records);
    public abstract void onSaveFail(Error error);
}

public abstract class RecordNonAtomicSaveResponseHandler implements ResponseHandler {
    public abstract void onSaveSuccess(SaveRecordResult[] results);
    public abstract void onSaveFail(Error error);
}

public void save(Record record, RecordSaveResponseHandler handler);
public void save(Record[] records, RecordSaveResponseHandler handler);
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
class SaveRecordResult {
    public record: Record;
    public error: Error;
}

/**
 * The function resolve with a single record when input is a single record.
 * The function resolve with array when input is array.
 */
save(records: Record | Record[]): Promise<Record | Record[]>;

/**
 * The function resolve if at least one record is save sucessfully.
 * The function reject for any operational error or no record is saved.
 */
saveNonAtomically(records: Record[]): Promise<SaveRecordResult[]>;
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

```objc
@interface SKYDeleteRecordResult

@property (nonatomic, readonly) String *_Nullable recordID;
@property (nonatomic, readonly) NSError *_Nullable error;

@end

- (void)deleteRecordWithType:(NSString *)recordType
                    recordID:(NSString *)recordID
                  completion:(void (^_Nullable)(NSString *_Nullable recordID,
                                                NSError *_Nullable error))completion;

- (void)deleteRecordsWithType:(NSString *)recordType
                    recordIDs:(NSArray<NSString *> *)recordIDs
                   completion:(void (^_Nullable)(NSArray *_Nullable deletedRecordIDs,
                                                 NSError *_Nullable error))completion;

- (void)deleteRecordsWithTypeNonAtomically:(NSString *)recordType
                                 recordIDs:(NSArray<NSString *> *)recordIDs
                                completion:
                            (void (^_Nullable)(NSArray<SKYDeleteRecordResult*> *_Nullable results,
                                               NSError *_Nullable error))completion;
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

```java
public class DeleteRecordResult {
    public final String recordID;
    public final Error error;
}

public abstract class RecordDeleteResponseHandler implements ResponseHandler {
    public abstract void onDeleteSuccess(String[] ids);
    public abstract void onDeleteFail(Error error);
}

public abstract class RecordNonAtomicDeleteResponseHandler implements ResponseHandler {
    public abstract void onDeleteSuccess(DeleteRecordResult[] results);
    public abstract void onDeleteFail(Error error);
}

public void delete(Record record, RecordDeleteResponseHandler handler);
public void delete(Record[] records, RecordDeleteResponseHandler handler);
public void deleteNonAtomically(Record[] records, RecordNonAtomicDeleteResponseHandler handler);
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

```ts
class DeleteRecordResult {
    public recordID: String;
    public error: Error;
}

del(records: Record | Record[] | QueryResult): Promise<String | String[]>;
// alias to
// delete(records: Record | Record[] | QueryResult): Promise<undefined>;

/**
 * The function resolve if at least one record is deleted sucessfully.
 * The function reject for any operational error or no record is deleted.
 */
delNonAtomically(records: Record[] | QueryResult): Promise<DeleteRecordResult[]>;
// alias to
// deleteNonAtomically(records: Record[] | QueryResult): Promise<DeleteRecordResult[]>;
```
