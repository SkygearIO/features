# CMS import and export

## Use case

- Export data of a table (or tables) to a file for data analysis.
- Import new data from a file.
- Export data to a file, update the file and import the updated data.
- Developer may specify what can be exported and imported with a config file(s), or with the existing cms config file.
  - Working with access control for cms, developer may also want to have different import and export config for different roles.
- Apply filter when export data.

## Requirements

### Import config

- Specify what fields can be imported.
  - fields not in importable fields will be ignored when import
  - auto generate an export config that is ready for import
- Import strategy for empty value
  - set null if data is empty
  - ignore if data is empty
- Reference cannot be imported

### Export config

- Configure export buttons
  - name
  - display name
  - fields
- Specify what fields can be filtered when export data.

### Web interface

- Add import page
  - select import type
- Add import result page
  - success
  - error
- Add export buttons to record list page
- Add export page
  - add filters

### Cms plugin

- Support import format
  - csv, xls
- Support export format
  - csv, xls
- Provide API for export
- Provide API for parsing file for import
  - Return a json, ready for import
- Provide API for import
- One-to-many and many-to-many handling
  - back_ref: one-to-many
  - association_records: many-to-many
  - only export, no import

## Discussion

- Custom unique key
  - _id is the unique identifier for skygear records
  - but this is most likely not human readable
