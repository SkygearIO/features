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

The cachedCallback should be optional, thus compatible to the old API interace.

After client app receives result from both callback, client app need to resolve a single result for display. Skygear Chat Container would provide some utility functions to help client app resolve two callback result.

### Resolve result

There are two scenarios, and solutions would be provided by SDK. If client app requires custom resolve logic, they need to implement themselves.

#### 1

```
---
 ^
 | older cached result
 | ---
 v  ^
--- |
    | newly fetched result
    v
   ---
```

Solution:

- Newly fetched result is appended to the older cached result
- For overlapped records, the newer one is taken

#### 2

```
---
 ^
 | older cached result
 v
---
(a gap bewtween two sets of result)
---
 ^
 | newly fetched result
 v
---
```

Solution:

- Newly fetched result is appended to the older cached result

**How to fill the gap?**

The utility functions we provide should be able to tell developers where the boundaries of the message list are.

```
let boundaries = skygearChat.findBoundaries(messagelist)

// if no gap in the message list
// boundaries == [[messageA, messageZ]]
//
// app should load messages newer than messageA and older than messageZ

// else
// boundaries == [[messageA, messageD], [messageG, messageZ]]
//
// app should load messages newer than messageA or messageG, and older than messageD or messageZ
```

This could be quite complicated, so we may provide scroll view delegate or handler implementation to handle this logic for the developer.

# Changes Required

### Server

- Add a per conversation sequence to `message` table, to determine distance between two given messages.

### SDK

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
  .fetchConversations(successCallback)
  .then(successCallback, errorCallback);

// no-cache version
skygearChat
  .fetchConversation()
  .then(successCallback, errorCallback);
```

```js
let currentMessages = [];

const successCallback = (messages, cached = false) => {
  currentMessages = skygearChat.merge(currentMessages, messages);
  // display currentMessages
};

skygearChat
  .fetchMessages(conversation, beforeMessage, limit, order, successCallback)
  .then(successCallback, errorCallback);

// no-cache version
skygearChat
  .fetchMessages(conversation, beforeMessage, limit, order)
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

- Add utility functions for handling result returned by chat container

```
func merge(conversationDeltas: [ConversationDelta], toList: [Conversation]) -> [Conversation]
func merge(messages: [Message], toList: [Message]) -> [Message]
func merge(messageDeltas: [MessageDelta], toList: [Message]) -> [Message]

func findBoundaries(ofMessageList: [Message]) -> [(Int, Int)]
```

- Add a managed message list for user to use directly

The ManagedMessageList is a default implementation provided by Skygear, its underlying implementation is just using the above new API and utility functions.

```
class ManagedMessageList {

  constructor(conversation: Conversation,
              delegate: ManagedMessageListDelegate)

  - fetchLimit: Int = 100
  - useCache: Boolean = true
  - subscribeNewMessages: Boolean = true
  - syncOnReconnect: Boolean = true

  func online() // expected to call when enter view and pubsub connected

  func offline() // expected to call when leave view and pubsub disconnected

  func messageCount() -> Int

  func messageAt(position: Int) -> Message

  /**
   * scrollViewDelegateMethods
   *
   * the list will determine when to fetch messages by checking current first
   * and last visible cell
   */

}

interface ManagedMessageListDelegate {

  func managedMessageListDidChange(messageDeltas: [MessageDelta])

}
```

# Example

*All below UI update, I use `this.tableView.reloadTable()`. It is up to client app to decide how to update the UI*

### In conversation list

#### Start subscribing conversation changes

When
- enter conversation list
- come offline and online again when in conversation list

```
skygearChat.subscribeConversations(completion: func (conversationDeltas) {
  this.conversations = skygearChat.applyDelta(conversationDeltas, toList: this.conversations)
  this.tableView.reloadTable()
})
```

#### Fetch and update table

When
- enter conversation list
- come offline and online again when in conversation list

```
skygearChat.fetchConversations(completion: func (conversations, cached = false) {
  this.conversations = conversations
  this.tableView.reloadTable()
})
```

### In conversation OR app come back online inside conversation

#### Start subscribing message changes

When
- enter conversation
- come offline and online again when in conversation

```
let conversation = this.conversation

skygearChat.subscribeMessages(conversation: conversation,
                              handler: func (messageDeltas) {
                                this.messages = skygearChat.applyDelta(messageDelta, toList: this.messages)
                                this.tableView.reloadTable()
                              })
```

#### Fetch latest messages and update table

When
- enter conversation and try to skip to latest message

```
let conversation = this.conversation
let beforeMessage = nil // fetch latest message
let limit = 100
let order = .descending // latest come first

skygearChat.fetchMessages(conversation: conversation,
                          beforeMessage: beforeMessage,
                          limit: limit,
                          order: order,
                          completion: func (messages, cached = false) {
                            this.messages = skygearChat.merge(messages, toList: this.messages)
                            this.tableView.reloadTable()
                          })
```

#### Fetch newer messages and update table

When
- enter conversation and try to stay at last message position and load newer message from that point
- come offline and online again when in conversation
- load newer messages when scroll to bottom

```
let conversation = this.conversation
let afterMessage = this.latestMessage
let limit = 100
let order = .descending // latest come first

skygearChat.fetchMessages(conversation: conversation,
                          afterMessage: afterMessage,
                          limit: limit,
                          order: order,
                          completion: func (messages, cached = false) {
                            this.latestMessage = messages[0]
                            this.messages = skygearChat.merge(messages, toList: this.messages)
                            this.tableView.reloadTable()
                          })
```

#### Fetch older messages and update table

- load older messages when scroll to top

```
let conversation = this.conversation
let beforeMessage = this.firstMessage
let limit = 100
let order = .descending // latest come first

skygearChat.fetchMessages(conversation: conversation,
                          beforeMessage: firstMessage,
                          limit: limit,
                          order: order,
                          completion: func (messages, cached = false) {
                            this.latestMessage = messages[0]
                            this.messages = skygearChat.merge(messages, toList: this.messages)
                            this.tableView.reloadTable()
                          })
```

### With ManagedMessageList

#### Enter conversation

```
this.messageList = new ManagedMessageList(conversation: this.conversation,
                                          delegate: this)

if (skygearChat.pubsub.isConnected) {
  this.messageList.online()
}

skygearChat.pubsub.onConnect(func () {
  this.messageList.online()
})

skygearChat.pubsub.onDisconnect(func () {
  this.messageList.offline()
})


// implement ManagedMessageListDelegate
func managedMessageListDidChange(messageDeltas: [MessageDelta]) {
  this.tableView.reloadTable()
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

#### Leave conversation

```
this.messageList.offline()
```
