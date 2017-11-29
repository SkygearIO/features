# Push Notification Hook in Chat
## Feature Overview

This feature enables developer to send customized push notification via cloud function deployment. The approach is to provide hooks in chat conversation including

* Messages
  * after\_message\_sent
  * after\_message\_updated
  * after\_message\_deleted
* Typing
  * typing\_started
* Conversation
  * after\_conversation\_created
  * after\_conversation\_deleted
  * after\_conversation\_updated
  * after\_users\_entered\_conversation
  * after\_users\_leave\_conversation

### Task
- Create chat hook annotation in chat SDK
- Enable chat plugin to call pre-defined hook

### Sample Codes

- Sample Javascript Cloud Function

```javascript
skygearChat.afterMessageSent((message, conversation) => {
  skygear.push.sendToUser(conversation.participants, {'title': 'Title', 'body': 'Hello World'})
})
```

- Python Cloud Function

```python

@chat.after_message_sent
def after_messange_send_handler(message, conversation):
   user_ids = [p.id.key for p in conversation.participants]
   notification = {...}
  skygear.action.push_users(container, user_ids, notification)
```

### List of APIs

- Javascript
  - `skygearChat.afterMessageSent((message, conversation, participants) => {})`
  - `skygearChat.afterMessageUpdated((message, conversation, participants) => {})`
  - `skygearChat.afterMessageDeleted((message, conversation, participants) => {})`
  - `skygearChat.typingStarted((conversation, participants, events) => {})`
  - `skygearChat.afterConversationCreated((conversation, participants) => {})`
  - `skygearChat.afterConversationUpdated((conversation, participants) => {})`
  - `skygearChat.afterConversationDeleted((conversation, participants) => {})`
  - `skygearChat.afterUsersAddedToConversation((conversation, participants, users) => {})`
  - `skygearChat.afterUsersRemovedFromConversation((conversation, participants, users) => {})`

- Conversation
  - `@chat.after_message_sent`
  - `@chat.after_message_updated`
  - `@chat.after_message_deleted`
  - `@chat.typing_started`
  - `@chat.after_conversation_created`
  - `@chat.after_conversation_updated`
  - `@chat.after_conversation_deleted`
  - `@chat.after_users_added_to_conversation`
  - `@chat.after_users_removed_from_conversation`

## Implementation Details


### Changes on JS SDK
- Example:

```javascript
export function afterMessageSent(callback) {
  registry.registerHandler('chat:after_message_sent', (req) => {
    var conversation = blahblahblah ;
    var message = blahblahblah;
    callback(message, conversation);
  }, {});
}
```

### Changes on Plugin (Hook Wrapper)
- Wrapper of op wrapper

- Example:

```python
def after_message_sent(*args, **kwargs):
    def chat_op(func):
        _registry.register_op('chat:after_message_sent', func, *args, **kwargs)
        return func
    return chat_op
```


### Changes on Plugin (Database Operation)
- Send message to call specific hook after database operation
- Example:

``` python
container.send_action('chat:after_conversation_hook', {'roles': message, 'conversation': conversation} )
```

### Changes on API at skygear-server

Nil

### Database Schema

Nil

### Migration

Nil
