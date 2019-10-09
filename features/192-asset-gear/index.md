# Asset Gear

## Goals

- Store user-generated asset to fulfill application needs.
  - Photos and short videos taken by the application.
  - Images and short videos chosen from the library.
  - Artwork by the user.
  - Attachments in a chat application.
  - Documents of reasonable size.
- Process image asset on the fly via query string.
- Access control via presigned URL

## Non-goals

- Video live streaming such as Facebook Live.
- File sharing application like Imgur.
- Static website hosting. Another gear is responsible for this.

## Layout

The asset name is in the following format.

```
/<app-id>/<random-string>[.<ext>]
```

- `app-id`: The app ID.
- `random-string`: A randomly generated string.
- `ext`: The inferred file extension (if any) from the given content type.

## HTTP API

### POST /_asset/presign_upload

#### Description

This endpoint returns a presigned upload request which can be used to upload an asset.

This endpoint requires API Key and authenticated user.

#### Request JSON Schema

```json
{
  "type": "object",
  "properties": {
    "exact_name": { "type": "string" },
    "prefix": { "type": "string" },
    "access": { "enum": ["public", "private"] },
    "headers": {
      "type": "object",
      "properties": {
        "content-type": { "type": "string" },
        "content-disposition": { "type": "string" },
        "content-encoding": { "type": "string" },
        "content-length": { "type": "string" },
        "content-md5": { "type": "string" },
        "cache-control": { "type": "string" },
        "access-control-allow-origin": { "type": "string" },
        "access-control-expose-headers": { "type": "string" },
        "access-control-expose-headers": { "type": "string" },
        "access-control-max-age": { "type": "string" },
        "access-control-allow-credentials": { "type": "string" },
        "access-control-allow-methods": { "type": "string" },
        "access-control-allow-headers": { "type": "string" }
      }
    }
  }
}
```

