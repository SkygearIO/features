# Feature Overview

## Objective
Allow fetching participants' User records offline given an array of IDs.

## Description

Currently, user records are fetched from publicDB everytime when conversation is fetched, which makes messages fetched from offline cache cannot get the correct sender and avatar immediately. Also, related logic only exists in chat UI Kit, but not in chat SDK.

Therefore, we need a seperate API in chat SDK which

1. Accepts an array of user IDs,
2. Retrieve a list of user records from publicDB and store in the cache and
3. Call callback if records exist in the cache.

# Change Required

## Server

No change required.

## Plugin

No change required.

## Chat SDK

Add fetchParticipants API in each platform chat SDK. The API takes an array of user IDs and callback as parameters. Platform SDK should call callback twice, once when the cache is fetched and another once when the result is fetched from publicDB.

### Android

#### Callback
```java
public interface GetChatUsersCallback extends GetCallback<Map<String, ChatUser>> {
    /**
     * Get cached result.
     *
     * @param users cached users
     */
    void onGetCachedResult(@NonNull Map<String, ChatUser> chatUsersMap);
}
```

#### getChatUsers API

```java
public void getChatUsers(@NonNull List<String> userIds, GetChatUsersCallback callback) {
    //Implementation
}
```

### iOS

#### Callback
```objectivec
typedef void (^ SKYChatFetchParticpantsCompletion)
(
    NSDictionary* participantsMap,
    BOOL isCached,
    NSError *_Nullable error) {
}
```

#### fetchParticipants API
```objectivec
- (void)fetchParticipants:(NSArray<NSString*> *)participantIDs
               completion:(SKYChatFetchParticpantsCompletion _Nullable)completion
    /* clang-format off */ NS_SWIFT_NAME(fetchParticipants(participantIDs:completion:));
```


### Javascript

#### getParticipants API

```javascript
getParticipants(participantIds).then((participantsMap) => {
  console.log(participants);
}).catch((e) => {
  console.log(e);
});
```
