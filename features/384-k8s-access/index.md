# Access to k8s

Instead of wrapping k8s APIs with skycli, we can generate a token to allow limited access to
k8s resources.

# Benefits

The developer can use kubectl and connect to the k8s API server directly.
kubectl is a very mature program and is known by many developers.

We can also avoid reimplementing features of kubectl.

# Authentication strategies of k8s

k8s supports the following authentication strategies.

- [Client Certificate](https://kubernetes.io/docs/reference/access-authn-authz/authentication/#x509-client-certs)
- [Static Bearer token](https://kubernetes.io/docs/reference/access-authn-authz/authentication/#static-token-file)
- [HTTP basic auth](https://kubernetes.io/docs/reference/access-authn-authz/authentication/#static-password-file)
- [Service Account](https://kubernetes.io/docs/reference/access-authn-authz/authentication/#service-account-tokens)
- [OpenID Connect](https://kubernetes.io/docs/reference/access-authn-authz/authentication/#openid-connect-tokens)
- [Authentication webhook](https://kubernetes.io/docs/reference/access-authn-authz/authentication/#webhook-token-authentication)
- [Authenticating proxy](https://kubernetes.io/docs/reference/access-authn-authz/authentication/#authenticating-proxy)

The most common one is Service Account.
It is supported natively thus supported by all providers.
Therefore it is the chosen one.

# Approach

We define a ClusterRole to allow read access to essential resources.
Note that we must never allow access to secrets because
the token of a Service Account is stored as secret.
Allowing access to secret means
different users in the same app can know others' Service Account.
This role allows read access to Pods, Logs of Pods and Deployments.

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: 'skygear:developer-reader'
rules:
- apiGroups: [""]
  resources: ["pods", "pods/log"]
  verbs: ["get", "watch", "list"]
- apiGroups: ["extensions", "apps"]
  resources: ["deployments"]
  verbs: ["get", "watch", "list"]
```

We introduce a command to skycli to allow the developer to get credentials.
skycli uses `kubectl config` to write the credentials into kubeconfig.

Behind the scene, a service account is created per developer per app if not exists.
A RoleBinding is created to bind the above role to the service account.

The service account is deleted when it is explicitly deleted by the developer with skycli or
when the developer is removed from the collaborators.

# Caveats

The token of a service account is a JWT token that never expire.
k8s does not support expiring JWT token.
