# Static Asset CDN

## Architecture

### Network Diagram

[![](https://mermaid.ink/img/eyJjb2RlIjoiZ3JhcGggVERcbiAgSU5FVFtDbGllbnRzXSAtLT58Q3VzdG9tIERvbWFpbnwgQ0ROXG4gIElORVQgLS0-IHxEZWZhdWx0IERvbWFpbnwgSUdcbiAgQ0ROW0NETiBOZXR3b3JrXSAtLT4gSUdcbiAgSUdbSW5ncmVzc10gLS0-IEdXe0dhdGV3YXl9XG4gIEdXIC0tPnxzdGF0aWN8IE9bT2JqZWN0IFN0b3JhZ2VdXG4gIEdXIC0tPnxodHRwLXNlcnZpY2V8IE1bTWljcm8tc2VydmljZXNdXG5cdFx0IiwibWVybWFpZCI6eyJ0aGVtZSI6ImRlZmF1bHQifX0)](https://mermaid-js.github.io/mermaid-live-editor/#/edit/eyJjb2RlIjoiZ3JhcGggVERcbiAgSU5FVFtDbGllbnRzXSAtLT58Q3VzdG9tIERvbWFpbnwgQ0ROXG4gIElORVQgLS0-IHxEZWZhdWx0IERvbWFpbnwgSUdcbiAgQ0ROW0NETiBOZXR3b3JrXSAtLT4gSUdcbiAgSUdbSW5ncmVzc10gLS0-IEdXe0dhdGV3YXl9XG4gIEdXIC0tPnxzdGF0aWN8IE9bT2JqZWN0IFN0b3JhZ2VdXG4gIEdXIC0tPnxodHRwLXNlcnZpY2V8IE1bTWljcm8tc2VydmljZXNdXG5cdFx0IiwibWVybWFpZCI6eyJ0aGVtZSI6ImRlZmF1bHQifX0)

### CDN-enabled Custom Domain Flow

[Graph](https://mermaid-js.github.io/mermaid-live-editor/#/edit/eyJjb2RlIjoic2VxdWVuY2VEaWFncmFtXG4gICAgcGFydGljaXBhbnQgREVWIGFzIERldmVsb3BlclxuICAgIHBhcnRpY2lwYW50IEROUyBhcyBETlNcbiAgICBwYXJ0aWNpcGFudCBDVFJMIGFzIENvbnRyb2xsZXJcbiAgICBwYXJ0aWNpcGFudCBDRE4gYXMgQ0ROIFByb3ZpZGVyXG4gICAgcGFydGljaXBhbnQgSzhTIGFzIEt1YmVybmV0ZXNcbiAgICBERVYtPj4rQ1RSTDogQWRkIGN1c3RvbSBkb21haW5cbiAgICBDVFJMLT4-K0NETjogUHJvdmlzaW9uIENETiByZXNvdXJjZXNcbiAgICBDRE4tPj4tQ1RSTDogQ05BTUUgcmVjb3JkXG4gICAgQ1RSTC0-Pi1ERVY6IFZlcmlmaWNhdGlvbiBjaGFsbGVuZ2UgKEEvQ05BTUUgJiBUWFQgcmVjb3JkKVxuICAgIERFVi0-PkROUzogVXBkYXRlIEROUyBSZWNvcmRcbiAgICBERVYtPj4rQ1RSTDogVHJpZ2dlciB2ZXJpZmljYXRpb25cbiAgICBDVFJMLT4-RE5TOiBWZXJpZnkgRE5TIHJlY29yZHNcbiAgICBDVFJMLT4-SzhTOiBDcmVhdGUgSW5ncmVzcyAmIFByb3Zpc2lvbiBUTFMgQ2VydFxuICAgIEs4Uy0-PkNUUkw6IFRMUyBDZXJ0XG4gICAgQ1RSTC0-PkNETjogU3luY2hyb25pemUgVExTIENlcnRcbiAgICBDVFJMLT4-LURFVjogQ3VzdG9tIGRvbWFpbiBpcyByZWFkeSIsIm1lcm1haWQiOnsidGhlbWUiOiJkZWZhdWx0In19)

## CDN Provider

For simplicity, we will only support GCP Cloud CDN at the moment.

*For the record, CloudFlare only allows up to 20 domains per account.*

## TLS Termination

To use HTTPS with CDN, we will need to terminate TLS connection at CDN network.
The cluster controller would synchronize the TLS certificates in k8s cluster
to provider-specific certificate store.

## Supported Domain

For some providers, it takes non-trivial time to provision a CDN-enabled domain.
Since we do not use wildcard domains, enabling CDN for default domain would
cause considerable delay in app creation due to CDN provisioning. Therefore,
we only enable CDN on added custom domain.

When custom domain is added, the cluster controller would provision required
CDN resources before providing verification instruction (with DNS records) to
developers.

## Considerations

### Traffic Cost

Since supported providers is limited, it is possible that there exists some
clusters where the CDN network and cluster network is of different
providers. In this case, the traffic cost need to be considered, since
inter-network traffic is usually billed.

### Wildcard Domains & Certificates

Some providers support wildcard domains & TLS certificates. This allows reduced
provider-specific logic in cluster controller. However, it is not used for
following reasons:
- AWS CloudFront use path as cache key per distributions. This means we cannot
  use single distribution for all tenant domains.
- Azure does not support wilcard domains / TLS certificates.
- CloudFlare requires enterprise subscription to use CDN with wildcard domain.

### Provider-specifc Network Architecture
For AWS CloudFront, we will provision a Distribution for each custom domain.
All provisioned Distribution would have the gateway as origin server.
Custom domains would have a CNAME record points to the Distribution domain.

For GCP Cloud CDN, we will provision a CDN-enabled load balancer every 15
domains, since each load balancer can serve at most 15 TLS certificates.
The provisioned load balancer would have the gateway as upstream server.
Custom domains would have a A record points to the load balancer.

> GCP allows at most 30 HTTPS proxy & 30 TLS certificates per project.
> Each active GCE load balancer incurs an hourly charge.

For Azure CDN, we will provision a CDN Profile for the whole cluster, and an
Endpoint for each custom domain.
All provisioned Endpoints would have the gateway as origin server.
Custom domains would have a CNAME record points to the Azure CDN endpoint.

Some CDN requires the domain DNS to use CNAME record to point to CDN endpoint.
However, root domain cannot use CNAME records, and support for DNS Alias is not
consistent across providers. Therefore:
- For root domain, an A record pointing to gateway would be provided,
  and CDN cannot be enabled.
- For subdomains, a CNAME record would be provided, and CDN would be used.

Developers are advised to redirect users to from root domain to a
`www` subdomain in order to use CDN.

CDN-managed certificates are not used. Instead, TLS certificates are
provisioned by the controller, and synchronize to CDN certificate store.
