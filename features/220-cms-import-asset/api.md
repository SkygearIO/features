*Things started with (Possibly) are related but can be separate features.*

# User Requirement

- Allow cms user to upload file from the CMS.
- In the csv, the value of asset field would be the file name of uploaded files or asset id.

# Overview

### New page for file upload

- New page for cms user to upload file(s) to Skygear. A link to the page can be added to the side bar of the CMS.
- The page supports file upload, download and listing.
- CMS Plugin maintains the files with a special record type.
  - When CMS user upload a file in the page, the server would save a record of this record type, which is a mapping of file name to skygear asset ID, e.g. `abc.jpg` or `folderA/folderB/abc.jpg` -> `pqocmponf-dbqohow-wlkdlbub-ansoidwhz-abc.jpg`
  - The file name is unique.
  - Assets created outside the CMS would not appear in this record.
  - (Possibly) The record contains tags for searching.

### Save record assets field when import

When importing records with csv,

- The value of asset field is either the file name or asset id.
- If the file name or asset id is not found, it would be treated as empty value, which would clear the old value of the original record.

# Use Case

### Import records with asset

1. CMS user creates a csv, fill the csv with record data. Columns for asset are filled with file name.
1. CMS user uploads the file in the page provided by CMS for file upload.
1. CMS user clicks the import button in the record list page.
1. CMS user select the csv, and wait for the import result.

# CMS Config

```
site:
  - type: ImportedFile
    label: xxx

file_import:
  enabled: true
```

# CMS UI Update

The file import page is basically a record list page, except no fields and actions customisations.

Here is the layout of the page.

*Note that, [label] are buttons.*

```
Imported File              [Upload files][Add Filters]

|File name                      |Uploaded At|Size    |
------------------------------------------------------
|FolderA/abc.jpg                |2018-01-01 |100 MB  |
|FolderA/def.png                |2018-01-01 |100 MB  |
|FolderB/001.pdf                |2018-01-01 |100 MB  |
|FolderB/002.pdf                |2018-01-01 |100 MB  |
|a.doc                          |2018-01-01 |100 MB  |
|b.doc                          |2018-01-01 |100 MB  |
```

- Each row is a link to download the file.
- Filters support `File name` `like`.
- `File name`, `Uploaded At` and `Size` are sortable.
- (Possibly) `FolderA/`, `FolderB/` can be grouped in folders like s3.
- (Possibly) Support delete, rename.

### Files upload

- There would be a pop up modal for files upload.

```
|--------------------------|
| Upload files             |
|--------------------------|
| [Select files]           |
| - 000.doc              x |
| - 001.jpg              x |
| - 002.pdf              x |
|                          |
|      [Continue] [Cancel] |
|--------------------------|
```

- The file upload would consist of three steps:
  - Create a CMS file record
    - If duplicated name is found at the time, the whole upload would be stopped and the CMS user can update the file name or cancel the upload
  - Upload files to skygear and get the asset id
  - Update the CMS file record with the asset id

### Folder upload

Support for folder upload seems to be limited in different browsers, I have try some and here is the result.

- https://jsfiddle.net/kevalpadia/vk6Ldzae/
  - `<input type="file" webkitdirectory mozdirectory />`
  - Works on chrome, safari, firefox.
  - But in chrome and firefox, only folder can be chosen, files cannot be chosen.
- https://wicg.github.io/directory-upload/index.html
  - Works on chrome and safari, but not firefox.

Alternative to support this feature, is to allow CMS user to enter a folder name when they upload the files.

For example, when uploading `001.jpg` and `002.jpg`,

- if CMS user does not enter a folder name, the file name would be `001.jpg` and `002.jpg`.
- if CMS user enters the folder name `FolderA`, the file name would be `FolderA/001.jpg` and `FolderA/002.jpg`.

# CMS Plugin Update

- Create new table `_cms_imported_file`.
  - Fields:
    - `id`: file path, e.g. `abc.jpg` or `folderA/folderB/abc.jpg`
    - `uploaded_at`
    - `size`
    - `asset`: skygear asset
