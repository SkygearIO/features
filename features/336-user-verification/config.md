# App Configuration

```yaml
user_verification:
    # Whether to initiate Verification Flow if a verifiable login ID is used
    # to sign up.
    # Optional. Default to false.
    auto_send_on_signup: true

    # The verification criteria used in Verification Flag Algorithm.
    # Optional. Can be 'any' or 'all'. Default to 'any'.
    criteria: any

    # Describes the list of keys of Verifiable Login IDs
    # Optional. Default to empty list.
    login_id_keys:
    -   # The login ID Key. Required.
        key: email
        # The generated Verification Code format.
        # Optional. Can be 'numeric' or 'complex'. Default to 'complex'.
        code_format: complex
        # The expiration time of generated Verification Code in seconds.
        # Optional. Default to 3600 (1 hour).
        expiry: 3600

        # The email message subject of verification message. Only used
        # for 'email' login ID type.
        # Optional.
        subject: Please verify your email to get started with Skygear
        # The sender email address of verification message. Only used for
        # 'email' login ID type.
        # Optional.
        sender: no-reply@skygear.io
        # The reply-to email address of verification message. Only used for
        # 'email' login ID type.
        # Optional.
        reply_to:

        # URL to redirect user to after successfully verified login ID in
        # built-in verification page. Leave empty if template should be used.
        # Optional. Default to empty string.
        success_redirect:
        # URL to redirect user to after failed to verify login ID in
        # built-in verification page. Leave empty if template should be used.
        # Optional. Default to empty string.
        error_redirect:
```

# Templates

## [login ID Key]/user_verification_sms.txt
Optional. SMS message text of the verification message.

## [login ID Key]/user_verification_email.txt
Optional. Plain text of the verification email message.

## [login ID Key]/user_verification_email.html
Optional. HTML of the verification email message.

## [login ID Key]/user_verification_success.html
Optional. HTML of the built-in verification success page.

## [login ID Key]/user_verification_error.html
Optional. HTML of the built-in verification failure page.
