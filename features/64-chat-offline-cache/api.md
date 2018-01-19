# Objective

- Provide cached result to Chat Container API calls
- Compatible to old API interface

# Overview

Container contains a local store for caching resources. The local store caches resources by resource id.

### Store Update

When SDK recieves result from server, for each record, the newly fetched record would always replace the old one with the same record id if there is one.

### API

For fetch API of each resource, there would be a new callback that should return result from cache immediately.

The interface for each language may be different.

```
getResource(params, callback, cachedCallback?)
```

Resource includes conversation and message.

The cachedCallback should be optional, thus compatible to the old API interace.

### Expected UI Display / Common Use Case

Client App is expected to keep a single list of messages for display in table. And user scroll beyond the list, they would need to call API to fetch messages.

Client App should replace old message with new message if the same message id is found.

Deleted messages are also returned in fetch API, with empty content and marked as deleted. This is to keep the whole message list complete. Client App may or may not skip these messages in UI display.

The conversation view controller in UI Kit would use the cached version of chat API. Thus, developer should be able to use this new feature easily.

The controller should have the following behaviour:

- keep a cursor pointing to a message or the latest message, set a window size of how many messages should be kept in memory
- when moving the cursor around (scrolling around or jumping around), it should erase messages outside the window and fetch messages newly entered the window
- fetch the messages to fill the window when enter view, if the cursor is not set, it would stick to the latest message
- subscribe to new messages, but only append to bottom if the window is on the latest message side
- display, allow resend, cancel pending sent message, i.e. send by user but not responded by server yet
- sync latest messages on reconnect if the window is on the latest message side

# Sample Code for Conversation List

### In conversation list

#### Start subscribing conversation changes

When
- enter conversation list

```
skygearChat.subscribeConversations(completion: func (conversationDeltas) {
  skygearChat.fetchConversations(completion: func(conversations, cached = false) {
    if (cached) {
      return
    }

    this.conversations = conversations
    this.tableView.reloadTable()
  })
})
```

#### Fetch and update table

When
- enter conversation list

```
skygearChat.fetchConversations(completion: func (conversations, cached = false) {
  this.conversations = conversations
  this.tableView.reloadTable()
})
```

### In message list

#### Subscribe messages

When
- enter message list

```
skygearChat.subscribeMessages(conversation, func (messageDeltas) {
  // Merge delta to current list

  // Apply the delta to UI one by one
  // OR
  // Reload the UI once
})
```

When pubsub disconnect and reconnect, messages in between are not fetched automatically. Client app may fetch latest messages when pubsub reconnected.

```
let latestFetchedMessage: Message;

skygear.pubsub.onDisconnect(func () {
  this.latestFetchedMessage = this.messages.first // OR this.messages.last
})

skygear.pubsub.onConnect(func () {
  let afterMessage = this.latestFetchedMessage
  skygearChat.fetchMessages(conversation, afterMessage, limit, oreder, /* Update UI */)
})
```

#### Fetch messages

When
- enter message list
- load messages when scroll to top of the list

```
skygearChat.fetchMessages(conversation, limit, before_time, order, func (messageDeltas, cached = false) {
  // Merge delta to current list

  // Apply the delta to UI one by one
  // OR
  // Reload the UI once
})
```

### Create messages

```
skygearChat.createMessage(/* ... */)
.then((message) => {
  // The message is created on the server
  // Update the UI to display the new message
}, (err) => {
  // An error occurred while creating the message
});
```

### Handling failed message operations

```
// Promise
let addOperationType = 'add';
let conversationId = '7d057fe2-f45a-4583-8a96-65d68a03d3ab';
skygearChat.fetchFailedMessageOperations(addOperationType, conversationId,
(operations) => {
  console.log(operation.type);    // `add`
  console.log(operation.message); // message object
  console.log(operation.error);   // failure reason
  
  // The user should display the failed message in the UI, but they can
  // also retry the operation.
  skygearChat.retryMessageOperation(operation, (operation, message) => {
    // This is the cached callback and this is immediately called
    // Supplying a callback is optional
  })
  .then((operation, message) => {
    // indicates the operation has succeeded
  });
});
```

The developer can also call `cancelMessageOperation(operation)` to remove
the failed operation from the failed operation cache store.

# Changes Required

Please also see [fetch_message_after_message.md](./fetch_message_after_message.md)

### Server

#### Schema Change

Add a `previous_message` column to `message` table, to determine if two given messages are subsequent messages.

Deleted messages are also returned in fetch API, with empty content and marked as deleted. This is to keep the whole message list complete.

#### API

