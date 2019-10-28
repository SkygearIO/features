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

This endpoint requires (API Key and authenticated user) or Master Key.

#### Request JSON Schema

```json
{
  "type": "object",
    "additionalProperties": false,
    "properties": {
      "prefix": {
        "type": "string",
        "pattern": "^[^\\x00\\\\/:*'<>|]*$"
      },
      "access": { "type": "string", "enum": ["public", "private"] },
      "headers": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "content-type": { "type": "string" },
          "content-disposition": { "type": "string" },
          "content-encoding": { "type": "string" },
          "content-length": { "type": "string" },
          "content-md5": { "type": "string" },
          "cache-control": { "type": "string" },
          "access-control-allow-origin": { "type": "string" },
          "access-control-expose-headers": { "type": "string" },
          "access-control-max-age": { "type": "string" },
          "access-control-allow-credentials": { "type": "string" },
          "access-control-allow-methods": { "type": "string" },
          "access-control-allow-headers": { "type": "string" }
        },
        "required": ["content-length"]
      }
    },
    "required": ["headers"]
}
```

- `prefix`: The prefix to be prepended to the randomly generated asset name.
- `access`: The access control of the asset. `public` is the default.
- `headers`: The HTTP headers of the asset when it is retrieved.
- `headers.content-type`: The Content-Type header. `application/octet-stream` is the default.
- `headers.content-disposition`: The Content-Disposition header.
- `headers.content-encoding`: The Content-Encoding header. The developer must make sure the asset is compressed in the given compression.
- `headers.content-length`: The Content-Length header. It is required.
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
    "asset_name": { "type": "string" },
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
    }
  },
  "required": ["asset_name", "url", "method", "headers"]
}
```

- `asset_name`: The asset name. It becomes valid when the asset is uploaded.
- `url`: The presigned URL to upload the asset.
- `method`: The method to be used in the upload request.
- `headers`: The headers to be included in the upload request.

##### Response Example

```json
{
  "asset_name": "428b11b6-7e92-4517-a9d3-ca9beff04641.png",
  "url": "https://storage.skygearapps.com/bucket/myappid/428b11b6-7e92-4517-a9d3-ca9beff04641.png?...",
  "method": "POST",
  "headers": [
    { "name": "content-type", "value": "image/png" }
  ]
}
```

#### Server Specification

1. Let `ext` be an empty string.
1. If `headers.content-type` is present, set `ext` to the file extension derived from it.
1. Let `name` to be the concatenation of `prefix`, a random string and `ext`. Set `headers.cache-control` to `max-age: 3600` if it is absent.
1. Let `asset_id` be `<app-id>/<name>`.
1. Remove any header in `headers` whose value is empty string.
1. Ensure `asset_id` does not exist.
1. Let `url` be the presigned URL.
1. Return the presigned request.

### POST /_asset/presign_upload_form

#### Description

This endpoints returns a presigned `multipart/form-data` request which can be used to upload an asset.

This endpoint requires (API Key and authenticated user) or Master Key.

#### Request JSON Schema

```json
{
  "type": "object",
  "additionalProperties": false
}
```

##### Request Example

```json
{}
```

#### Response JSON Schema

```json
{
  "type": "object",
  "properties": {
    "url": { "type": "string" },
  },
  "required": ["url"]
}
```

- `url`: The presigned URL to POST the form.

##### Response Example

```json
{
  "url": "https://myapp.skygearapps.com/_asset/upload_form?..."
}
```

#### Server Specification

1. Return a [signed URL](#signed-url).

### POST /_asset/upload_form

This endpoint requires valid signature.

This endpoint accepts `multipart/form-data` and returns `application/json`.
It should not be used directly as `<form action>` because the user will see
a plain JSON document. It is expected to use `FormData` and AJAX to use this endpoint.

#### Request

The request must be a `multipart/form-data` request with `Content-Length`.

The form can have the following form fields to specify the properties of the asset.

- `prefix`: The prefix to be prepended to the randomly generated asset name.
- `access`: The access control of the asset. `public` is the default.

The form can have the following form fields to set headers.

- `content-type`: Override the Content-Type header of `file`.
- `content-disposition`: The Content-Disposition header.
- `content-encoding`: The Content-Encoding header.
- `content-md5`: The Content-MD5 header.
- `cache-control`: The Cache-Control header.
- `access-control-allow-origin`: CORS header.
- `access-control-expose-headers`: CORS header.
- `access-control-max-age`: CORS header.
- `access-control-allow-credentials`: CORS header.
- `access-control-allow-methods`: CORS header.
- `access-control-allow-headers`: CORS header.

The name of the last field must be `file`.

#### Response JSON Schema

```json
{
  "type": "object",
  "properties": {
    "asset_name": { "type": "string" },
  },
  "required": ["asset_name"]
}
```

- `asset_name`: The asset name.

##### Response Example

```json
{
  "asset_name": "428b11b6-7e92-4517-a9d3-ca9beff04641.png"
}
```

#### Server specification

1. Validate the signature
1. Ensure media type is `multipart/form-data`.
1. Ensure `Content-Length` exists.
1. Infer the content length of `file` while parsing the form.
1. Presign a PUT Object request.
1. Reverse proxy the request as a PUT Object request.

### POST /_asset/get_signed_url

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
          "asset_name": { "type": "string" }
        },
        "required": ["asset_name"]
      }
    }
  },
  "required": ["assets"]
}
```

- `asset_name`: The asset name.

##### Request Example

