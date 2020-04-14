# Custom domain

## Overview

Allow developer to setup custom domain for their application, basically following features will be supported.

- Allow developer to setup custom domain.
- Let's Encrypt certificate will be provided by default, certificate will be renew automatically.
- Developer can configure to use custom SSL certificates for their domain. They will need to update the certificates before it expires in this case.
- Support configure custom domain to serve the app or redirect to another domain.
- Support configure custom domain to be assigned to microservice or gears.

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
- After developer verified a domain, Skygear Cluster will verify the root domain by checking `TXT` record. Once the root domain is verified, the root domain will be added to that specific app. Developer will not need to add `TXT` record again for the new subdomains in that app. However, developer should keep the `TXT` record in DNS for future manual/periodic re-verification.
- Configure custom domain requires root domain ownership verification, so it is not supported if developer can control the subdomain only (e.g. free domain).
- If the provided DNS records other than `TXT` is not present during verification, a warning would be issued to remind developer of potential misconfiguration. If this is intentional, e.g. using CDN DNS records, the warning can be safely ignored.
- If the provided `A` record is not present, the custom domain would not be accessible directly. Instead, developer should configure reverse proxy (e.g. CDN) to direct traffic from custom domain to app default domain. The gateway would verify the forwarded host (i.e. custom domain) is valid.
- Let's Encrypt HTTP certificate would be issued only if the provided `A` record is present.

## Domain Assignment

Custom domain can be assigned to microservices or gears. By default, custom
domains are assigned to microservices. Developers can change assignment by
updating custom domain using `skycli`.

For example, suppose developer would like to have 2 custom domains:
- `my-app.com`: serve main app (i.e. microservice)
- `accounts.my-app.com`: serve auth service (i.e. auth gear)

Developer can add `my-app.com` and `accounts.my-app.com` as usual, then use
skycli to assign `accounts.my-app.com` to auth gear:
```
skycli domain update accounts.my-app.com --assign-to=auth
```

## Scenario

### Scenario 1: Using same root domain in 2 different apps

1. Developer adds `api.example.com` to `myapp1`, he will be requested to update the DNS with `A` record for `api.example.com` and `TXT` record for `_skygear.example.com`. After verification, `myapp1` will have
    1. Custom domain: `api.example.com`. (Can be viewed through `skycli domain list` command and portal)
    1. Root domain: `example.com`. (Store in backend only)
1. Developer adds `myapp1.example.com` to `myapp1`, only `A` record for `myapp1.example.com` will be checked. Since `myapp1` has root domain `example.com` verified.
1. Developer adds `myapp2.example.com` to `myapp2`, he will be requested to update the DNS with `A` record for `myapp2.example.com` and `TXT` record for `_skygear.example.com`. Since `myapp2` doesn't not verified root domain `example.com`. For developer who want to verify same root domain in multiple apps, they can append the values into the `TXT` record list.
1. Developer delete all domains in `myapp1`, the root domain `example.com` will also be removed. He will need to verify the domain again.

### Scenario 2: Two apps use the same custom domain

1. Developer adds `api.example.com` to `myapp1`.
1. Developer adds `api.example.com` to `myapp2`.
1. Developer completes verification in `myapp1`.
1. Since `api.example.com` is verified and used in `myapp1`, verifying `api.example.com` in `myapp2` will be rejected.

## APIs

See [skycli domain](../270-next-skycli/commands.md#skycli-domain).

## Future Enhancement

- Developers may update the DNS config after domain verified. Setup job to check domain periodically and take down invalid domain.