Using the fetchMessages API, it is possible to fetch messages by using
`before_time` or `before_message`. Using `before_message` has the benefit
of duplicated message returning if messages are sent at the same moment in
time. Using `before_time` allows the developer to fetch messages in a certain
time range.

Query by time:

```
fetchMessages(conversation_id, limit, before_time?, order?)
```

Query by message:

```
fetchMessages(conversation_id, limit, before_message?, order?)
```

### SDK

#### Adding, deleting and editing messages

- Add `sendDate` to `message` record for sorting.

The SDK should have the following functions to add, delete and edit messages:

```
func createMessage(/* ... */)
func editMessage(/* ... */)
func deleteMessage(/* ... */)
```

On JS, these functions should return a Promise. On other platforms, a
callback object / block is specified as the last parameter.

When performing these operations, a Message Operation Object is created
and persisted in cache store. Newly added Message Operation Object
should have the `pending` status. Successfully completed Message Operation
Object should be removed from cache store. Failed Message Operation Object
should have the `failed` status and include a failure reason.

See below for message failure handling.

#### Fetching messages

- Add cached callback to fetch messages and fetch conversations API.

```
func fetchConversations(cachedCallback?)
func fetchMessages(conversation, limit, beforeDate, order, cachedCallback?)
```

#### Handling failed messages

Pending and failed messages will be available from this function:

```
func fetchFailedMessageOperations(operationType, conversationId);
```

On JS, this function should return a Promise. On other platforms, a
callback object / block is specified as the last parameter. The function
should resolve/return a list of pending and failed operations.

Operations can be removed from the cache store with this function:

```
func cancelMessageOperations(operationObject);
```

The following function will allow the developer to retry pending/failed
operation:

```
func retryMessageOperation(operationObject);
```

On JS, this function should return a Promise. On other platforms, a
callback object / block is specified as the last parameter. The function
should resolve/return the operation and the message object.

When retrying, the operation is removed from the cache store and
the message is added/edit/deleted through the provided APIs.

#### JS

```js
const successCallback = (conversations, cached = false) => {
  // display conversations
};

skygearChat
  .getConversations(successCallback)
  .then(successCallback, errorCallback);

// no-cache version
skygearChat
  .getConversations()
  .then(successCallback, errorCallback);
```

```js
let currentMessages = [];

const successCallback = (messages, cached = false) => {
  currentMessages = skygearChat.merge(currentMessages, messages);
  // display currentMessages
};

skygearChat
  .getMessages(conversation, limit, beforeDate, order, successCallback)
  .then(successCallback, errorCallback);

// no-cache version
skygearChat
  .getMessages(conversation, beforeMessage, limit, order)
  .then(successCallback, errorCallback);
```

```
skygearChat.retryMessageOperation(operationObject)
.then((operation, message) => {
  // The operation completed successfully
  // `message` contains the message data after the operation has completed.
});
```

#### Non-JS

```
skygearChat.fetchConversations(func (conversations, cached = false) {
  // display conversations
})
```

```
let currentMessages = [];

skygearChat.fetchMessages(func (messages, cached = false) {
  currentMessages = skygearChat.merge(currentMessages, messages);
  // display currentMessages
})
```

```
skygearChat.retryMessageOperation(operationObject, func(operation, message) => {
  // The operation completed successfully
  // `message` contains the message data after the operation has completed.
});
```

- Add cache store to skygear chat

There should be a common cache logic layer and cache implementation.

#### Cache implementation

Skygear may provide cache implementation for each platform, and provide functions / classes to integrate with the app existing persistant store.

- iOS: Core Data
- Android: SQLite
- JS: localforage
- iOS + Android: Realm

```
func set(conversation: Conversation, forID: String) -> Void
func set(conversation: Conversation, message: Message, forID: String) -> Void
func purgeAll() -> Void

// if not implementated, the common cache logic needs to get all and filter the messages
func fetchMessage(conversation: Conversation, before_message: String, limit: Int, order: String) -> [Message]
```

#### Common cache logic

The cache logic needs to implement the interface of the API that support cacheCallback or update the cache.

For security reason, the cache should live with a user session only. When a user logout, the cache should be erased.

interface for converation list

```
func saveConversation(conversation: Conversation) -> Void
func deleteConversation(conversation: Conversation) -> Void
func fetchConversations() -> [Conversation]
func leaveConversation(conversation: Conversation) -> Void
```

interface for message list

```
func createMessage(conversation: Conversation, body: ...) -> Void
func editMessage(conversation: Conversation, body: ...) -> Void
func deleteMessage(conversation: Conversation, message: Message) -> Void
func fetchMessage(conversation: Conversation, before: Message, limit: Int, order: String) -> [Message]
func markDeliveredMessages(messages: [Message])
func fetchReceiptsWithMessage(message: Message)
```
