# Feature Overview

#### Objective

- Allow fetch messages by giving `after_time` param, to load newer messages

#### Description

Current fetch message API only allow giving `before_time`. Together with fetching latest messages, client app can show latest messages and load older messages when scroll up the message list.

However, this cannot fulfill the requirement that a client app may allow scrolling down the message list to load newer messages (but not latest messages).

With the ability of querying newer messages and older messages, client app can display messages when user scroll up and down the message list.

#### Sample use case

This can be useful if the client app wants to allow user to jump to a specific message a period of time ago, and scroll up and down from that message.

An app may jump to a specific message when:

- user click a message that another message is replying to (like Telegram, WhatsApp)
- user click scroll to bottom button, but the user has previously jumped from a replied message (like Telegram, WhatsApp)
- user search message and click one of the search result (like Slack)

# Changes Required

### Server

- Also accept param `afterMessage` in fetchMessages API

- fetchMessages API should also return the ID of one newer message. So the client can tell if the API call has fetched the latest message already. Togther with `previous_message`, the client can also determine if it needs to fetch older message.

### SDK

- Add fetchMessages API for accepting param `afterMessage`

```
// Promise
func fetchMessages(conversation, afterMessage, limit, order) -> Promise

// Non-Promise
func fetchMessages(conversation, afterMessage, limit, order, callback)
```
