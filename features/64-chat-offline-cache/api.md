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

After client app receives result from both callback, client app need to resolve a single result for display. Skygear Chat Container would provide some utility functions to help client app resolve two callback result.

### Expected UI Display / Common Use Case

Client App is expected to keep a single list of messages for display in table. And they are required to keep track to the newest and oldest fetched messages to determine when to fetch result from server.

Client App should replace old message with new message if the same message id is found.

Deleted messages are also returned in fetch API, with empty content and marked as deleted. This is to keep the whole message list complete. Client App is expected to skip these message in UI display.

We may provide a high level API **ManagedMessageList** to handle this for the developer.

# Sample Code for Message List, with ManagedMessageList

*All below UI update, I use `this.tableView.reloadTable()`. It is up to client app to decide how to update the UI*

#### Enter conversation

```
this.stickToBottom = true | false
this.messageList = new ManagedMessageList(container: skygear.defaultContainer(),
                                          conversation: this.conversation,
                                          delegate: this)

this.messageList.fetchLatestMessages()
this.messageList.startSubscribing()

// implement ManagedMessageListDelegate
func managedMessageListDidChange(messageDeltas: [MessageDelta]) {
  this.tableView.reloadTable()
  if (this.stickToBottom) {
    this.tableView.scrollToBottom()
  }
}
```

#### Render table

```
func numberOfCells() -> Int {
  return this.messageList.messageCount()
}

func cellForRow(index: Int) -> Cell {
  let message = this.messageList.messageAt(index)

  let cell = /* render cell with message */

  return cell
}
```

#### Edit actions

```
// the message would added to the internal list
// and update upon server response
//
// user only needs to handle messageListDidChange
this.messageList.createMessage(/* message content params */)

this.messageList.updateMessage(/* message content params */)

this.messageList.deleteMessage(message)
```

#### Leave conversation

```
this.messageList.stopSubscribing()
```

# Sample Code for Conversation List

### In conversation list

#### Start subscribing conversation changes

When
- enter conversation list

```
skygearChat.subscribeConversations(completion: func (conversationDeltas) {
  this.conversations = applyDelta(conversationDeltas, toList: this.conversations)
  this.tableView.reloadTable()
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

# Changes Required

### Server

#### Schema Change

Add a `previous_message` column to `message` table, to determine if two given messages are subsequent messages.

Deleted messages are also returned in fetch API, with empty content and marked as deleted. This is to keep the whole message list complete.

#### API Change

fetchMessages API should also return the ID of one newer message. So the client can tell if the API call has fetched the latest message already. Togther with `previous_message`, the client can also determine if it needs to fetch older message.

### SDK

- Make use of `syncingToServer`, `alreadySyncToServer` and `fail` (found in iOS but not in JS and Android) to cache and restore unsent message.

- Add `sendDate` to `message` record for sorting.

- Add cached callback to create message API.

The cachedCallback is expected to call immediately after adding to cache store.

```
func createMessage(/* content params */, cachedCallback?)

// Promise
skygearChat.createMessage(/* ... */, (message) => {
    // insert the new message in UI
  })
  .then((message) => {
    // update the message
  });

// Non-promise
skygearChat.createMessage(/* ... */, func (message) => {
  // check `syncingToServer`, `alreadySyncToServer` and `fail` of the message
  // to insert or update message in UI
})
```

- Add cached callback to fetch messages and fetch conversations API.

```
func fetchConversations(cachedCallback?)
func fetchMessages(conversation, beforeMessage, limit, order, cachedCallback?)
func fetchMessages(conversation, afterMessage, limit, order, cachedCallback?)
```

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
  .getMessages(conversation, beforeMessage, limit, order, successCallback)
  .then(successCallback, errorCallback);

// no-cache version
skygearChat
  .getMessages(conversation, beforeMessage, limit, order)
  .then(successCallback, errorCallback);
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

- Add a managed message list for user to use directly

```
class ManagedMessageList {

  constructor(container: SkygearContainer,
              conversation: Conversation,
              delegate: ManagedMessageListDelegate)

  - fetchLimit: Int = 100
  - useCache: Boolean = true
  - syncOnReconnect: Boolean = true

  func startSubscribing() // expected to call when enter view

  func stopSubscribing() // expected to call when leave view

  func messageCount() -> Int

  func messageAt(position: Int) -> Message

  func fetchLatestMessages() -> Void

  // message edit api
  func createMessage(body: ...) -> Void
  func editMessage(body: ...) -> Void
  func deleteMessage(message: Message) -> Void
  func markDeliveredMessages(messages: [Message])

  func fetchReceiptsWithMessage(message: Message)

  protected func handleFetchedMessages(messages: [Message]) -> Void
  protected func handleCachedMessages(messages: [Message]) -> Void

  // handle pubsub change
  protected func handleMessageChanges(messageDeltas: [MessageDelta]) -> Void

  // for UI display
  - protected messages: [Message]

  // to determine when to fetch messages, may need to consider gap between messages
  // consider a client app may stay on previous message position
  // and have a skip to latest button
  // while the current position and the latest message has a gap larger than fetch limit
  //
  // if useCache = false
  // messages == fetchedMessages
  - protected fetchedMessages: [Message]

  /**
   * scrollViewDelegateMethods
   *
   * the list will determine when to fetch messages by checking current first
   * and last visible message
   *
   * the implementation would call fetchMessages automatically
   */

}

interface ManagedMessageListDelegate {

  func managedMessageListDidChange(messageDeltas: [MessageDelta])

}
```

- Add cache store to skygear chat

There should be a common cache logic layer and cache implementation.

#### Cache implementation

Skygear may provide cache implementation for each platform.

- iOS: Core Data
- Android: SQLite
- JS: localforage
- iOS + Android: Realm

```
func set(conversation: Conversation, forID: String) -> Void
func set(conversation: Conversation, message: Message, forID: String) -> Void

// if not implementated, the common cache logic needs to get all and filter the messages
func fetchMessage(conversation: Conversation, before/afterMessageID: String, limit: Int, order: String) -> [Message]
```

#### Common cache logic

The cache logic needs to implement the interface of the API that support cacheCallback or update the cache.

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
func fetchMessage(conversation: Conversation, before/afterMessage: Message, limit: Int, order: String) -> [Message]
func markDeliveredMessages(messages: [Message])
func fetchReceiptsWithMessage(message: Message)
```
