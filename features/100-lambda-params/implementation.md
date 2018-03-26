# Implementation details for Lambda Function with Support for Skygear Data Types

## Changes required on server

* Add new `$type=record` in serializer/deserializer to Record data type.
* Modify `lambda.go` to use mapconv deserializers for converting parameters
  to payload.
* Lambda result in `LambdaHandler` should be interface{}, make sure it supports:
  * slice
  * map
  * Record
  * complex data types (such as skydb.Location)
  * simple data types (such as number)
* Add test case for testing new input/output data types.

## Changes required on cloud function runtimes

* Support new `$type=record` in `encoding.py` and `lib/type.js`
* In common transport (`skygear/transmitter/common.py` in python and
  `cloud/transport/common.js` in node), use existing serializers/deserializers
  for converting argument and return value.

## Changes required on SDK

* Add `$type=record` support in serializers/deserializers.
* Serialize lambda array arguments / dictionary arguments into Skygear data
  types using standard serializers.
* Deserialize return value from server using standard deserializers.
* In Objective-C and Java, create `LambdaResult` class for getting returned
  value.

## LambdaResult

In Objective-C,

```objective-c
// Return result with NSObject type
- (id)object

// Return result with specific type, e.g.
- (bool)bool
- (CLLocation * _Nullable)location
- (SKYRecord * _Nullable)record

// Return result if lambda result is a dictionary, e.g.
- (id)objectForKey:(NSString *_Nonnull)key
- (bool)boolForKey:(NSString *_Nonnull)key
- (CLLocation * _Nullable)locationForKey:(NSString *_Nonnull)key
- (SKYRecord * _Nullable)recordForKey:(NSString *_Nonnull)key

// Return array and dictionary
- (NSArray<id> * _Nullable)array
- (NSDictionary<String, id> *_Nullable)dictionary
```

In Java,

```java
// Note: T should support Skygear Data Types as well as Array and Map

// Return result with NSObject type
public T getObject<T>()

// Return result if lambda result is a dictionary, e.g.
public T getObject<T>(String key)
```
