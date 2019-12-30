# Custom domain

## Overview

Allow developer to setup custom domain for their application, basically following features will be supported.

- Allow developer to setup custom domain.
- Let's Encrypt certificate will be provided by default, certificate will be renew automatically.
- Developer can configure to use custom SSL certificates for their domain. They will need to update the certificates before it expires in this case.
- Support configure custom domain to serve the app or redirect to another domain.

## Use Cases

### Setup custom domain through skycli

1. Add custom domain

    ```sh
    $ skycli domain add www.example.com --app=myapp
    Added domain www.example.com successfully!

    Add following DNS records in your DNS provider.

    TYPE      HOST                     VALUE
    TXT       _skygear.example.com     5636486ffc5a4dfebf4a13f480bd9a95
    A         www.example.com          <ingress controller lb ip>

    After updating DNS records, run `skycli domain verify www.example.com` to verify domain.
    ```

1. Developer update the DNS records through their DNS provider.

1. Ask Skygear Cluster to verify the domain

    ```sh
    $ skycli domain verify www.example.com --app=myapp
    Success! You can now access your app through www.example.com.
    Your site may show a security certificate warning until the certificate has been provisioned.
    ```

1. (Optional) Setup custom certificate

    ```sh
    # Create tls secret
    $ skycli secret create myapp-tls --type=tls --cert=path/to/tls.cert --key=path/to/tls.key --app=myapp
    Success! Created secret myapp-tls

    # Update domain using custom certificates
    $ skycli domain update www.example.com --tls-secret=myapp-tls --app=myapp
    Success! Updated domain www.example.com

    # The domain is now using the custom certificate
    $ skycli domain list --app=myapp
    DOMAIN            VERIFIED         CUSTOM_CERT      REDIRECT        SSL_CERT_EXPIRY               CREATED_AT
    www.myapp.com     true             true             -               2020-11-26 20:00:00 +08:00    2019-11-26 18:00:00 +08:00
    ```

1. (Optional) Setup apex domain redirect to `www`.

    1. Repeat previous steps to add apex domain `example.com`.

    1. Setup redirect
        ```sh
        skycli domain update example.com --redirect-domain=www.example.com
        Success! Updated domain example.com


        $ skycli domain list --app=myapp
        DOMAIN            VERIFIED         CUSTOM_CERT      REDIRECT            SSL_CERT_EXPIRY               CREATED_AT
        www.myapp.com     true             true             -                   2020-11-26 20:00:00 +08:00    2019-11-26 18:00:00 +08:00
        myapp.com         true             false            www.myapp.com       -                             2019-11-26 18:00:00 +08:00
        ```

## Features Details

- `A` record is used for setting up DNS record, so both apex domain and subdomain can be supported.
- Developers only need to verify domain once for different subdomains in the same domain within an app.
  - If developer add multiple subdomains in the same domain at the same time, the verification `TXT` record value should be the same.
  - If there are verified domain records in the app, developer doesn't need to add the `TXT` for new subdomains in the same domain.

## APIs

See [skycli domain](../270-next-skycli/commands.md#skycli-domain).

## Future Enhancement

- Developers may update the DNS config after domain verified. Setup job to check domain periodically and take down invalid domain.
