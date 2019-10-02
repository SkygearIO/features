# Asset Gear

## Overview

The Asset Gear is a gear for uploading and retrieving user-generated asset.

It supports both public and private asset.

It can transform image asset on the fly via query string.

The Asset Gear does not support static website hosting. Another gear is responsible for that.

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
    "content_type": { "type": "string" },
    "content_md5": { "type": "string" },
    "access": { "enum": ["public", "private"] }
  }
}
```

- `content_type`: The media type of the asset.
- `content_md5`: The MD5 hash of the asset in the format specified in [RFC1864](https://tools.ietf.org/html/rfc1864).
- `access`: The access control of the asset. `public` is the default.

##### Request Example

```json
{
  "content_type": "image/png",
  "content_md5": "Zum77CZrrrGRDM18nlplig=="
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

1. Validate `content_type` if it is present.
1. Let `name` be a randomly generated string.
1. Let `ext` be the file extension derived from `content_type`.
1. If `ext` is found, append it to `name`.
1. Let `asset_id` be `/<app-id>/<name>`.
1. Presign `asset_id` with `content_type`, `content_md5` as headers.
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

For the details on the scaling mode, See https://www.alibabacloud.com/help/doc-detail/44688.htm

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

### Web

```typescript
interface UploadAssetOptions {
  // access by default is `public`.
  access?: "public" | "private",
  contentType?: string;
}

function upload(blob: Blob, options?: UploadAssetOptions): Promise<string>;
```

### Node Client

```typescript
interface UploadAssetOptions {
  // access by default is `public`.
  access?: "public" | "private",
  contentType?: string;
  // contentMD5 is required when data is Readable.
  contentMD5?: string;
}

function upload(data: Buffer | stream.Readable, options?: UploadAssetOptions): Promise<string>;
```

The Node SDK depends on a third party `FormData` library to support multipart form submission.

### React Native

```typescript
interface UploadAssetOptions {
  // access by default is `public`.
  access?: "public" | "private",
  contentType?: string;
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

### Upload avator image in React Native

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

const assetID = await skygear.asset.upload(uri, { contentType });

// Associate the asset ID with the current user.
```

### Upload avator image on Web

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
  const avatorURL = resolvePublicAssetURL(req, user.avatorAssetID);
  user.avatorURL = avatorURL;
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
  const avatorURL = await resolvePrivateAssetURL(req, user.avatorAssetID);
  user.avatorURL = avatorURL;
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
  const url = builder.setToURLString(user.avatorURL);
  document.getElementById("img-" + user.id).src = url;
}
```