```json
{
  "assets": [
    { "asset_name": "428b11b6-7e92-4517-a9d3-ca9beff04641.png" }
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
          "asset_name": { "type": "string" },
          "url": { "type": "string" }
        },
        "required": ["asset_name", "url"]
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
      "asset_name": "428b11b6-7e92-4517-a9d3-ca9beff04641.png",
      "url": "https://myappname.skygearapps.com/_asset/428b11b6-7e92-4517-a9d3-ca9beff04641.png?..."
    }
  ]
}
```

#### Specification

1. Sign each `asset_name` in `assets`.
1. Return the result in the original order.

### GET /_asset/get/<asset_name>

#### Request Query String

The asset is eligible for image processing if all of the following hold

- The asset is less than or equal to 20MiB.
- The asset is detected to be PNG, JPEG or WebP.

#### Specification

1. If the image processing query is present, remove the header `Range` and `If-Range` in the request.
1. Reverse proxy the request to the origin server.
1. Process the asset if the image processing query string is present and the asset is eligible for image processing.
1. If the image processing query is present, set the header `Accept-Ranges` in the response to `none`.
1. Set `Cache-Control`, `Vary`, `Expires` headers correctly.

### GET /_asset/assets

#### Description

This endpoint return a list of assets.

This endpoint requires Master Key.

#### Request Query String

- `pagination_token`: The token to retrieve the next page.
- `prefix`: The prefix of the asset name to match.

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
          "asset_name": { "type": "string" },
          "size": { "type": "integer" }
        },
        "required": ["asset_name", "size"]
      }
    },
    "required": ["assets"]
  }
}
```

- `pagination_token`: The token to retrieve the next page. If it is absent, there is no next page.
- `assets.asset_name`: The asset name.
- `assets.size`: The size of the asset.

##### Response Example

```json
{
  "pagination_token": "98e69a8413944dd21ea97e6c956a0a47ed135749bfb355bcb177c4333654c737",
  "assets": [
    {
      "asset_name": "428b11b6-7e92-4517-a9d3-ca9beff04641.png",
      "size": 12345
    }
  ]
}
```

### DELETE /_asset/delete/<asset_name>

#### Description

This endpoint deletes the given asset.

This endpoint requires Master Key.

Batch delete is not supported because only S3 supports batch delete.

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

If image processing query is present, range request is not supported.

## SDK API

```typescript
interface UploadAssetBaseOptions {
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

const assetName = await skygear.asset.upload(uri, {
  headers: {
    "content-type": contentType,
  },
});

// Associate the asset name with the current user.
```

### Upload avatar image on Web

```typescript
// Suppose we have the following DOM
// <input id="file" type="file" accept="image/jpeg, image/png">

const input = document.getElementById("file");
if (input.files[0] != null) {
  const file = input.files[0];
  const assetName = await skygear.asset.upload(file);
  // Associate the asset name with the current user.
}
```

### Resolve public asset in Microservice

```javascript
function resolvePublicAssetURL(req, assetName) {
  return `https://${req.host}/_asset/${assetName}`;
}

async function getMe(req, res) {
  const user = await getUser();
  const avatarURL = resolvePublicAssetURL(req, user.avatarAssetName);
  user.avatarURL = avatarURL;
  // Return user as response.
}
```

### Resolve private asset in Microservice

```javascript
import fetch from "node-fetch";

async function resolvePrivateAssetURL(req, assetName) {
  const endpoint = `https://${req.host}/_asset/sign`;
  const resp = await fetch(endpoint, {
    method: "POST",
    headers: {
      "x-skygear-api-key": process.env.SKYGEAR_MASTER_KEY,
    },
    body: JSON.stringify({
      "assets": [{ asset_name: assetName }],
    })
  });
  const j = await resp.json();
  return j["assets"][0].url;
}

async function getMe(req, res) {
  const user = await getUser();
  const avatarURL = await resolvePrivateAssetURL(req, user.avatarAssetName);
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

## Signed URL

See [Signed URL](./signed-url.md).

## Design Decisions

### Why custom asset name is not supported?

In a previous version of this specification, custom asset name is supported.
However, it has a flaw.

The presign upload endpoints only requires API Key and authenticated user.
Therefore, every user can overwrite/write any asset even if the asset is private.

We have the following solutions.

We can make asset write-once only. So it is impossible to overwrite an existing asset.
However, this effectively makes custom name asset not update-able and may defeat its original purpose.

We can change the presign upload endpoint requires Master Key.
However, this effectively makes all endpoints of the Asset Gear Master Key only.
The client SDK can no longer interact with the Asset Gear directly.
Having no client SDK for the Asset Gear makes the Asset Gear very difficult to use.

We can introduce hooks to allow the developer to participate in determining whether
a custom asset name is writable. However, implementing such hook is optional.
If it is not implemented, the Asset Gear still suffers from the original problem.

We can introduce ACL to the Asset Gear. We may have a role-based ACL gear(?) in the future.
Maybe we could integrate that with the Asset Gear.
However, at this moment, adding ACL to the Asset Gear would greatly complicate the scope of the Asset Gear.

Only the last solution could solve the problem but it is not feasible at this state.
Therefore custom asset name is not supported, at least for now.

If the developer wants to somehow identify uploaded assets, they can specify `prefix`.
For example, if the developer is uploading a profile image of a given user, they can specify
`prefix` as `profile-image-<user-id>-`.
The actual asset name would look like `profile-image-2583ac64-dbdd-45a0-9510-e0a3ee347a77-dbac1141-3c19-42bd-86d9-14baa10b0cc8.jpg`.
During listing, the developer can specify `prefix` as `profile-image-` to find out all assets which are profile image.
Or they can specify `prefix` as `profile-image-2583ac64-dbdd-45a0-9510-e0a3ee347a77-` to find out all profile images of that user.
