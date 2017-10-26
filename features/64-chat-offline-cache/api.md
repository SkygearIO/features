# Objective

Provide a local cache for the Skygear chat, so when developer integrate chat
functions to their app,

- old data can be displayed immediately without blocking user interface, and
- remote and local data are merged automatically.

Bonus:

- easy to migrate from older version, and
- easy to implement different kind of cache, memory cache or disk cache, either
implemented by Skygear or the developers themselves, and
- able to accept different kind of caching policy for different use case.

# Architecture Overview

## Current

```
    Skygear Server / Chat Plugin
               ^ v
             2 | | 3
               ^ v
       Skygear Chat Container
               ^ v
             1 | | 4
               ^ v
           Client App
```

### Data Fetching

1. Client App decides to fetch new data from remote server, so it calls API of Skygear Chat Container
2. Skygear Chat Container calls API of Skygear Chat plugin to fetch data
3. Skygear Chat Plugin gets results from DB or Skygear Server, and then it returns results
to Skygear Chat Container
4. Skygear Chat Container returns result to Client App

### Data Update (including save and delete)

1. Client App decides to update data to remote server, so it calls API of Skygear Chat Container
2. Skygear Chat Container calls API of Skygear Chat Plugin to update data
3. Skygear Chat Plugin update data to DB or Skygear Server, and it returns the result to Skygear Chat Container
4. Skygear Chat Container returns the result to Client App

### Data Subscription

1. Client App decides to listen for data changes from remote server, so it calls API of Skygear Chat Container
2. Skygear Chat Container calls API of Skygear Chat Plugin to subscribe data
3. When data changes remotely, Skygear Chat Plugin publish the event to Skygear Chat Container
4. Skygear Chat Container notifies Client App for the update

## Proxy Container with Local Store

```
    Skygear Server / Chat Plugin
               ^ v
             6 | | 7
               ^ v
      Skygear Chat Container
               ^ v
             5 | | 8
               ^ v               2,9
                                >--->
   Skygear Chat Proxy Container        Skygear Chat Local Store
                                <---<
               ^ v                3              ^ v
             1 | | 4,10                          | |
               ^ v                               ^ v
           Client App            Local Store Implementation (e.g. Memory / DB)
```

### Data Fetching

1. Client App decides to fetch new data from remote server, so it calls API of Skygear Chat Proxy Container
2. The Proxy Container gets result from Local Store
3. Local Store returns results to Proxy Container
4. Proxy Container returns results to Client App
5. Proxy Container calls API of Skygear Chat Container to fetch data
6. Skygear Chat Container calls API of Skygear Chat plugin to fetch data
7. Skygear Chat Plugin returns result to Skygear Chat Container
8. Skygear Chat Container returns result to Proxy Container
9. Proxy Container merge the remote results to Local Store
10. Proxy Container notifies Client App for the update through **subscription callback**

### Data Update (including save and delete)

1. Client decides to update data to remote server, so it calls API of Skygear Chat Proxy Container
2. Proxy Container merge the new data to Local Store
4. Proxy Container returns an immediate result to Client App
5. Proxy Container calls API of Skygear Chat Container to update data
6. Skygear Container calls API of Skygear Chat Plugin to update data
7. Skygear Chat Plugin update data to DB or Skygear Server, and it returns the result to Skygear Chat Container
8. Skygear Chat Container returns the result to Proxy container
9. Proxy Container merge remote result to Local Store
10. Proxy Container notifies Client App for the update through **subscription callback**

### Data Subscription

1. Client App decides to listen for data changes from remote server, so it calls API of Proxy Container
5. Proxy Container calls API of Skygear Chat Container to subscribe data
6. Skygear Chat Container calls API of Skygear Chat Plugin to subscribe data
7. When data changes remotely, Skygear Chat Plugin publish the event to Skygear Chat Container
8. Skygear Chat Container notifies Proxy Container for the update
9. Proxy Container merge the update to Local Store
10. Skygear Chat Container notifies Client App for the update

