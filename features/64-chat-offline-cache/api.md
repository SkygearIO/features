# Behaviour of other chat apps

## Message Read

All testing below are happened after I change my phone to airplane mode.

### Telegram (and WhatsApp, they work very similarly)

#### Conversation

I entered a public group which has new messages actively everyday, but I have not entered the group long time.

- Messages can show up immediately after I enter the group.
- When scrolling up the group and almost reach top of the group, new messages will suddenly appended on the top. I can continuously scroll up the list. This is the same as `load more` feature.
- After a few (actually a lot of) `load more`, the list comes to an end. A date bubble and `Loading` bubble is shown on the top of message list.

FYI, Telegram has a setting about storage usage. The app will keep media, for a customizable period of time, say 1 month, and after the media has not been accessed by that period of time, it will be deleted. It does NOT mention about message, but as I see, the date of the oldest message kept on my device matches the media keep time in my setting.

#### Conversation list

All items, including those that have not been opened more than a year, in conversation list can be loaded, though `load more` is also implemented in the list.

### Slack

`load more` does not work in channel message list, but pictures are kept. Number of reply in thread and participants can be shown but thread messages cannot be loaded.

I can search for all channels, including those I did not join. But entering those channel would not load any messages.

When I enter the list of direct messages (conversation list), I can still see all items. But only the newer one have messages kept, and load more also do not work.

### Facebook Messager

`load more` in both conversation list and conversation view simply do not work.

Some messages in newer conversation are kept, while only the latest one is kept for older conversation.

## Message Write

All the above app can send both message and media when offline.  The new message would be appended to the bottom of the message list.

Telegram and WhatsApp behave differently when new message come before the offline sent message.

Telegram: sorts messages by sent time.
WhatsApp: does not change the order of the message list once the messages are appended to the list.

All of them, except Slack, would automatically send the message when phone comes online again. Slack require manual retry.

## Overview

Items require caching:

1. First N OR All Conversation
1. First N messages in each conversation
    1. N can be defined by a constant or a period of time
1. Messages asset

When to cache what:

#### write

- cache new message before (or right at) it is sent by the user

#### read

- conversation list:
    - first N conversations when enter app OR
    - all conversations when enter app

- messages:
    - first N messages of a conversation
        - when enter app OR
        - when enter message list
    - next N messages when load more

*The following code is pseudo-code only.*

## Changes on behaviour in SDK

#### without cache

```
func fetchConversations(beforeTime: datetime, limit: integer, callback: func) -> [Conversation]
    let conversations, err = skygearChat.fetchConversations(beforeTime, limit)
    callback(conversations, err)
```
```
func fetchMessages(conversation: Conversation, beforeTime: datetime, limit: integer, callback: func) -> [Message]
    let messages, err = skygearChat.fetchMessages(conversation, beforeTime, limit)
    callback(conversation, messages, err)
```
```
func createMessage(conversation: Conversation, message: Message, callback: func)
    let sentMessage, err = skygearChat.createMessage(conversation, message)
    callback(sentMessage, err)
```

#### with cache

```
interface skygearChatCacheStoreDelegate
    func conversationsDidChangeCallback(deltas: [ConversationsDelta])
    func messagesDidChangeCallback(conversation: Conversation, deltas: [MessagesDelta])

func setupSkygearChatCache(callback: func):
    InitSkygearChatCaches()
    callback()
```
```
let cache = skygearChat.cache

func fetchConversations(beforeTime: datetime, limit: integer, callback: func) -> [Conversation]
    let newConversations, err = skygearChat.fetchConversations(beforeTime, limit)
    callback(conversations, err)

    if err == NULL
        let deltas = cache.saveConversations(conversations)
        skygearChat.cacheDelegate.conversationsDidChangeCallback(allConversations, deltas)
```
```
let cache = skygearChat.cache

func fetchMessages(conversation: Conversation, beforeTime: datetime, limit: integer, callback: func) -> [Message]
    let messages, err = skygearChat.fetchMessages(conversation, beforeTime, limit)
    callback(conversation, messages, err)

    if err == NULL
        let deltas = cache.saveMessages(conversation, messages)
        skygearChat.cacheDelegate.messagesDidChangeCallback(conversation, deltas)
```
```
let cache = skygearChat.cache

func createMessage(conversation: Conversation, message: Message, callback: func)
    let delta = cache.saveMessage(conversation, message)
    skygearChat.cacheDelegate.messagesDidChangeCallback(conversation, [delta])

    let sentMessage, err = skygearChat.createMessage(conversation, message)
    callback(sentMessage, err)

    let delta2 = cache.saveMessage(conversation, sentMessage) // sentMessage should have the new transfer state
    skygearChat.cacheDelegate.messagesDidChange(conversation, [delta2])
```
```
let cache = skygearChat.cache

// message update subscription have the same behaviour
func subscribeConversationUpdate(callback: func)
    skygearChat.onConversationUpdate(func(conversationDelta: conversationDelta)
        cache.applyConversationDelta(conversationDelta)
        skygearChat.delegate.onConversationUpdate(conversationDelta)
    )
```

## SDK API interface

### `MessageCache`

```
set(conversations: [Conversation]) -> boolean
getConversations() -> [Conversation]
purgeConversation(withID: string) -> boolean
purgeAllConversations() -> boolean

set(messages: [SkygearMessage], forConversationID: string) -> boolean
get(messagesForConversationID: string) -> [SkygearMessage]
purgeMessages(forConversationID: string) -> boolean
purgeAllConversationMessages() -> boolean

set(asset: Asset, forKey: string) -> boolean
get(assetForKey: string) -> Asset
purgeAsset(forKey: string) -> boolean
purgeAllAssets() -> boolean
```

(possible) implementation, each of them would provide individual set of configuration:
- `MemoryCache`
- `LocalStorageCache` / `LocalForageCache` (js)
- `RealmCache` (android/ios)
- `CoreDataCache` (ios)
- `SQLiteCache` (android)

Integration of other storage that required defining model will be discussed in later session.

### `SkygearMessage`

Each chat SDK should have a message class already. For easier caching implementation, the cache store would look for a specific field that stores skygear `Asset`.

Thus the layout of a SkygearMessage must be at least and look like:

```
- body -> string
- attachment -> asset

and other fields, like metadata, participants
```

## Changes to SDK

### Container

Skygear will provide a default message cache, which is a LRU memory cache.

```
let skygearChat = SkygearChatContainer.defaultContainer()
let messageCache = SkygearChatContainer.defaultMessageCache()

assert skygearChat.messageCache == messageCache
```

Developer may also set a custom cache:

```
let skygearChat = SkygearChatContainer.defaultContainer()

// very restricted amount of memory
let memoryCache = new LruMemoryCache(maxSize: 10)
skygearChat.messageCache = memoryCache

let localStorageCache = new LocalStorage(namespace: 'awesome-app')
skygearChat.messageCache = localStorageCache
```

Skygear may also provide a `CompositeCache` class:

```
let coreDataCache = new CoreDataCache()
let memoryCache = new MemoryCache()
let cache = new CompositeCache(caches: [memoryCache, coreDataCache])

skygearChat.messageCache = cache
```
