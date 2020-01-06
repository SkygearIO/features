# Design Summary

## SDK API
Following snippets use TypeScript:
```diff
- async signup(loginIDs: { [key: string]: string }, password: string, data?: object): Promise<User>;
- async signupWithUsername(username: string, password: string, data?: object): Promise<User>;
- async signupWithEmail(email: string, password: string, data?: object): Promise<User>;
+ async signup(
+   loginIDs: { [key: string]: string }[] | { [key: string]: string },
+   password: string, data?: object,
+   realm?: string
+ ): Promise<User>;
+ async signupWithUsername(username: string, password: string, data?: object, realm?: string): Promise<User>;
+ async signupWithEmail(email: string, password: string, data?: object, realm?: string): Promise<User>;

- async login(loginID: { [key: string]: string }, password: string): Promise<User>;
- async loginWithUsername(username: string, password: string): Promise<User>;
- async loginWithEmail(email: string, password: string): Promise<User>;
+ async login(loginID: { [key: string]: string } | string, password: string, realm?: string): Promise<User>;
+ async loginWithUsername(username: string, password: string, realm?: string): Promise<User>;
+ async loginWithEmail(email: string, password: string, realm?: string): Promise<User>;

+ async requestEmailVerification(loginID: string): Promise<void>;
+ async createLoginID(loginIDKey: string, loginID: string, realm?: string): Promise<void>;
+ async deleteLoginID(loginID: string, realm?: string): Promise<void>;

  async whoami(): Promise<User>;
  async forgotPassword(email: string): Promise<void>;
  async verifyUser(code: string): Promise<User>;
```

## Realms
- Each login ID can be associated with a realm.
- By default, single realm `default` is white-listed.
- Parameters `realm` in APIs are default to `default`.
- (login ID, realm) is unique within an app.

### Example user object
```json
{
    "user_id": "5bf1e4d2-e1c4-4517-93c7-7dae89261da6",
    "metadata": {},
    "last_seen_at": "...",
    "created_at": "...",
    "created_by": "...",
    "updated_at": "...",
    "updated_by": "...",
    "verified": true,
    "verify_info": {
        "test@example.com": true
    },
    "access_token": "..."
}
```

## Configuration
- Field `allowedRealms` (list of strings, optional).
    - Default to single realm `default`.
    - A list of white-list realms.
- Field `loginIDKeys` (map of string to login ID config, optional).
    - Default value:
      ```json
      {
          "username": { "type": "raw" },
          "email": { "type": "email" },
          "phone": { "type": "phone" }
      }
      ```
    - Keys are allowed login ID keys; value are login ID configs:
        - `type`: type of the login ID, can be standard keys (e.g. `email`, `phone`),
                  or `raw` for unspecified type.
        - `maximum`: The inclusive maximum amount of login IDs, default to 1.
    - Various auth features (e.g. welcome email/user verification/user portal)
      may make use of the login ID types.

- Field field `welcomeEmail.destination` (string `first` or `all`):
    - Default to `first`
    - `first`: first login ID of supported (email/phone) login ID keys.
    - `all`: all login ID of supported (email/phone) login ID keys.

## Use Case Examples

Unless specified, following examples assume using default configuration.

### Signup with single login ID
```typescript
const user1 = await signupWithEmail("test@example.com", "12345678");
const user2 = await signup({ phone: "+85299999999" }, "12345678");

// following should fail:
await signup({ fingerprint: "ZmluZ2VycHJpbnQ=" }, "12345678");
// "login ID key is not allowed": fingerprint is not in the list of white-listed login ID keys
```

### Signup with realms
Assume `teacher`, `student`, and `admin` are whitelisted realms.
```typescript
await signupWithEmail("test@example.com", "12345678", undefined, "teacher");
await createLoginID("email", "test@example.com", "student");
// then:

// - following should succeed:
await loginWithEmail("test@example.com", "12345678", "teacher");
await loginWithEmail("test@example.com", "12345678", "student");

// - following should fail:
await loginWithEmail("test@example.com", "12345678");
// "credentials are incorrect": 'default' realm is not white-listed
await signupWithEmail("test@example.com", "12345678");
// "realm is not allowed": 'default' realm is not white-listed
await signupWithEmail("test@example.com", "12345678", undefined, "admin");
// "user duplicated": cannot create new login ID for existing user (use createLoginID instead)
```

### Signup with multiple login ID
Assume `email` and `username` are white-listed login ID keys,
with exactly one username allowed.

```typescript
const user = await signup([
    {"email": "test@oursky.com"},
    {"email": "test@example.com"},
    {"username": "test"}
], "12345678");
// then:

// - following should succeed:
await loginWithEmail("test@oursky.com", "12345678");
await login("test@example.com", "12345678"); // login ID is matched literally
await login({ "email": "test@example.com" }, "12345678"); // normalization may be applied for email login ID keys
await loginWithUsername("test", "12345678");

// - following should fail:
await login({
    "email": "test@oursky.com",
    "username": "test"
}, "12345678");
// "multiple login ID is not allowed": cannot login with more than 1 login ID
await signupWithEmail("test@example.com", "12345678");
// "user duplicated": cannot use login ID of existing user
await signup([
    {"email": "test1@example.com"},
    {"email": "test2@example.com"}
], "12345678");
// "login ID 'username' is not valid": username is not present (exactly one required)
```

### User verification
Assume `email` and `username` are white-listed login ID keys,
with maximum 2 emails.
Assume verification criteria is set as `all`.

```typescript
let user = await signup([
    {"email": "test@oursky.com"},
    {"email": "test@example.com"},
    {"username": "test"}
]);
// user.verified is false
// user.verify_info is {}

// following should fail:
await requestEmailVerification("test1@oursky.com");
// "invalid login ID": the login ID does not exist or does not belong to current user

// following should succeed:
await requestEmailVerification("test@oursky.com");

// after verification:
user = await whoami();
// user.verified is false
// user.verify_info is { "test@oursky.com": true }

// following should succeed:
await requestEmailVerification("test@example.com");

// after verification:
user = await whoami();
// user.verified is true
// user.verify_info is { "test@oursky.com": true, "test@example.com": true }
```

### Welcome email

Assume welcome email destination is set to `first`:
```typescript
await signupWithEmail("test1@example.com", "12345678"); // sent to test1@example.com
await signupWithUsername("test", "12345678") // no welcome email is sent
await signup({
    "email": "test2@example.com",
    "username": "test"
}, "12345678") // sent to test2@example.com
await signup([
    { "email": "test3@oursky.com" },
    { "email": "test3@example.com" }
], "12345678") // sent to test3@oursky.com
```

Assume welcome email destination is set to `all`:
```typescript
await signup([
    { "email": "test3@oursky.com" },
    { "email": "test3@example.com" }
], "12345678") // sent to test3@oursky.com and test3@example.com
```
