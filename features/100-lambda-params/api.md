# Lambda Function with Support for Skygear Data Types

## Use cases

* Developer create lambda function that has Skygear Data Types
  as parameter and return values.
* No extra declaration is required.

In this document, Skygear Data Types also include Skygear Record.

## Requirements

* On plugin-side, the lambda function should detect and convert JSON objects
  into Skygear Data Types.
* On plugin-side, the lambda function should convert Skygear Data
  Types into standard JSON object notation (e.g. using `$type` notation).
* In each SDK, the array/dictionary arguments should support data with Skygear
  Data Types.
* In each SDK, the server returned data should be converted to Skygear Data 
  Types before calling client code.

### Skygear Data Types

Skygear Data Types are the following:

* Skygear Record
* Complex Data Types (example includes location, date/time)
* Simple Data Types (example includes string, number, boolean)

While not strictly a Skygear Data Type, lambda function should also support the
following when accepting as parameter values or when returned.

* array
* dictionary

### Serialization and Deserialization

Serialization and Deserialization logic should share with existing
logic implemented by record save and record fetch action. Therefore, types
currently supported by Skygear will be supported in lambda parameters and
return value.

Since Skygear Record was not considered a data type, the protocol does
not have support for specifying a Record object. To support using Record object
in parameters and return value, a new `$type=record` will be implemented.

### Breaking Changes

When upgrading cloud function runtime (i.e. python or node), the function
arguments will replace `$type` JSON objects with native Skygear Data Type.
If the developer sends `$type` JSON objects from SDK, they will need to update
code that removes manual deserialization.

For return value, both runtimes do not support data types as return value, so
this feature will not break existing return logic.

When upgrading SDK, the return value will replace `$type` JSON objects with
native Skygear Data Type.
If the developer sends `$type` JSON objects from cloud function, they will need
to update code that removes manual deserialization.

For function argument, the SDKs do not support data types in function argument,
so this feature will not break existing argument logic.

In short, developer may need to modify existing code if,

* they upgrade the SDK or cloud function runtime; and
* the passed argument and/or return value contains `$type` JSON objects.

Apps running on old version will work with runtimes running on new version, and
vice versa.

### Detecting Record and Data Types

When deserializing JSON object into Data Types, the deserializers
should use the following method to find Data Types:

* if the JSON object is a dictionary,
  * if contains `$type` key, the object is treated as the data type specified
    in the value
  * otherwise, the object is treated as a hash map or dictionary, the content
    of the dictionary is recursively searched
* if the JSON object is an array,
  * the object is treated as an array or list, the content of the array
    is recursively searched
* if the JSON object is other data type
  * the object is treated as is, such as number, string or boolean

If a Skygear Record or a Skygear Data Type is found, the content is not
recursively searched because these objects have standardized deserialization
mechanisms. For example, a record with JSON data type will not be recursively
searched for detecting record and data types. This preserves existing behavior.

## Sample Usage

Suppose we have the following Lambda function:

```python
@skygear.op('alarms:future')
def filter(alarms, date):
    # The alarms param contains a list of Record while date contains a datetime
    # object.

    # The following is lambda logic:
    new_alarms = []
    for alarm in new_alarms:
        if alarm.trigger_time >= date:
            new_alarms.append(alarm)

    # Return the result array, lambda should also support returning dictionary,
    # single record, complex data types and simple data types.
    return new_alarms
```

The SDK can call this lambda function like the following:

```obj-c
SKYRecord *alarm1 = [SKYRecord recordWithRecordType:"alarm"];
[alarm1 setObject:[[NSDate date] dateByAddingTimeInterval:60]
           forKey:"trigger_time"];
SKYRecord *alarm2 = [SKYRecord recordWithRecordType:"alarm"];
[alarm2 setObject:[[NSDate date] dateByAddingTimeInterval:-60]
           forKey:"trigger_time"];

SKYContainer *container = [SKYContainer defaultContainer];
[container callLambda:@"alarms:future"
  dictionaryArguments:@{
                        @"alarms": @[ alarm1, alarm2 ],
                        @"date": [NSDate date]
                        }
    completionHandler:^(id *result, NSError *error) {
                        NSArray *alarms = (NSArray *)result;
                        NSLog(@"Future alarms: %@", alarms);
                       }];
```

In the above example, the developer does not convert the Skygear Data Type
manually. This result in clean and succinct code.

The serialized parameter will look similar to this:

```json
{
    "action": "alarms:future",
    "args": {
        "alarms: [
            {
                "$type": "record",
                "$obj": {
                    "_id": "alarm/c96942ae-2a5e-4d64-9d80-a3a79edc93e3",
                    "trigger_time": {
                        "$type": "date",
                        "$date": "2015-04-10T17:35:20+08:00"
                    }
                }
            },
            {
                "$type": "record",
                "$obj": {
                    "_id": "alarm/a2ab5286-5e7c-4d33-ade3-3aec40cfbae3",
                    "trigger_time": {
                        "$type": "date",
                        "$date": "2015-04-10T17:37:20+08:00"
                    }
                }
            }
        ],
        "date": {
            "$type": "date",
            "$date": "2015-04-10T17:36:20+08:00"
        }
    }
}
```

The deserialized return value will look similar to this:

```json
{
    "result: [
        {
            "$type": "record",
            "$obj": {
                "_id": "alarm/a2ab5286-5e7c-4d33-ade3-3aec40cfbae3",
                "trigger_time": {
                    "$type": "date",
                    "$date": "2015-04-10T17:37:20+08:00"
                }
            }
        }
    ]
}
```

## Previous Discussions

There was a discussion about `LambdaResult` which allows the developer to
obtain the typed object. We decided not to implement that because of the lack of
type safety when implementing getter via generics in Java. There is also lack of
a consensus on how to obtain a typed object contained in a dictionary.

For example, a getter such as this will help get a Location from the lambda
result:

```java
public Location getLocation()
```

The above result can also be obtained via generics.

```java
public T getObject<T>()  // where T can be Location
```

Since Skygear support classes that come from standard library, it is difficult
to define T in a way that is type safe. Specify T as a non-deserializable type
will result in runtime error.
