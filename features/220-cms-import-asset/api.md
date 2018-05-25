# User Requirement

- Import records with skygear asset field
- Allow cms user to upload file from cms client, when importing records
- In the csv, the value of asset field would be the file name of uploaded files

# Overview

Summary of design decision here.

### Keep the cms import one single API call

Import feature for each project can be very different if we want to make a
cutomized cms for the client, due to the different work flow of the client and
the different target user.

At the current state, CMS provides the import function as a whole feature,
meaning if the client requires customization beyond what we provided, it is
likely the developer need to implement one from scratch themselves.

Thus I HIGHLY recommend to keep this feature as simple as possible.

The cms frontend would be responsible for uploading the files and create a
mapping of file name to asset id for server.

### Accept zip for assets upload

A more natural approach would be to allow cms user to select files to upload.
However, considering the behaviour of import that if the field value is empty,
it would replace the original value with null.

Think of this scenario, a cms user import a csv with some files first, then
the user make some changes to the csv without touching the asset field, if the
user does not upload the files again, the server would clear the previous value
of asset field, because the server cannot find the skygear asset.

So to match user expectation, the cms would require users to upload a single csv
or a zip file that contains all the files.

# UI Update

(The following does not mean the final design)

### Import button clicked

```
|--------------------------|
| Import                   |
|--------------------------|
| Upload a csv or zip file |
| here.                    |
|                          |
|                 Continue |
|--------------------------|
```

- The whole area of `Upload a csv or zip file` is a drag and drop file upload
  area.
- The `Continue` button is disabled now.

### After file uploaded

```
|--------------------------|
| Import                   |
|--------------------------|
| - xxx.csv                |
| - 001.jpg                |
| - 002.pdf                |
|                 Continue |
|--------------------------|
```

- The browser would unzip the file if needed.
  (Some js zip library: https://github.com/Stuk/jszip)
- The file list displays files to be uploaded.
- If a new file a dropped in the area, the file lists would be replaced with
  the new ones.
- The `Continue` button is enabled now.

### After continue button clicked

#### If files other than csv is found

```
|--------------------------|
| Import                   |
|--------------------------|
|                          |
|     Uploading Asset      |
|                          |
|                          |
|--------------------------|
```

- The browser uploads all other files to server as skygear asset.

#### After that

```
|--------------------------|
| Import                   |
|--------------------------|
|                          |
|     Importing Records    |
|                          |
|                          |
|--------------------------|
```

### Import success

```
|--------------------------|
| Import                   |
|--------------------------|
| XX records has been      |
| imported successfully.   |
|                          |
|                       OK |
|--------------------------|
```

### Import failure

```
|--------------------------|
| Import                   |
|--------------------------|
| (Error message(s))       |
|                          |
|                          |
|            Retry  Cancel |
|--------------------------|
```

- If retry is clicked, the modal would go back to first page, while the uploaded
  file would be kept.

# CMS Config

This update is **NOT** directly related asset import, but is important to the change
of server behaviour.

### Add `required` to import field

```
imports:
  import-name:
    fields:
      - name: fieldname
        required: true | false (default: false)
```

If a field is marked as `required`, the value is csv for that field cannot be
empty string.

Meaning:
- JSON field, empty object `{}`, empty array `[]` and `null` is allowed.

# Server Update

CMS Import API would be updated. *These are the new update.*

Input (formdata):
- files
- key
- import_name
- *asset_name_mapping {file_name: asset_id}*

Output (json):
- result: Array of Record or Error
- success_count: Integer
- error_count: Integer

Steps:
- *Scan through all values in record asset field, replace the value with
  asset_id found in `asset_name_mapping`.*
  - *If file name not found, the value would be empty.*
- *Scan through all values in all record fields, if the field is marked as
  required and the value is empty, the record would not be imported and mark
  as Error.*
- Proceed to the original import flow.
