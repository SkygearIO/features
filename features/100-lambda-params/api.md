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

### Breaking Changes

When upgrading to a version of Skygear Plugin/SDK that supports Skygear Data
Type on lambda function, the parameter and returned values supprot Skygear Data
Types automatically.

Since previously the code expects parameter and returned values to be JSON
object, developer will have to update the code in order to handle the data
types.

No futher declaration is needed to enable support for Skygear Data Type.

### Detecting Record and Data Types

When deserializing JSON object into Data Types, the deserializers
should use the following method to find Data Types:

* if the JSON object is a dictionary,
  * if contains `$type` key, the object is treated as the data type specified
    in the value
  * if contains `_id` key, the object is a Skygear Record
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
    completionHandler:^(LambdaResult *result, NSError *error) {
                        NSArray *alarms = [result array];
                        NSLog(@"Future alarms: %@", alarms);
                       }];
```

In the above example, the developer does not convert the Skygear Data Type
manually. This result in clean and succinct code.

Since the lambda can return a variety of data types, the result is encapsulated
to a generic `LambdaResult` object, which the developer can obtain the result.
In the lack of such class, the developer will result in getting the result by:

```obj-c
^(id result, NSError *error) {
  if ([result isKindOfClass:[NSArray class]) {
    NSArray *alarms = (NSArray *)result;
    NSLog(@"Future alarms: %@", alarms);
  }
}
```

