# CMS import and export

## Use case

- Export data of a table (or tables) to a file for data analysis.
- Import new data from a file.
- Export data to a file, update the file and import the updated data.
- Developer may specify what can be exported and imported with a config file(s), or with the existing cms config file.
  - Working with access control for cms, developer may also want to have different import and export config for different roles.
- Apply filter when export data.

## Requirements

### Config

- Add record list action
  - add key `actions` to record list config
  - for each action item
    - the client should render a button
    - there must be a `type` value
    - value of other keys in the item depend on the type
- Add record list action, type: import, export

#### Spec

```
records:
  {record-type}:
    list:
      actions:
        # Import
        - type: import
          name: {import-name}
          label: {import-display-name}
          reference_handling: {use-first|throw-error} (Naming TBD, details see below)
          identifer: {field.name|_id}
          fields:
            # normal fields
            - name:
              label: (default to name)

            # reference
            - name:
              label: (default to name)
              reference_target:
              reference_field_name:

        # Export
        - type: export
          name: {export-name}
          label: {export-display-name}
          fields:
            # normal fields
            - name:
              label: (default to name)
              format: (Optional)

            # reference fields
            - name:
              label: (default to name)
              format: (Optional)
              reference_target:
              reference_field_name:
              reference_back_reference: (Required for one-to-many with id in referenced record type)
              reference_via_association_records: (Required for many-to-many)

        - type: export
          name: {export-name}
          label: {export-display-name}
          for_import: {import-name}
```

Keys:

- import-name
  - import page route name
  - reference for export, to generate a export config for this import
- import-display-name
  - import button text
  - import page(s) title
- export-name
  - export page route name
- export-display-name
  - export button text
  - export page(s) title

#### Field serialisation and deserialisation

Operation:
- Import: String value -(serialisation)-> typed data -(save)-> Skygear server
- Export: String value <-(deserialisation)- typed data <-(query)- Skygear server

In import / export field config, there is no need to specify the type. Instead, server needs to know how to transform between skygear data and string.

##### Type-Format mapping

Server perform (de)serialisation based on a format, and for each Skygear data type, there is a list of supported format.

<table>
  <thead>
    <tr>
      <th>Skygear Types</th>
      <th>Format</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>String</td>
      <td>String</td>
    </tr>
    <tr>
      <td>Number</td>
      <td>Number</td>
    </tr>
    <tr>
      <td>Boolean</td>
      <td>
        <ul>
          <li>True/False (Default)</li>
          <li>Yes/No</li>
          <li>1/0</li>
        </ul>
      </td>
    </tr>
    <tr>
      <td>JSON</td>
      <td>JSON</td>
    </tr>
    <tr>
      <td>Datetime</td>
      <td>
        <ul>
          <li>YYYY-MM-DD hh:mm:ss (Default)</li>
          <li>DD-MM-YYYY</li>
          <li>MM-DD-YYYY</li>
          <li>...</li>
        </ul>
      </td>
    </tr>
    <tr>
      <td>Location</td>
      <td>
        <ul>
          <li>lat-lng Coordinate (Default)</li>
          <li>Address Input?</li>
        </ul>
      </td>
    </tr>
  </tbody>
</table>

##### Import

###### Auto detect format

**See section below for datetime serialisation**

Given skygear server db schema and string value, in most cases, except datetime, server can detect the format and serialise it to an object that is ready for saving to Skygear server.

##### Export

###### Case 1: format unspecified, i.e. default format

If the format is not specified in field config, server would deserialise the data with a default format of the data type.

###### Case 2: format specified

If the format is specified in field config, there may be a chance that the format does not match the type of data queried from Skygear server.

Server can detect the error as early as parsing the configuration by fetching the schema from Skygear server.

##### Datetime format

Since there are too many possible format for datetime, for simplicity, server would not detect the format for import. Instead it would use a default format, or specified format in field config to serialise the data.

##### Format for export with `for_import`

The expected behaviour of export and import for this case should be:
- cms user can should be able to follow the format exported data and update the data
- if the value is unchanged after export, importing should not change the data in server

If format is not specified in import field config, format for export is the default format of the data type.

Otherwise, the export format should be the same as the import format.

#### Example

```
site:
  - type: Record
    name: user
    label: User
records:
  user:
    list:
      fields: (skip)
      filters:
        - name: email
          type: String
          label: Email
        - name: _created_at
          type: DateTime
          label: Created at
      actions:
        - type: import
          label: Import Users
          name: import-users
          fields:
            - name: _id
            - name: name
            - name: email
            - name: country
              label: Country
              reference_target: country
              reference_field_name: _id
            - name: self_info
              type: JSON
              label: Self information
        - type: export
          name: export-users
          label: Export Users
          fields:
            - name: _updated_at
            - name: email
            - name: country
              label: Country Name
              reference_target: country
              reference_field_name: name
        - type: export
          name: export-users-for-import
          label: Export Users For Import
          for_import: import-users
```

#### `for_import`

```
records:
  user:
    list:
      fields: (skip)
      actions:
        - type: import
          label: Import Users
          name: import-users
          fields:
            - name: _id
            - name: name
            - name: email
            - name: birthday
              format: MMDDYYYY
        - type: export
          name: export-users-for-import
          label: Export Users For Import
          for_import: import-users
```

is equivalent to

```
records:
  user:
    list:
      fields: (skip)
      actions:
        - type: import
          label: Import Users
          name: import-users
          fields:
            - name: _id
            - name: name
            - name: email
            - name: birthday
              format: MMDDYYYY
        - type: export
          name: export-users-for-import
          label: Export Users For Import
          fields:
            - name: _id
            - name: name
            - name: email
            - name: birthday
              format: MMDDYYYY
```

