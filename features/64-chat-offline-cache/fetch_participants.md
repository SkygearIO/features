# Feature Overview

## Objective
Allow fetching participants' objects offline given an array of IDs.

## Description

Currently, user records are fetched from publicDB everytime when conversation is fetched, which makes messages fetched from offline cache cannot get the correct sender and avatar immediately. Also, related logic only exists in chat UI Kit, but not in chat SDK.

Therefore, we need a seperate API in chat SDK which

1. Accepts an array of participant IDs,
2. Retrieve a list of user records from publicDB and store in the cache and
3. Call callback if records exist in the cache.
4. Define a participant class which is a composite class of user record

# Change Required

## Server

No change required.

## Plugin

No change required.

## Chat SDK

Add fetchParticipants API in each platform chat SDK. The API takes an array of participants IDs and callback as parameters. Platform SDK should call callback twice, once when the cache is fetched and another once when the result is fetched from publicDB.

### Android

#### Renaming `ChatUser` to `Participant`

```java
public Participant(Record record) {

}

//...

public static Participant fromRecord(Record record) {
    //...
} 
```

#### Callback
```java
public interface GetParticipantsCallback extends GetCallback<Map<String, Participant>> {
    /**
     * Get cached result.
     *
     * @param participantsMap cached  participants
     */
    void onGetCachedResult(@NonNull Map<String, Participant> participantsMap);
}
```

#### getParticipants API

```java
public void getParticipants(@NonNull List<String> participantIds, GetParticipantsCallback callback) {
    //Implementation
}
```

### iOS

#### Create `SKYChatParticipant`
```objectivec
@interface SKYChatParticipant : SKYChatRecord
+ (instancetype)participantWithRecord:(SKYRecord *_Nullable)record;
@end
```

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
getParticipants(participantIds).then((participantsMap, cached) => {
  console.log(participants);
}).catch((e) => {
  console.log(e);
});
```
