# Design Summary

## SDK API
```typescript
type Metadata = { [key: string]: unknown };

interface User {
    id: string;
    createdAt: Date;
    lastLoginAt: Date;
    isVerified: boolean;
    metadata: Metadata;

    identity: Identity;
}

interface IdentityBase {
    type: string;
    metadata: Metadata;
}
interface PasswordIdentity extends IdentityBase {
    type: 'password';
    loginIDKey: string;
    loginID: string;
    realm: string;
}
interface OAuthIdentity extends IdentityBase {
    type: 'oauth';
    providerID: string;
    providerUserID: string;
    metadata: {
        raw_profile: object;
    };
}
interface CustomTokenIdentity extends IdentityBase {
    type: 'custom';
    providerUserID: string;
    metadata: {
        raw_profile: object;
    };
}
type Identity = PasswordIdentity | OAuthIdentity | CustomTokenIdentity;

async function listIdentities(): Promise<Identity[]>;

async function addLoginID(loginID: {[key: string]: string}, realm?: string): Promise<void>;
async function removeLoginID(loginID: string, realm?: string): Promise<void>;

async function changePassword(newPassword: string, oldPassword?: string): Promise<User>;

```


## Configuration
`reauthForSecurity` (boolean; default `true`):
Require re-authentication (i.e. access token must be issued recently) for
security-critical operations:
- add/remove login ID
- link/unlink SSO provider (except auto-link when logging in with OAuth)
- change password (if old password is not provided)

`reauthIntervalSeconds` (integer; default 300, i.e. 5 minutes):
The period after the access token is issued, that is considered authenticated
for security-critical operations.


## Use Case Example

### List user identities
```typescript
const identities = await listIdentities();
expectEquals(identities, [
    {
        type: "password",
        loginIDKey: "email",
        loginID: "test@example.com",
        realm: "default",
        metadata: {
            "email": "test@example.com"
        }
    },
    {
        type: "password",
        loginIDKey: "contact_phone",
        loginID: "+85299999999",
        realm: "default",
        metadata: {
            "phone": "+85299999999"
        }
    },
    {
        type: "password",
        loginIDKey: "fingerprint",
        loginID: "ZmluZ2VycHJpbnQ=",
        realm: "default",
        metadata: {}
    },
    {
        type: "oauth",
        providerID: "some-site",
        providerUserID: "9999999999999999",
        metadata: {
            raw_profile: {
                id: "9999999999999999",
                email: "test@example.com",
                contact_phone: "+85299999999",
                gender: "male",
            },
            email: "test@example.com",
            phone: "+85299999999",
        },
    },
]);
```

### Add login ID
```typescript
let identities: Identity[];
identities = await listIdentities();
expectEquals(identities, [
    {
        type: "password",
        loginIDKey: "email",
        loginID: "test@example.com",
        realm: "default",
        metadata: {
            "email": "test@example.com"
        }
    },
]);

await addLoginID("secondary_email", "test@oursky.com");
// throws error "access token is not issued recently"

// after re-authentication:
await addLoginID("secondary_email", "test@oursky.com");
identities = await listIdentities();
expectEquals(identities, [
    {
        type: "password",
        loginIDKey: "email",
        loginID: "test@example.com",
        realm: "default",
        metadata: {
            "email": "test@example.com"
        }
    },
    {
        type: "password",
        loginIDKey: "secondary_email",
        loginID: "test@oursky.com",
        realm: "default",
        metadata: {
            "email": "test@oursky.com"
        }
    },
]);
```

### Remove login ID
```typescript
let identities: Identity[];
identities = await listIdentities();
expectEquals(identities, [
    {
        type: "password",
        loginIDKey: "email",
        loginID: "test@example.com",
        realm: "default",
        metadata: {
            "email": "test@example.com"
        }
    },
    {
        type: "password",
        loginIDKey: "username",
        loginID: "test",
        realm: "default",
        metadata: {
            "username": "test"
        }
    },
]);
const currentIdentity = (await whoami()).identity;
expectEquals(currentIdentity, {
    type: "password",
    loginIDKey: "email",
    loginID: "test@example.com",
    realm: "default",
    metadata: {
        "email": "test@example.com"
    }
});

await removeLoginID("test@example.com");
// throws error "cannot remove current login ID"

await removeLoginID("test");
identities = await listIdentities();
expectEquals(identities, [
    {
        type: "password",
        loginIDKey: "email",
        loginID: "test@example.com",
        realm: "default",
        metadata: {
            "email": "test@example.com"
        }
    },
]);
```

### Create password credentials for OAuth users
```typescript
let identities: Identity[];
identities = await listIdentities();
expectEquals(identities, [
    {
        type: "oauth",
        providerID: "some-site",
        providerUserID: "9999999999999999",
        metadata: {
            raw_profile: {
                id: "9999999999999999",
                email: "test@example.com",
                contact_phone: "+85299999999",
                gender: "male",
            },
            email: "test@example.com",
            phone: "+85299999999",
        },
    },
]);

// after re-authentication (otherwise both call would fail):
await addLoginID("email", "test@example.com");
// at this point, login ID test@example.com is associated with the current user,
// but cannot be used to login due to password does not exist.
await changePassword("password");
// at this point, user can login with the email & new password

identities = await listIdentities();
expectEquals(identities, [
    {
        type: "oauth",
        providerID: "some-site",
        providerUserID: "9999999999999999",
        metadata: {
            raw_profile: {
                id: "9999999999999999",
                email: "test@example.com",
                contact_phone: "+85299999999",
                gender: "male",
            },
            email: "test@example.com",
            phone: "+85299999999",
        },
    },
    {
        type: "password",
        loginIDKey: "email",
        loginID: "test@example.com",
        realm: "default",
        metadata: {
            "email": "test@example.com"
        }
    },
]);

```