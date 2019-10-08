# Templates

## Overview

Skygear has many features to send message where message is either email or SMS.
Some features like Forgot Password allows the developer to customize the HTML page.
This document introduces a new way to organize templates with localization support.


## Template

The template is represented by the following struct

```golang
type TemplateConfiguration struct {
  Type        string
  LanguageTag string
  Key         string
  // The following fields are not user-facing.
  // URI         string
  // ContentMD5  string
}
```

### Template Type

Each template must have a type. The type identifies how the template is used by Skygear.

The following listing is the initially defined types.

```golang
type TemplateConfigurationType string
const (
  TemplateConfigurationTypeForgotPasswordEmailTXT             TemplateConfigurationType = "forgot_password_email.txt"
  TemplateConfigurationTypeForgotPasswordEmailHTML            TemplateConfigurationType = "forgot_password_email.html"
  TemplateConfigurationTypeForgotPasswordResetHTML            TemplateConfigurationType = "forgot_password_reset.html"            // Keep URL option
  TemplateConfigurationTypeForgotPasswordSuccessHTML          TemplateConfigurationType = "forgot_password_success.html"          // Keep URL option
  TemplateConfigurationTypeForgotPasswordErrorHTML            TemplateConfigurationType = "forgot_password_error.html"            // Keep URL option
  TemplateConfigurationTypeWelcomeEmailTXT                    TemplateConfigurationType = "welcome_email.txt"
  TemplateConfigurationTypeWelcomeEmailHTML                   TemplateConfigurationType = "welcome_email.html"
  TemplateConfigurationTypeUserVerificationGeneralErrorHTML   TemplateConfigurationType = "user_verification_general_error.html"  // Keep URL option
  TemplateConfigurationTypeUserVerificationMessageTXT         TemplateConfigurationType = "user_verification_message.txt"
  TemplateConfigurationTypeUserVerificationMessageHTML        TemplateConfigurationType = "user_verification_message.html"
  TemplateConfigurationTypeUserVerificationSuccessHTML        TemplateConfigurationType = "user_verification_success.html"        // Keep URL option
  TemplateConfigurationTypeUserVerificationErrorHTML          TemplateConfigurationType = "user_verification_error.html"          // Keep URL option
)
```

### Template Language Tag

Each template may optionally have a language tag. In the future, we may support sending localized message. The language tag is specified in [BCP47](https://tools.ietf.org/html/bcp47).

### Template Key

If the developer has configured `email` and `secondary_email` as login IDs. User Verification supports verifying both with different templates. Therefore, `key` is required to differentiate different instances of the same type of the template.

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

## Language Tag Matching

The matching is done by the package `"golang.org/x/text/language"`.

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
