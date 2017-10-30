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

- Older cached result is removed, only the newly fetched result is kept

# Changes Required

### Server

- Add a per conversation sequence to `message` table, to determine distance between two given messages.

### SDK

- Add callback to fetch messages and fetch conversations API.

#### JS

```js
const successCallback = (conversations, cached = false) => {
  // display conversations
};

skygearChat
  .fetchConversations(successCallback)
  .then(successCallback, errorCallback);

// no-cache version
skygearChat.fetchConversation().then(successCallback, errorCallback);
```

```js
let cachedMessages;

const successCallback = (messages, cached = false) => {
  let resolvedMessages;

  if (cached) {
    resolvedMessages = messages;
    cachedMessages = messages;
  } else {
    resolvedMessages = skygearChat.merge(cachedMessages, messages);
  }

  // display resolvedMessages
};

skygearChat
  .fetchMessages(conversation, fromTime, limit, successCallback)
  .then(successCallback, errorCallback);

// no-cache version
skygearChat.fetchMessages().then(successCallback, errorCallback);
```

#### Non-JS

```
skygearChat.fetchConversations(func (conversations, cached = false) {
  // display conversations
})
```

```
let cachedMessages;

skygearChat.fetchMessages(func (messages, cached = false) {
  let resolvedMessages;

  if (cached) {
    resolvedMessages = messages;
    cachedMessages = messages;
  } else {
    resolvedMessages = skygearChat.merge(cachedMessages, messages);
  }

  // display resolvedMessages
})
```
