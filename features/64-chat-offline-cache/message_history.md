# Objective

Rebuild a correct message list from any time.

# Design Overview

Two tables for storing message data: `message` and `message_history`.

- `message` is a snapshot of the current state of all messages
- `message_history` is an append-only history / journal of all actions performed on the `message` table

#### `message_history` sequence

The `message_history` sequence is an auto increment sequence in the db.

A `message` table represents the state when actions performed from 0 to a given sequence.

By having this sequence, both server and client can generate a complete message list with two given `message_history` sequences.

When client app receives new message, the app should also be able its local `message_history` sequnce. Thus later the app can send its local `message_history` sequence to server to get its missing messages.

# Scenario

*The API call below only indicates call from client to server, thus is called internally*

### Freshly installed client app

API call:
- getMessages(in: conversation)
Expected output: Latest messages and latest `message_history` sequence

### Re-open app

API call:
- subscribeMessages(from: last_sequence, in: conversation)
Expected output: messages streamed from the sequence and latest `message_history` sequence

# Alternative

Make use of `created at`, `updated at` and `deleted at` of messages to produce a minimal history.

So if

- `deleted at` != NULL -> message is deleted
- `created at` == `updated at` -> message is created and not updated
- `created at` < `updated at` -> message is updated

Pros:
- This is easy to migrate from older version
- Smaller disk space required
- Does not require to maintain two tables

Cons:
- Only the last updated state can be stored

However, it is arguable if those intermediate updated revisions are necessary. Generally, most chat apps only show if a message is edited or not, but do not have a full history of a message.

#### Datetime collision

There was a disucssion about retrieving messages using date time. This may cause incomplete fetch result when the number of messages with the same datetime is larger than the number of fetch limit.

I suggest using the last fetched message instead of last fetched datetime for fetch parameter, thus the server can make use of the message create time and sequence number to prevent the datetime collision.

Thus the api would be like

```
- getMessages(in: conversation)
- subscribeMessages(from: last_message, in: conversation)
```