### Import-specific

#### Types

The type means the one fetched from skygear server.

Supported types:
- `_id`
- String
- Number
- Boolean
- JSON
- Datetime
- Location
- Reference

Unsupported types:
- `_created_at` and `_updated_at`
- Asset

#### Identifier

Since importing data can mean add new record or update exisiting record, there must be an identifier for each record.

The behaviour is the same as Skygear save record API:
- if no `_id` is provided
  - a new record will be created, and value of `_id` would be generated by server
- if `_id` is specified
  - if the `_id` value is found on another record
    - record with the `_id` will be updated
  - if the `_id` value is not found
    - a new record will be created

#### Import behaviour

The import API would iterate through items in the file and save them to server. The operation is non-atomic, i.e. for one API call, some records may be saved successfully while some may not.

If there are multiple items that share the same identifier, only one of them are effectively saved to the server.

#### Custom identifier for Record

`_id` is the unique identifier for skygear records but this is most likely not human readable.

Developer can use another key as the identifier of the record type, by setting `identifer` in the import config.

If not specified, `_id` would be used as the identifier.

##### Custom identifier matching

Assume that:
- CMS config specifies `name` as the identifier for Record Type A.
- `name` is not unique, i.e. there might be more than two records that has the same value for its `name`.

Handling:
- CMS is required to query records by the `name` first.
- If more than one records found
  - `use-first`: choose one of the record
    - Cms would update one of the record.
  - `throw-error`: consider error, and that record would be ignored

The two strategies can be configured in the import config, default is `use-first`.

#### Importing Reference

Developer can use another key as the identifer of the foreign record type. Change of value to the identifier would change the reference.

Spec:
- There can only be one field item for the same target in the same import config. And that field item would be the identifier of the foreign record type.
  - Changing field value of a referenced record is NOT supported.
- The field may or may not have unique constraints in the database.
- The following key must not present in the same field config:
  - `back_reference`
  - `via_association_record`

##### Custom identifier matching

Assume that:
- CMS config specifies Record Type A has a column `B.name` that reference the name of Record Type B.
- `B.name` is not unique, i.e. there might be more than two records that has the same value for its `name`.

Handling:
- CMS is required to query records by `B.name`
- If more than one records found, e.g. B1 and B2 are found
  - `use-first`: choose one of the record, e.g. B1
    - Cms would save the record A with a reference to B1
  - `throw-error`: consider error, and that record would be ignored

The two strategies can be configured in the import config, default is `use-first`.

This behaviour is the same for custom identifier for record.

#### Empty value handling

- String
  - Set value to empty string
- Others
  - Set value to `NULL`

### Export-specific

#### Types

The type means the one fetched from skygear server.

Supported types:
- `_id`
- `_created_at` and `_updated_at`
- String
- Number
- Boolean
- JSON
- Datetime
- Location
- Reference

Unsupported types:
- Asset

#### NULL value handling

The block would be empty.

If the string value of a record field is `NULL` and a user export and import that record, the value would become empty string.

#### Exporting Reference

- One-to-one / One-to-many with reference in the record
  - Get the value from transient.
- One-to-many with `back_reference` and Many-to-many with `via_association_record`
  - *`back_reference` not implemented yet.*
  - Array of value would be rendered in one block, with comma (,) separating values of each record.

##### Example (Many-to-many)

Records:

Table A

|`_id`|name|
|---|---|
|1|A1|

Table B

|`_id`|name|
|---|---|
|1|B1|
|2|B2|

Table A_B

|A_id|B_id|
|---|---|
|1|1|
|1|2|

Config:
```
records:
  A:
    (skip)
    import:
      - (skip)
        fields:
          - type: _id
          - name: name
            type: String
          - name: b_name
            label: B name
            type: Reference
            target: B
            displayFieldName: name
            via_association_record: A_has_B
association_records:
  A_has_B:
    fields:
      - name: A_id
        type: Reference
        target: A
      - name: B_id
        type: Reference
        target: B
```

Result:

|`_id`|name|B name|
|---|---|---|
|1|A1|"B1","B2"|

### Web interface

- Add import buttons in record list page
  - For each import config item, the UI will show two items,
    - Import button -> show file picker
    - Download import template button
- Add import result page
  - display success count
  - display error count and details
- Add export buttons in record list page
- Add export page
  - add filters

### Cms plugin

Plugin would add new handler for import and export.

#### Import

Input: multipart

|name|type|description|
|---|---|---|
|import_name|String|match the one in config file|
|file|File|file containing data to be imported, supported format: csv, xls|

Output: json

```
{
  "result": [{
    // result type for this imported record
    "type": Enum("record"|"error"),

    // record: record data
    // error: error object
    "data": { [record object] }
  }],
  "result_count": Integer
}
```

#### Export

Input: json

```
{
  // export file format
  "format": Enum("csv"|"xls"),

  // export config, match the name in config file
  "export_name": String

  // filter to be applied for this export request
  "filter": [ Skygear filter object ]
}
```

Output: file

Example config:
```
fields:
  - type: _updated_at
  - name: email
    type: String
  - name: country
    type: Reference
    label: Country
    target: country
    displayFieldName: name
    via_association_record
```

Example output

|`_updated_at`|email|country|
|---|---|---|
|2006-01-02T15:04:05Z|aaa@oursky.com|Japan|
|2006-01-02T15:04:05Z|bbb@oursky.com|India|

#### Error handling

The import API would return error object for items that are unable to be saved to the server.

To provide meaningful information for the user when error occured, the error object would include the line number of the items that are failed to save and the error description. And the CMS UI should display the error in the import result page.
