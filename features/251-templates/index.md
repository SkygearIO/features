# Templates

## Overview

Skygear has some features that require loading a template, such as sending email, sending SMS and rendering HTML.
This document introduces a new way to organize templates with localization support.

## Template

Each template must have a type, optionally a key and a language tag.

### Template Type

Each template must have a type. The list of types are predefined. Here are some examples

```
forgot_password_email.html
forgot_password_email.txt

user_verification_message.html
user_verification_message.txt
```

### Template Key

Some template may require a key. The key is used differentiate different instances of the same type of the template. For example, there is a template type `VerificationMessage`. Login ID key `email` and Login ID key `phone` usually should be different templates, as the former is an email message while the latter is SMS message.

```
templates/email/user_verification_message.html   # This is an HTML email template
templates/email/user_verification_message.txt    # This is an plaintext email template

templates/phone/user_verification_message.txt    # this is an SMS message template
```

### Template Language Tag

Each template may optionally have a language tag. The language tag is specified in [BCP47](https://tools.ietf.org/html/bcp47).

## Template resolution

To resolve a template, the input is the template type, optionally the template key and finally the user preferred languages. The type and key is determined by the feature while the user preferred languages is provided by the user.

All templates have default value so template resolution always succeed.

The templates are first resolved by matching the type and the key. And then select the best language according to the user preferred languages.

## Component templates

Some template may depend on other templates which are included during rendering. This enables customizing a particular component of a template.

For example, `auth_ui_login.html` depend on `auth_ui_header.html` and `auth_ui_footer.html` to provide the header and footer. If the developer just wants to customize the header, they do not need to provide customized templates for ALL pages. They just need to provide `auth_ui_header.html`.

## The `templates` directory next to `skygear.yaml`

The developer organizes their templates in the `templates` directory next to `skygear.yaml`.

The templates must be organized in the following way in order to be recognized.

```
templates[/<language-tag>][/<key>]/<type>
```

### Examples

#### Example 1

```
templates/welcome_email.txt
templates/welcome_email.html

templates/forgot_password_email.txt
templates/forgot_password_email.html

templates/forgot_password_reset.html
templates/forgot_password_success.html
templates/forgot_password_error.html

templates/user_verification_general_error.html

templates/email/user_verification_message.txt
templates/email/user_verification_message.html
templates/email/user_verification_success.html
templates/email/user_verification_error.html

templates/phone/user_verification_message.txt
templates/phone/user_verification_success.html
templates/phone/user_verification_error.html
```

Given the above hierarchy, the following templates are recognized:

- Plain text and HTML Welcome email
- Plain text and HTML Forgot Password email
- Reset, success and error HTML page of resetting password
- General error HTML Page of User Verification
- Plain text and HTML verification email of login ID `email`
- SMS verification message of login ID `phone`

#### Example 2

```
templates/welcome_email.txt
templates/welcome_email.html

templates/zh-Hant/welcome_email.txt
templates/zh-Hant/welcome_email.html

templates/zh-Hans/welcome_email.txt
templates/zh-Hans/welcome_email.html

templates/ja/welcome_email.txt
templates/ja/welcome_email.html
```

Given the above hierarchy, the developer provides:

- Plain text and HTML Welcome email without language tag, which is the fallback
- Plain text and HTML Welcome email in Traditional Chinese
- Plain text and HTML Welcome email in Simplified Chinese
- Plain text and HTML Welcome email in Japanese

## Integration with skycli

### `skycli app list-templates`

It lists the remote templates. That is, the templates that are previously uploaded.

#### Sample Output

```
templates/welcome_email.txt
templates/welcome_email.html
```

### `skycli app update-templates [-y]`

It updates the remote templates such that the remote templates is identical to the local hierarchy.

New local templates will be added.

Deleted local templates will be removed.

Changed local templates will be updated.

Unchanged local templates will not be uploaded again.

The `-y` option skips the confirmation.

#### Sample Output

```
Templates to be added:
    templates/zh-Hant/welcome_email.txt
    templates/zh-Hant/welcome_email.html

Templates to be removed:
    templates/zh-Hans/welcome_email.txt
    templates/zh-Hans/welcome_email.html

Templates to be updated:
    templates/ja/welcome_email.txt
    templates/ja/welcome_email.html

Unchanged templates:
    templates/welcome_email.txt
    templates/welcome_email.html

Continue? ([y]/n)
```

### `skycli app download-templates [-d <dir>] [-y]`

It download the remote templates to `<dir>`. `<dir>` is `./templates` by default.

If any file is going to be overwritten, it shows a prompt to warn the developer which files will be overwritten.

The `-y` option skips the prompt.