- `exact_name`: The exact name of the asset.
- `prefix`: If `exact_name` is not given, a random name is generated with `prefix` prepended.
- `access`: The access control of the asset. `public` is the default.
- `headers`: The HTTP headers of the asset when it is retrieved.
- `headers.content-type`: The Content-Type header. `application/octet-stream` is the default.
- `headers.content-disposition`: The Content-Disposition header.
- `headers.content-encoding`: The Content-Encoding header. The developer must make sure the asset is compressed in the given compression.
- `headers.content-length`: The Content-Length header. Depending on the upload method, it may be ignored. However, the client must provide Content-Length in the actual upload request.
- `headers.content-md5`: The [Content-MD5](https://tools.ietf.org/html/rfc1864) header. Depending on the upload method, it may be ignored.
- `headers.cache-control`: The Cache-Control header. If it is not given, a default one is added. To remove the header, set it to an empty string.
- `headers.access-control-*`: The CORS headers. They are only useful if the developer needs to retrieve the asset with Fetch API.

##### Request Example

```json
{
  "headers": {
    "content-type": "image/png"
  }
}
```

#### Response JSON Schema

```json
{
  "type": "object",
  "properties": {
    "asset_id": { "type": "string" },
    "url": { "type": "string" },
    "method": { "type": "string" },
    "headers": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "value": { "type": "string" }
        },
        "required": ["name", "value"]
      }
    },
    "form": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "value": { "type": "string" },
          "filename": { "type": "string" }
        },
        "required": ["name"]
      }
    }
  },
  "required": ["asset_id", "url", "method", "headers"]
}
```

- `asset_id`: The asset ID. It becomes valid when the asset is uploaded.
- `url`: The presigned URL to upload the asset.
- `method`: The method to be used in the upload request.
- `headers`: The headers to be included in the upload request.
- `form`: The form data to be included in the upload request.
  - `filename`: If the form name-value pair has this property, it is the field for the asset.

##### Response Example

```json
{
  "asset_id": "myimage.png",
  "url": "https://storage.skygearapps.com/bucket/myappid/myimage.png?...",
  "method": "POST",
  "headers": [
    { "name": "content-type", "value": "multipart/form-data" }
  ],
  "form": [
    { "name": "file", "filename": "myimage.png" },
    { "name": "Policy", "value": "..." }
  ]
}
```

#### Server Specification

1. Let `ext` be an empty string.
1. If `headers.content-type` is present, set `ext` to the file extension derived from it.
1. If `exact_name` is given and non-empty, let `name` be `exact_name`. Set `headers.cache-control` to `no-cache` if it is absent.
1. Otherwise let `name` to be the concatenation of `prefix`, a random string and `ext`. Set `headers.cache-control` to `max-age: 3600` if it is absent.
1. Let `asset_id` be `/<app-id>/<name>`.
1. Remove any header in `headers` whose value is empty string.
1. Presign `asset_id` with `headers` and `access`.
1. Return the presigned request.

#### Client Specification

If the `content-type` header in the presign request is `multipart/form-data`, the client must submit a multipart form request.

The file field must be the last field in the form.

### POST /_asset/sign

#### Description

This endpoint signs the given assets.

This endpoint requires Master Key.

#### Request JSON Schema

```json
{
  "type": "object",
  "properties": {
    "assets": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "asset_id": { "type": "string" }
        },
        "required": ["asset_id"]
      }
    }
  },
  "required": ["assets"]
}
```

- `asset_id`: The asset ID.

##### Request Example

```json
{
  "assets": [
    { "asset_id": "myimage.png" }
  ]
}
```

#### Response JSON Schema

```json
{
  "type": "object",
  "properties": {
    "assets": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "asset_id": { "type": "string" },
          "url": { "type": "string" }
        },
        "required": ["asset_id", "url"]
      }
    }
  },
  "required": ["assets"]
}
```

- `url`: The signed URL.

##### Response Example

```json
{
  "assets": [
    {
      "asset_id": "myimage.png",
      "url": "https://myappname.skygearapps.com/_asset/myimage.png?..."
    }
  ]
}
```

#### Specification

1. Sign each `asset_id` in `assets`.
1. Return the result in the original order.

### GET /_asset/<asset_id>

#### Request Query String

The asset is eligible for image processing if all of the following hold

- The asset is less than or equal to 20MiB.
- The asset is detected to be PNG, JPEG or WebP.

#### Specification

1. Reverse proxy the request to the origin server.
1. Process the asset if the image processing query string is present and the asset is eligible for image processing.
1. Set `Cache-Control`, `Vary`, `Expires` headers correctly.

### GET /_asset/assets

#### Description

This endpoint return a list of assets.

This endpoint requires Master Key.

#### Request Query String

- `pagination_token`: The token to retrieve the next page.

##### Request Example

```
/_asset/assets
```

Retrieve the first page.

```
/_asset/assets?pagination_token=98e69a8413944dd21ea97e6c956a0a47ed135749bfb355bcb177c4333654c737
```

Retrieve the subsequent page with the token.

#### Response JSON Schema

```json
{
  "type": "object",
  "properties": {
    "pagination_token": { "type": "string" },
    "assets": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "size": { "type": "integer" },
          "content_type": { "type": "string" }
        },
        "required": ["name", "size", "content_type"]
      }
    },
    "required": ["assets"]
  }
}
```

- `pagination_token`: The token to retrieve the next page. If it is absent, there is no next page.
- `assets.name`: The asset name.
- `assets.size`: The size of the asset.
- `assets.content_type`: The media type of the asset.

##### Response Example

```json
{
  "pagination_token": "98e69a8413944dd21ea97e6c956a0a47ed135749bfb355bcb177c4333654c737",
  "assets": [
    {
      "name": "myimage.png",
      "size": 12345,
      "content_type": "image/png"
    }
  ]
}
```

### POST /_asset/delete

#### Description

This endpoint deletes the given assets.

This endpoint requires Master Key.

#### Request JSON Schema

```json
{
  "type": "object",
  "properties": {
    "asset_ids": {
      "type": "array",
      "items": { "type": "string" }
    }
  }
}
```

##### Request Example

```json
{
  "asset_ids": ["myimage.png"]
}
```

#### Response

The response does not have body.

## Image Processing

### Image Processing Pipeline via Query String

The query parameter `pipeline` refers to the processing pipeline.

The value follows this syntax.

```
PIPELINE = ASSET-TYPE ( "/" OPERATION [ "," PARAMETER ]* )+
PARAMETER = NAME | NAME "_" VALUE
```

The only supported `ASSET-TYPE` is `image`.

#### Operations

##### format

Transform the asset into the specified format.

- `jpg`: Transform into JPEG.
- `png`: Transform into PNG.
- `webp`: Transform into WebP.

###### Example

```
pipeline=image/format,jpg
```

Transform the asset into JPEG.

##### quality

Set the quality if the format is `jpg` or `webp`.

- `Q`: Set the absolute quality. Valid values are 1 to 100.

###### Example

```
pipeline=image/format,jpg/quality,Q_85
```

Transform the asset into JPEG of quality 0.85.

###### resize

- `m`: Specify the scaling mode. Valid values are `lfit`, `mfit`, `fill`, `pad` and `fixed`.
- `w`: Specify the target width. Valid values are 1 to 4096.
- `h`: Specify the target height. Valid values are 1 to 4096.
- `l`: Specify the longer side of the target. Valid values are 1 to 4096.
- `s`: Specify the shorter side of the target. Valid values are 1 to 4096.
- `color`: Specify the fill color when `m` is `pad`.

The following explains the scaling mode.

|Scaling mode|Description|
|---|---|
|`lfit`|The dimension of the image is at most `w` x `h`. The aspect ratio is the same.|
|`mfit`|The dimension of the image is at least `w` x `h`. The aspect ratio is the same.|
|`fill`|The dimension of the image is exactly `w` x `h`. The aspect ratio is the same. The image is cropped as necessary.|
|`pad`|The dimension of the image is exactly `w` x `h`. The aspect ratio is the same. The image is centered. The remaining area is filled with `color`.|
|`fixed`|The dimension of the image is exactly `w` x `h`. The aspect radio may **NOT** be the same.|

`w` and `h` has precedence over `l` and `s`.

When only one dimension is given, the other dimension is derived with respect to the aspect ratio.

For example, suppose the image is 300px x 200px. `image/resize,w_150` is equivalent to `image/resize,w_150,h_100`.

###### Example

```
pipeline=image/resize,m_fill,w_200,h_200
```

Crop the image into 200px x 200px.

```
pipeline=image/resize,l_200
```

Resize the image such that its longer side is 200px. Its shorted side is resized proportionally.

#### Unsupported Operations

##### Encoding into Progressive JPEG

Encoding into progressive JPEG is not supported because it is not performant.
See https://github.com/libvips/libvips/issues/77

##### 8-bit PNG

libvips does not support transform into 8-bit PNG without saving to a local file.

### Image Processing via HTTP Client Hints

To be specified in the future.

Some useful references

- https://developers.google.com/web/fundamentals/performance/optimizing-content-efficiency/client-hints/#responsive_images

#### Interaction between HTTP Client Hints and Query String

To be specified in the future.

#### Caveat

The initial implementation does not have caching.

## SDK API

```typescript
interface UploadAssetBaseOptions {
  exactName?: string;
  prefix?: string;
  access?: "public" | "private",
  headers?: {
    [name: string]: string;
  }
}
```

### Web

```typescript
interface UploadAssetOptions extends UploadAssetBaseOptions {
  onUploadProgress?: (e: ProgressEvent) => void;
}

function upload(blob: Blob, options?: UploadAssetOptions): Promise<string>;
```

### Node Client

```typescript
interface UploadAssetOptions extends UploadAssetBaseOptions {
  // size is required when data is stream.Readable.
  size?: number;
  // Since there is no xhr2 polyfill with upload progress support in Node,
  // upload progress callback only works for Web and React Native.
}

function upload(data: Buffer | stream.Readable, options?: UploadAssetOptions): Promise<string>;
```

The Node SDK depends on a third party `FormData` library to support multipart form submission.

### React Native

```typescript
interface UploadAssetOptions extends UploadAssetBaseOptions {
  onUploadProgress?: (e: ProgressEvent) => void;
}

function upload(uri: string, options?: UploadAssetOptions): Promise<string>;
```

- `uri` can be the `uri` returned by `CameraRoll.getPhotos`. See https://github.com/facebook/react-native/issues/24185#issuecomment-478973633
- `uri` can be file URI.
- `uri` can be absolute path which is converted to file URI.

The React Native SDK has a peer dependency on [rn-fetch-blob](https://github.com/joltup/rn-fetch-blob). It is a library with native code.

### Image Processing Query builder

```typescript
interface ImageProcessingPipelineBuilderResizeOptions {
  scalingMode?: "lfit" | "mfit" | "fill" | "pad" | "fixed";
  targetWidth?: number;
  targetHeight?: number;
  longerHeight?: number;
  shortedHeight?: number;
  // In "RRGGBB" format.
  color?: string;
}

class ImageProcessingPipelineBuilder {
  format(format: "jpg" | "png" | "webp"): ImageProcessingPipelineBuilder;
  quality(q: number): ImageProcessingPipelineBuilder;
  resize(options: ImageProcessingPipelineBuilderResizeOptions): ImageProcessingPipelineBuilder;

  // Set the current pipeline to the url.
  setToURLString(url: string): string;

  // Get the name and value to be used with URLSearchParams.
  getName(): string;
  getValue(): string;
}
```

## Use Cases

### Upload avatar image in React Native

```typescript
import { CameraRoll } from "react-native";
import skygear from "@skygear/react-native";

const result = await CameraRoll.getPhotos({
  first: 10,
  assetType: "Photos",
  // We have to fetch each media type one by one
  // because the result does not include media type.
  // If we allowed multiple media types, we would not be able to
  // tell the media type.
  mimeTypes: ["image/jpeg"],
});

// Suppose the user select the first one.

const uri = result.edges[0].node.image.uri;
const contentType = "image/jpeg";

const assetID = await skygear.asset.upload(uri, {
  headers: {
    "content-type": contentType,
  },
});

// Associate the asset ID with the current user.
```

### Upload avatar image on Web

```typescript
// Suppose we have the following DOM
// <input id="file" type="file" accept="image/jpeg, image/png">

const input = document.getElementById("file");
if (input.files[0] != null) {
  const file = input.files[0];
  const assetID = await skygear.asset.upload(file);
  // Associate the asset ID with the current user.
}
```

### Resolve public asset ID in Microservice

```javascript
function resolvePublicAssetURL(req, assetID) {
  return `https://${req.host}/_asset/${assetID}`;
}

async function getMe(req, res) {
  const user = await getUser();
  const avatarURL = resolvePublicAssetURL(req, user.avatarAssetID);
  user.avatarURL = avatarURL;
  // Return user as response.
}
```

### Resolve private asset ID in Microservice

```javascript
import fetch from "node-fetch";

async function resolvePrivateAssetURL(req, assetID) {
  const endpoint = `https://${req.host}/_asset/sign`;
  const resp = await fetch(endpoint, {
    method: "POST",
    headers: {
      "x-skygear-api-key": process.env.SKYGEAR_MASTER_KEY,
    },
    body: JSON.stringify({
      "assets": [{ asset_id: assetID }],
    })
  });
  const j = await resp.json();
  return j["assets"][0].url;
}

async function getMe(req, res) {
  const user = await getUser();
  const avatarURL = await resolvePrivateAssetURL(req, user.avatarAssetID);
  user.avatarURL = avatarURL;
  // Return user as response.
}
```

### Image processing at display time

```typescript
import { ImageProcessingPipelineBuilder } from "@skygear/web";

const builder = new ImageProcessingPipelineBuilder().
  resize({
    scalingMode: "fill",
    targetWidth: 200,
    targetHeight: 200,
  }).
  format("jpg").quality(0.85);

for (const user of users) {
  const url = builder.setToURLString(user.avatarURL);
  document.getElementById("img-" + user.id).src = url;
}
```
