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
