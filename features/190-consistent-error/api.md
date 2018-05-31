# Consistent error handling for JS SDK

## Requirement

* To support a consistent way of handling error
* To obtain error information from failed API request
* To improve TypeScript support with regards to data obtained from rejected
  promise.
* Support legacy browsers (aka pre-IE-11).

## Current problem

The main problem lies in how the JS SDK handle error. Depending on the type of
API called, a promise maybe rejected with one of the followings:

* Error object
* SkygearError object (subclass of Error)
* Plain object

In the third case, the error message may be available in one of these locations:

* `error.error.message` 
* `error.message`

## Proposed solution

* Rejected promise should return an Error or an Error subclass. Do not reject
  promise with other types.
* For Server API calls, the promise should be rejected with SkygearError. If a
  third party library throws an Error, such Error should be wrapped inside
  SkygearError and should be assigned an error code.
* For other calls, the promise can be rejected with any Error. Error
  from third party library will be used to reject the promise.
* For function that returns a promise, the function should not throw an Error.
  Instead, the function should return a rejected promise with the Error.
* For function that does not return a promise, the function should
  throw an Error.

### Throwing error vs rejecting a promise

Example: https://github.com/SkygearIO/skygear-SDK-JS/commit/0f43378979130bac903f378b1bdfb2840e8b9568#diff-50ac0edef58dc8c3df00d1e6c7ed9b7eR143

When registering a device, the SDK checks whether the supplied token is
non-empty before returning a promise to send a request. If the supplied token is
empty, the functions throws an error.

This pattern follows the pattern that fails quickly if there is a programmer
error. See http://2ality.com/2016/03/promise-rejections-vs-exceptions.html.

This also means the developer has to catch the thrown error in addition
to checking the promise.

Rejecting a promise instead of throwing an Error allows developer to catch
the Error by checking promise, without using try...catch.

### Saving multiple records

When saving multiple records, the returned error depends on how many records are
being saved and whether the operation is atomic.

To ensure a consistent return value and error for different cases, multiple save
records API are proposed:

- `save(Record)` - resolve(Record), reject(Error)
  Save a single record.
- `saveMultiple` - resolve([Record]), reject(Error)
  Save multiple record automically.
- `saveMultipleNonAtomically([Record])` - resolve({[Record], [Error]}), reject(Error)
  Save multiple record non-atomically.

## Sample code

```javascript
import skygear from 'skygear';

skygear.auth.signupWithUsername('ben', 'passw0rd').then((user) => {
  // successful signup
}, (error) => {
  // User can check the error by using one of the following scenarios.

  // Scenario 1: check error code
  if (error.code === skygear.ErrorCodes.Duplicated) {
    console.log('User with the same username exists.');
    console.log('Detailed Message: ', error.message);
  }

  // Scenario 2: check if the error is an SkygearError
  if (error instanceof SkygearError) {
    console.log(error.message);  // print errror message
    console.log(error.code);  // print numeric error code
  }
});
```
