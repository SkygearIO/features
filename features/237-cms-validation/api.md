# CMS Validation

## Requirements

- Prevent cms user from entering invalid data.
- Allow developer to use common and customisable validation in cms config on field level and form level.
- Display error message, which can be defined in config, for invalid data.

## Common Use Cases

- Non empty text input.
- Text input with max length.
- Text input with certain pattern, e.g. credit card number.
- Number or datetime input value within range.
- One field cannot be empty if another field is not empty.

## Overview

- Validation is a process that evaluate data with an expression, the result is either success or failure.
- Validation can be defined in record edit page and new page in cms config.
- Validation happens after use click save button and before all server api calls are fired.
- If any validation result is failure, error message should be displayed and no server api calls should be fired.
- Error message of field validation appears next / below the field, while that of form validation appears below the form.
- Field validation is executed before form validation.

## Configuration

- One validation item is a dictionary which contains the validation configuration (depends on where it is placed).
  - Each validation optionally contains a `message` field, which would be the error message if that validation item cannot pass.
  - Otherwise, a default error message would be shown.
- `validation` may be a validation item or contains a list of validation items.

```
new:
  # page validation
  validation:
    - expression: xxx
    - expression: xxx
  fields:
    - name: xxx
      type: xxx
      # field validation
      validation:
        pattern: /^xxx$/
        message:
```

## Expression

- `expression` is the base type of validation, supported by all validation.
- An expression is a string, which can be evaluated to give boolean value.
- All other types of validation are predifined expression, i.e. they are all compiled to expression at runtime.
- Expression evaluation would be based on this library https://github.com/joewalnes/filtrex, while CMS would provide extra predefined functions for common use case.

### Functions

- Passing wrong data type to the function would throw error in validation.

### Expression context: `value`

Developer uses the variable `value` in the expression to get the value from the field or form.

- Field validation
  - `value`: value of the field
  - e.g. `value in ('abc', 'def')`
- Form validation
  - `value`: value of the form
  - `get(value: formValue, fieldName: string)`
  - e.g. `get(value, "full_name") != get(value, "nick_name")`

#### Predefined functions

- String
  - `length(value: string)`
  - `upper(value: string)`
  - `lower(value: string)`
  - `substring(value: string, from: number, to: number)`
- Number
- Datetime
  - `datetime(str: string)`
  - `timestamp(data: datetime | string)`
    - e.g. `timestamp(value) > timestamp('2018-01-01')`
- JSON
  - `get(data: json, key: string | number)`
    - return the value at key
    - e.g. `get(get(value, "a"), "b")`, `{"a": {"b": 1}}` => `1`
    - e.g. `get(get(value, "a"), 0)`, `{"a": [1]}` => `1`
  - `hasKey(data: json, key: string | number)`
    - return if the key exist
- Location
- References
  - `length(value: reference[])`
- EmbeddedReference
  - `get(data: embeddedReference, key: string)`
- EmbeddedReferences
  - `length(value: embeddedReference[])`
  - `get(data: embeddedReference[], index: number)`
- Asset
  - `size(value: asset)`

## Predefined validation for field validation

### `required`

types: `String`, `Datetime`, `References`, `EmbeddedReferences`, `Asset`

```
validation:
- required: true
# String / References / EmbeddedReferences equivalent to
- expression: length() > 0
# Datetime / Asset equivalent to
- expression: value != null
```

Note that, `required: false` is no-op.

### `pattern`

types: `String`

```
validation:
- pattern: /xxx/
# equivalent to
- expression: value ~= /xxx/
```

### Comparisons

types: `String`, `Number`, `Datetime`

- `EqualTo`
- `NotEqualTo`

types: `Number`, `Datetime`

- `LessThan`
- `LessThanOrEqualTo`
- `GreaterThan`
- `GreaterThanOrEqualTo`

```
validation:
- GreaterThan: 2018-01-01
```