# API Interface

The new Skygear Chat Proxy Container shares the same API interface as the current Skygear Chat Container, while providing new API for accessing locally stored properties.

The following code is copied from obj-c SKYKitChat SKYChatExtension.h, with some comments removed.

```obj-c
@property (assign, nonatomic) bool automaticallyMarkMessagesAsDelivered;
@property (nonatomic, copy, nullable) void (^userChannelMessageHandler)
    (NSDictionary<NSString *, id> *_Nonnull);

///------------------------------------------
/// @name Creating and fetching conversations
///------------------------------------------

- (void)createConversationWithParticipantIDs:(NSArray<NSString *> *_Nonnull)participantIDs
                                       title:(NSString *_Nullable)title
                                    metadata:(NSDictionary<NSString *, id> *_Nullable)metadata
                                  completion:(SKYChatConversationCompletion _Nullable)completion

- (void)createConversationWithParticipantIDs:(NSArray<NSString *> *_Nonnull)participantIDs
                                       title:(NSString *_Nullable)title
                                    metadata:(NSDictionary<NSString *, id> *_Nullable)metadata
                                    adminIDs:(NSArray<NSString *> *_Nullable)adminIDs
                      distinctByParticipants:(BOOL)distinctByParticipants
                                  completion:(SKYChatConversationCompletion _Nullable)completion

- (void)createDirectConversationWithUserID:(NSString *_Nonnull)userID
                                     title:(NSString *_Nullable)title
                                  metadata:(NSDictionary<NSString *, id> *_Nullable)metadata
                                completion:(SKYChatConversationCompletion _Nullable)completion

- (void)saveConversation:(SKYConversation *_Nonnull)conversation
              completion:(SKYChatConversationCompletion _Nullable)completion

- (void)deleteConversation:(SKYConversation *_Nonnull)conversation
                completion:(SKYChatDeleteConversationCompletion _Nullable)completion

- (void)fetchConversationsWithCompletion:
    (SKYChatFetchConversationListCompletion _Nullable)completion

- (void)fetchConversationsWithFetchLastMessage:(BOOL)fetchLastMessage
                                    completion:
                                        (SKYChatFetchConversationListCompletion _Nullable)completion

- (void)fetchConversationWithConversationID:(NSString *_Nonnull)conversationID
                           fetchLastMessage:(BOOL)fetchLastMessage
                                 completion:(SKYChatConversationCompletion _Nullable)completion

///---------------------------------------
/// @name Adding and removing participants
///---------------------------------------

- (void)addParticipantsWithUserIDs:(NSArray<NSString *> *_Nonnull)userIDs
                    toConversation:(SKYConversation *_Nonnull)conversation
                        completion:(SKYChatConversationCompletion _Nullable)completion

- (void)removeParticipantsWithUserIDs:(NSArray<NSString *> *_Nonnull)userIDs
                     fromConversation:(SKYConversation *_Nonnull)conversation
                           completion:(SKYChatConversationCompletion _Nullable)completion

- (void)addAdminsWithUserIDs:(NSArray<NSString *> *_Nonnull)userIDs
              toConversation:(SKYConversation *_Nonnull)conversation
                  completion:(SKYChatConversationCompletion _Nullable)completion

- (void)removeAdminsWithUserIDs:(NSArray<NSString *> *_Nonnull)userIDs
               fromConversation:(SKYConversation *_Nonnull)conversation
                     completion:(SKYChatConversationCompletion _Nullable)completion

- (void)leaveConversation:(SKYConversation *_Nonnull)conversation
               completion:(void (^_Nullable)(NSError *_Nullable error))completion;

- (void)leaveConversationWithConversationID:(NSString *_Nonnull)conversationID
                                 completion:(void (^_Nullable)(NSError *_Nullable error))completion

///------------------------
/// @name Creating messages
///------------------------

- (void)createMessageWithConversation:(SKYConversation *_Nonnull)conversation
                                 body:(NSString *_Nullable)body
                             metadata:(NSDictionary<NSString *, id> *_Nullable)metadata
                           completion:(SKYChatMessageCompletion _Nullable)completion

- (void)createMessageWithConversation:(SKYConversation *_Nonnull)conversation
                                 body:(NSString *_Nullable)body
                           attachment:(SKYAsset *_Nullable)attachment
                             metadata:(NSDictionary<NSString *, id> *_Nullable)metadata
                           completion:(SKYChatMessageCompletion _Nullable)completion

- (void)addMessage:(SKYMessage *_Nonnull)message
    toConversation:(SKYConversation *_Nonnull)conversation
        completion:(SKYChatMessageCompletion _Nullable)completion

- (void)fetchMessagesWithConversation:(SKYConversation *_Nonnull)conversation
                                limit:(NSInteger)limit
                           beforeTime:(NSDate *_Nullable)beforeTime
                                order:(NSString *_Nullable)order
                           completion:(SKYChatFetchMessagesListCompletion _Nullable)completion

- (void)fetchMessagesWithConversationID:(NSString *_Nonnull)conversationId
                                  limit:(NSInteger)limit
                             beforeTime:(NSDate *_Nullable)beforeTime
                                  order:(NSString *_Nullable)order
                             completion:(SKYChatFetchMessagesListCompletion _Nullable)completion

///----------------------------------------------
/// @name Send message delivery and read receipts
///----------------------------------------------

- (void)markReadMessages:(NSArray<SKYMessage *> *_Nonnull)messages
              completion:(void (^_Nullable)(NSError *_Nullable error))completion

- (void)markReadMessagesWithID:(NSArray<NSString *> *_Nonnull)messageIDs
                    completion:(void (^_Nullable)(NSError *_Nullable error))completion

- (void)markDeliveredMessages:(NSArray<SKYMessage *> *_Nonnull)messages
                   completion:(void (^_Nullable)(NSError *_Nullable error))completion

- (void)markDeliveredMessagesWithID:(NSArray<NSString *> *_Nonnull)messageIDs
                         completion:(void (^_Nullable)(NSError *_Nullable error))completion

- (void)fetchReceiptsWithMessage:(SKYMessage *_Nonnull)message
                      completion:(void (^_Nullable)(NSArray<SKYChatReceipt *> *_Nullable receipts,
                                                    NSError *_Nullable error))completion

///-----------------------------------------
/// @name Message Edit & Delete Function
///-----------------------------------------

- (void)deleteMessage:(SKYMessage *_Nonnull)message
       inConversation:(SKYConversation *_Nonnull)conversation
           completion:(SKYChatConversationCompletion _Nullable)completion

- (void)editMessage:(SKYMessage *_Nonnull)message
           withBody:(NSString *_Nonnull)body
         completion:(SKYChatMessageCompletion _Nullable)completion

///--------------------------------------------------
/// @name Modifying read position with message marker
///--------------------------------------------------

- (void)markLastReadMessage:(SKYMessage *_Nonnull)message
             inConversation:(SKYConversation *_Nonnull)conversation
                 completion:(SKYChatConversationCompletion _Nullable)completion

- (void)fetchUnreadCountWithConversation:(SKYConversation *_Nonnull)conversation
                              completion:(SKYChatUnreadCountCompletion _Nullable)completion

- (void)fetchTotalUnreadCount:(SKYChatUnreadCountCompletion _Nullable)completion

///-----------------------
/// @name Typing indicator
///-----------------------

- (void)sendTypingIndicator:(SKYChatTypingEvent)typingEvent
             inConversation:(SKYConversation *_Nonnull)conversation

- (void)sendTypingIndicator:(SKYChatTypingEvent)typingEvent
             inConversation:(SKYConversation *_Nonnull)conversation
                       date:(NSDate *_Nonnull)date
                 completion:(void (^_Nullable)(NSError *_Nullable error))completion

///-----------------------------------------
/// @name Subscribing to events using pubsub
///-----------------------------------------

- (void)fetchOrCreateUserChannelWithCompletion:(SKYChatChannelCompletion _Nullable)completion

- (void)deleteAllUserChannelsWithCompletion:(void (^_Nullable)(NSError *_Nullable error))completion

- (void)subscribeToUserChannelWithCompletion:(void (^_Nullable)(NSError *_Nullable error))completion

- (void)unsubscribeFromUserChannel;

- (id _Nonnull)
subscribeToTypingIndicatorInConversation:(SKYConversation *_Nonnull)conversation
                                 handler:(void (^_Nonnull)(
                                             SKYChatTypingIndicator *_Nonnull indicator))handler

- (id _Nonnull)subscribeToMessagesInConversation:(SKYConversation *_Nonnull)conversation
                                         handler:
                                             (void (^_Nonnull)(SKYChatRecordChangeEvent event,
                                                               SKYMessage *_Nonnull record))handler

- (id _Nonnull)subscribeToConversation:
    (void (^_Nonnull)(SKYChatRecordChangeEvent event,
                      SKYConversation *_Nonnull conversation))handler

- (void)unsubscribeToConversationWithObserver:(id _Nonnull)observer;

- (void)unsubscribeToMessagesWithObserver:(id _Nonnull)observer;

- (void)unsubscribeToTypingIndicatorWithObserver:(id _Nonnull)observer;
```

