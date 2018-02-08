# Feature Overview

## Objective

- Enable fetching participants for a given conversation ID and caching participants.

## Description

Currently, this feature is only implemented in UI Kit and achieved by calling Skygear server. However, this approach has three disadvantages,

1. the result is not cached,
2. the implmentation is only in UIKit, but not in chat SDK, which is needed by developers who use their own UI components and
3. participants can only be fetched only after conversation is fetched.

Therefore, we need seperate APIs in chat SDK which has the following features.

1. Accepts a conversation ID,
2. Retrieve a list of user records from internet and store the result into cache,
3. Call callbacks after users are fetched from internet and from cache.

# Change Required

## Server
No change required

## Plugin
- Provide a new lambda called `get_participants` which takes
    - `conversation_id`,
    - `limit`,
    - `offset`,
    - `order_by` and
    - `order`

for example,

```json
{
  "conversation_id": "f0693c06-0bc3-11e8-ba89-0ed5f89f718b",
  "offset": 0,
  "limit": 2,
  "order": "desc",
  "order_by": "created_at"
}
```

And returns a list of user records.

```json
{
  "result": {
    "offset": 0,
    "limit": 2,
    "total": 10,
    "participants": [{
      "_access": null,
      "_created_at": "2018-01-11T07:18:53.791103Z",
      "_created_by": "23db86bd-4c92-44ee-abcd-eff0217d3207",
      "_id": "user/23db86bd-4c92-44ee-abcd-eff0217d3207",
      "_ownerID": "23db86bd-4c92-44ee-abcd-eff0217d3207",
      "_type": "record",
      "_updated_at": "2018-01-11T09:42:24.153172Z",
      "_updated_by": "23db86bd-4c92-44ee-abcd-eff0217d3207",
      "last_login_at": {
        "$date": "2018-01-11T09:42:24.153172Z",
        "$type": "date"
      },
      "username": "howa2"
    }, {
      "_access": null,
      "_created_at": "2018-01-11T07:18:41.794667Z",
      "_created_by": "6a92a9db-1b84-43a4-9bc9-b0c63f996c4a",
      "_id": "user/6a92a9db-1b84-43a4-9bc9-b0c63f996c4a",
      "_ownerID": "6a92a9db-1b84-43a4-9bc9-b0c63f996c4a",
      "_type": "record",
      "_updated_at": "2018-02-07T05:19:27.738244Z",
      "_updated_by": "6a92a9db-1b84-43a4-9bc9-b0c63f996c4a",
      "last_login_at": {
        "$date": "2018-02-07T05:19:27.738244Z",
        "$type": "date"
      },
      "username": "howa"
    }]
  }
}
```
Plugin queries from `user` table and returns the `result` array.
Each record in `result` should be a Skygear record of user.

If limit is less than or equal to 0, then all users will be fetched regardless the value of offset.
Currently, `order_by` only supports `created_at` and `order` are either `desc` (default) or `asc`.

## SDK

Add fetchParticipants API in each platform SDK. The API takes converstion ID string and callback as parameters. Platform SDK should call callback twice, one when the cache is fetched and another one when the result is fetched from plugin.

### Android

#### Options Class (GetParticipantsOptions)
```java
public class GetParticipantsOptions {
    public int offset;
    public int limit;
    public String order;
    public String orderBy;
}
```

#### Response Class (GetParticipantsResponse)
```java
public class GetParticipantsResponse {
    public List<User> participants;
    public int total;
}
```


#### Callback
```java
public interface GetParticipantsCallback extends GetCallback<GetParticipantsResponse> {
    /**
     * Get cached result.
     *
     * @param users cached users
     */
    void onGetCachedResult(@NonNull GetParticipantsResponse response);
}
```
#### getParticipants API

```java
public void getParticipants(@NonNull String conversationId, @Nullable GetParticipantsCallback callback) {
    GetParticipantsOptions options = new GetParticipantsOptions();
    getParticipants(conversationId, options, callback);
}
```


```java
public void getParticipants(@NonNull GetParticipantsRequest request, @NonNull GetParticipantsOptions options, @Nullable GetParticipantsCallback callback) {
    //Implementation
}
```

### iOS

#### Options Class (SKYChatFetchParticipantsOptions)
```objectivec
@interface SKYChatFetchParticipantsOptions: NSObject
@property NSInteger offset;
@property NSInteger limit;
@property NSString  *order;
@property NSString  *orderBy;
@end
```


#### Callback
```objectivec
typedef void (^ SKYChatFetchParticpantsCompletion)
(
 NSInteger total,
 NSArray<SKYRecord *> * participants,
 BOOL isCached,
 NSError *_Nullable error) {
}
```

#### fetchParticipants API
```objectivec
- (void)fetchParticipants:(NSString *)conversationID
               completion:(SKYChatFetchParticpantsCompletion _Nullable)completion
    /* clang-format off */ NS_SWIFT_NAME(fetchParticipants(conversationID:completion:));
```

```objectivec
- (void)fetchParticipants:(NSString *)conversationID
                  options:(SKYChatFetchParticipantsOptions *)options
               completion:(SKYChatFetchParticpantsCompletion _Nullable)completion
    /* clang-format off */ NS_SWIFT_NAME(fetchParticipants(conversationID:options:completion:));
```

### Javascript

#### Option Class
```javascript
var options = {
  limit: 10,
  offset: 0,
  order: 'desc',
  order_by: 'created_at',
};
```

#### getParticipants API
```javascript
getParticipants(conversationId).then((participants, total) => {
  console.log(participants);
}).catch((e) => {
  console.log(e);
});
```

```javascript
getParticipants(conversationId, options).then((participants, total) => {
  console.log(participants);
}).catch((e) => {
  console.log(e);
});
```
