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

# Conclusion

When to update which cache:

- conversation list:
    - first N or all conversations when enter app
    - new conversations
        - before (or right at) it is sent to server by the user OR
        - received from other user
    - conversations edited
        - before (or right at) it is sent to server by the user OR
        - received from other user
    - conversations deleted
        - before (or right at) it is sent to server by the user OR
        - received from other user

- messages:
    - first N messages of a conversation
        - when enter app OR
        - when enter message list
    - next N messages when load more
    - new messages
        - before (or right at) it is sent to server by the user OR
        - received from other user
    - messages edited
        - before (or right at) it is sent to server by the user OR
        - received from other user
    - messages deleted
        - before (or right at) it is sent to server by the user OR
        - received from other user
