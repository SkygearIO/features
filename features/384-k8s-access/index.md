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

# Caveat of the default Service Account token

The [TokenController](https://kubernetes.io/docs/reference/access-authn-authz/service-accounts-admin/#token-controller) creates a token stored in secrets. This token never expires.

# Workaround of the caveat

Since k8s 1.12, we can create a TokenRequest of a Service Account which is not stored in secrets and has configurable expiry time. The minimum expiry time is 10 minutes.

# Authentication

We introduce a command to skycli to allow the developer to get credentials.
In particular, we use a level of indirection to associate the lifetime of the access token of skycli
with that of kubectl.

When the developer runs `skycli app get-k8s-credentials`, skycli roughly does the following.

```sh
$ kubectl config set-credentials cluster-admin \
  --exec-command=/path/to/skycli \
  --exec-api-version=client.authentication.k8s.io/v1beta \
  --exec-arg=--context \
  --exec-arg=thecontext \
  --exec-arg=--app \
  --exec-arg=myapp \
  --exec-arg=app \
  --exec-arg=get-k8s-token-request
```

When kubectl needs to authenticate the developer, it execute `/path/to/skycli --context thecontext --app myapp app get-k8s-token-request`.

skycli then requests a TokenRequest from the controller.
A service account is created per developer per app if not exists.
A RoleBinding is created to bind the above role to the service account.
Finally, a TokenRequest is created and returned to skycli.

skycli transforms the TokenRequest into a ExecCredential and outputs it to STDOUT.

kubectl takes the token from the ExecCredential and uses it as the bearer token.
Since the token is created with a TokenRequest, the k8s API server can interpret it natively.

The service account is deleted when it is explicitly deleted by the developer with skycli or
when the developer is removed from the collaborators.

# Authorization

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
