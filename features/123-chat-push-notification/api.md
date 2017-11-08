# Push Notification in Chat
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
  * after\_user_entered\_conversation
  * after\_user_leave\_conversation

In addition, the current JS push notification code snippet is too verbose and can be simplified.

### Task
- Refactor JS SDK Push Notification Function so that it can be called by developer with less code.  
	- Original Code: 
	
	```javascript
	var skygear = require('skygear');
	skygear.push.sendToDevice(
	  ['2aa4af2a-699a-4e43-8d67-7598757fc7ed'], // Device IDs
	  {
	    'apns': {
	        'aps': {
	            'alert': {
	                'title': title,
	                'body': message,
	            }
	        },
	        'from': 'skygear',
	        'operation': 'notification',
	    },
	    'gcm': {
	         'notification': {
	              'title': title,
	              'body': message,
	          }
	    },
		}
	);
	```

	- new Code: 

	```javascript
	var skygear = require('skygear');
	skygear.push.sendToDevice(
	  ['2aa4af2a-699a-4e43-8d67-7598757fc7ed'],
	  {
         'title': title,
         'body': message
	  }
	);
	```
- Create chat hook annotation in chat SDK
- Enable chat plugin to call pre-defined hook

### Sample Codes

- Sample Javascript Cloud Function

```javascript
skygearChat.afterMessageSent((message, conversation) => {
  var userIds = conversation.participants.map(p => p.user.key.recordID);
  skygear.push.sendToUser(userIds, {'title': 'Title', 'body': 'Hello World'})
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
	- `skygearChat.afterMessageSent((message, conversation) => {})`
	- `skygearChat.afterMessageUpdated((message, conversation) => {})`
	- `skygearChat.afterMessageDeleted((message, conversation) => {})`
	- `skygearChat.typingStarted((conversation, events) => {})`
	- `skygearChat.afterConversationCreated((conversation) => {})`
	- `skygearChat.afterConversationUpdated((conversation) => {})`
	- `skygearChat.afterConversationDeleted((conversation) => {})`
	- `skygearChat.afterUserAddedToConversation((conversation) => {})`
	- `skygearChat.afterUserRemovedFromConversation((conversation) => {})`

- Conversation
  - `@chat.after_message_sent`
  - `@chat.after_message_updated`
  - `@chat.after_message_deleted`
  - `@chat.typing_started`
  - `@chat.after_conversation_created`
  - `@chat.after_conversation_updated`
  - `@chat.after_conversation_deleted`
  - `@chat.after_user_added_to_conversation`
  - `@chat.after_user_removed_from_conversation`

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