# SDK

## Authentication

APIs would be added to perform authentication:
```ts
function authenticateAnonymously(): Promise<{ user: User }>;
```

This function would log in as an existing anonymous user if a local key-pair is
found, or sign up a new anonymous user otherwise.

Anonymous identity key-pair is managed by SDK. It should be stored locally in
a secure storage (e.g. iOS Keychain).

## Promotion

APIs would be added to perform anonymous user promotion:
```ts
// For React Native
function promote(options: PromoteOptions): Promise<{ user: User; state?: string }>;
// For Web
function startPromotion(options: PromoteOptions): Promise<void>;
function finishPromotion(): Promise<{ user: User; state?: string }>;
```

The behavior of these APIs are mostly the same as OIDC authorization APIs.
