# OpenFaas vs Fission

As the underlying faas framework for skygear, they provide the following features.

- A pipeline to serve function as http server (, cron job and etc.)
- Routing
  - load route config dynamically, no need to restart or reload
- Scaling
- Monitoring

## Pros and cons

### OpenFaas

Pros:
- Relatively simple architecture on top of k8s, which is similar to v1
  - easy to predict
  - easy to customise

Cons:
- Almost no extra features provided for optimising performance
  - which may lead to similar performance to v1 in the long run, maybe 1 min or even more for new

### Fission

Pros:
- Very attractive pool manager
  - excels at cold start time, consistently within a few hundreds ms
  - very suitable for our multitenant design, consume very little resources when idle
- Still support deploying function to separate pod
  - which is similar to OpenFaas / v1

Cons:
- Comlicated architecture
  - hard to trace unexpected behaviour
- Components except the router are not scalable
  - which may be a concern when traffic grows

## Performance Testing

### High traffic

I have done some testing on the two frameworks with Loader.io, since I didn't pay for the service, I can only perform some limited setup.

Both OpenFaas and Fission are able to handle about 200 requests per second to one single function, and the performance is very close to requesting a http server hosted on the same cluster through nginx ingress controller at the same request rate.

However, after adding one extra function to the test, i.e. simultaneously request two functions, all three setup have the performance dropped significantly, while requests to OpenFaas and Fission start having timeout. This happens when traffic is at about 100 to 150 request per second.

OpenFaas shows a critical behaviour under high load. At some point in the testing, the gateway would timeout the requests. And any subsequent requests, even the traffic went down, the gateway can no longer response normally to incoming request. Fission does not have the same problem for the same situation.

### Calling different functions to force the Fission pool to grow

The pool manager of fission is very good at function cold start time, however, there is a limit.

The number of pre-warmed pod in pool is limited. Though, when one of the pre-warmed pod is specialised for one function, immediately a new pod would be warmup, and wait for new function request. So I have done some testing on the performance of how well the pool can grow when the number of kind of function request exceed the number of pre-warmed pod.

For 5 requests to a pool with 3 pod, the 3 fastest request take about 1 second to respond and the slower 2 take about 6 and 7 seconds.

The extra time for the slower two requests are the time needed for the k8s to create and initialise a pod. So the result is expected.

For 5 requests to a pool with 1 pod, the fastest request take about 1 second to respond, then 4 seconds, 9 seconds, 15 seconds and 19 seconds.

The result is due to the behaviour of fission that only one new pod is created when one pod is specialised.

This behaviour is the same even the pool size increased, however, the result would be significantly improved, due to multiple pod being specialised and so multiple pod would be created.

So if we want to keep the cold start time small enough, we find the number of different new functions get triggered within a few seconds.

Another finding in this test is that, if I perform the two tests, i.e. 10 requests, at the same time, the respond time of some requests would become unexpectedly slower, even there are available pre-warmed pods there.

Fission does have some problem when setting pool size of the pool manager. For example,

environment version 1 -> no pool size
environment version 3 -> newdeploy does not work

Concern: fission may have small problems when we dig deeper.

## Testing with real use case

### High traffic with db operation

Operation:
- query 10 latest row from a table with about 10000 rows

#### python

Note:
- pg8000 is used as the pq library, since the common one requires external dependency installed in the machine

Result:
- 1 pod: ~25req/s
- 3 pod: ~120req/s

#### golang

Result:
- 1 pod: ~60req/s
- 3 pod: ~150req/s

When using 1 pod, golang do much better than python because golang supports connection pool natively.

### Normal traffic with many app / functions

Setting:
- 20 python microservices (newdeploy) + 20 go microservices
- 500 python functions (poolmgr) + 500 go functions
- pool size: 10 python and 10 go

Operation:
- query 10 latest row from a table with about 10000 rows

Calling pattern:
- call 5 microservices and functions once per 5 seconds
- call 4 microservices and functions once per 3 seconds
- call 2 microservices and functions once per 2 seconds

#### Expected result

- The microservices respond quickly, because the resource for these should have been prepared when deploy
- The first 10 functions respond quickly because there should be 10 pre-warmed pods ready to get specialised and respond
- After that, depends on how fast new pod in the pool get initialised, the 11 function responds slower than the first 10.

#### Result

##### First run

I run the test for 60s, and the result does not match with the expected one.

For the longest repond time, which is the first time invocation,
- Only 2 microservices respond within 1s, one of them respond with 4s, and other need more than 10s.
- Only 1 function respond within 1s, 3 of them respond at about 8s, and other need more than 10s.

All of them respond within 100ms for subsequent calls.

##### Second run

I then run the test for another 60s, a few minutes after the first test.

All microservices functions respond within 2s, and the median is about 150ms.

##### Investigation

The result for first run is quite far from the expected result.

After trying more different testing, here is what I found:
- The respond time is long when microservice get called first time and many different (~10) requests issued at the same time
- The respond time is long when function get cold start and many different (~10) requests issued at the same time
- Even microservice get called first time or function get cold start, if the number of kind of request get issued at the same time is not so high (~4), the respond time is still within 1s

After viewing the log and digging into the source code, I believe that the bottleneck is at the executor and controller.

Each time the executor receive a request, it would try to find the targeted pod from its own cache, and if not found, it makes corresponding request to the controller in order to find the right resources for that request.

When many requests do not hit the cache at the same time, the respond time would significantly become longer. And it is still not clear exactly which part that cause the problem.
