*Was Trying to find an abstraction level between UI and SDK chat API, but cannot find a good one, so just leave the idea in this doc*

# Overview

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

# Changes in SDK

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
