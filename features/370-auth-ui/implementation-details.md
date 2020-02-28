# Implementation Details

This target audience of this document is the implementers.

## Cookie extraction in React Native application

On Android, it is possible to retrieve the cookies with ForwardingCookieHandler. The idea is to write a Native Module to instantiate a ForwardingCookieHandler. It have public methods to retrieve cookies for a given URL.

On iOS, it is possible to retrieve the cookies with `[NSHTTPCookieStorage sharedHTTPCookieStorage]`. WKWebview, however, has its own cookie storage. So we need to pull the cookies from NSHTTPCookieStorage and put them in WKHTTPCookieStore.
