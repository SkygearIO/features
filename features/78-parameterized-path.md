Parameterise path in Plugin handler

## Feature Overview

This feature is enable user to obtain URL path as named params instead of
parsing themselves.

## Guides

Pretend you are writing the outline of the guide/changes on guides for the said feature. You
should explain how your SDK function interface/API will works.

This section helps others to understand how users will use your design, NOT how
it will be implemented.

It shall include the following subsections.

### Sample Codes

#### In skygear-SDK-JS
Example JS cloud code

```

skygearCloud.handler('downloads/{platform}/{version}', (req) => {
  // Take request to /downloads/osx/1.1.2?format=zip as an example
  console.log(req.params.platform); // got `osx`
  console.log(req.params.version); // got `1.1.2`
  console.log(req.params.build); // got undefined
});
```

Example Python cloud code

```
@skygear.handler('downloads/{platform}/{version}')
def download_handler(request, platform, version):
skygearCloud.handler('downloads/{platform}/{version}', (req) => {
  # Take request to /downloads/osx/1.1.2?format=zip as an example
  print(request.full_path) # Got '/downloads/osx/1.1.2?format=zip'
  print(platform) # Got 'osx'
  print(version) # Got '1.1.2'
});
```
### List of APIs

#### skygear-SDK-JS

No API change.

#### py-skygear

The decorated function will received named param, thus is have no affect to
existing usage.

### Changes on SDK

Here you should include how each client SDK will change, any underlying APIs, backward compatibility
tricks.

### Changes on API at skygear-server / plugins

No change on skygear-server. It is purely plugin parsing of HTTP URL PATH.