New API:

```
- merge(messages: [Message], withMessages: [Message]) -> [Message]
- merge(messages: [Message], withDelta: [MessageDelta]) -> [Message]

// - only get from store, but no fetch from server
// - synchronous
- getConversations() -> [Conversation]
- getMessages(conversation: Conversation, fromTime: DateTime, limit: Int) -> [Message]
```

# Sample Code For Common Use Case

#### Enter app

```
skygearChat.subscribeMessages(/* broadcast update */)
skygearChat.subscribeConversations(/* broadcast update */)
```

#### Enter conversation list

```
skygearChat.fetchConversations(/* reload table to display conversations */)
app.subscribeConversationUpdate(/* reload table to display conversations */)
```

#### Enter conversation / Load more messages

```
skygearChat.fetchMessages(conversation, fromTime, limit, /* reload table to display messages */)
app.subscribeMessageUpdate(conversation, /* merge and reload table OR apply the diff to the table directly*/)
```

#### Leave app

```
skygearChat.unsubscribeConversations()
skygearChat.unsubscribeMessages()
```

# New Design in Practice

## Remote and Local Data Update Interleaved

#### Scenario

- User A and User B join a conversation
- The network environment of User A is very bad
- User A goes offline
- User B send some messages to the conversation, but User A cannot receive it yet
- User A comes online, note that the device does NOT receive updated message yet
- User A send a new message to the group and get successful result from server
- User A receives the messages sent by User B then

#### Requirements

- Data is merged and client app is notified when update received
- Messages displayed is sorted by server received time

#### Solution

- App (User A) send the message
- Container addd the message to local store and mark the message as pending
- App receives message added callback
- The message is sent successfully, and response is received by Container
- Container updates the pending message as sent in local store
- App receives subscription callback
- Container receives subscription callback that User B has sent some messages to User A
- Container compares the send time of the messages and insert the messages to local store in the correct position
- App receives subscription callback

## Sync Outdated Data

#### Scenario

- There are data stored in local store, but 1 year ago
- There is 1 year of data in between locally stored data and remote data
- Some old data has been updated during this 1 year
- The local store size can only store about 3 months of message

#### Requirements

- Able to merge most recent remote data to local store
- Data actively accessed by the User should not be erased, so User does not see
some data disappear suddenly

#### Solution

- App start subscribing events from Container
- App get latest message (from local store)
- Container tells server its latest update time (of each conversation)
- Container gets all latest messages, maybe in multiple responses
- Container put those messages into local store, local store should would purge messages if store cannot hold more
- App receives subscription callback, including all messages even if local store may have purged
