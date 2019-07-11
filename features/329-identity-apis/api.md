# Design Summary

## SDK API
```typescript
type Metadata = { [key: string]: unknown };

interface User {
    id: string;
    createdAt: Date;
    lastLoginAt: Date;
    isVerified: boolean;
    isDisabled: boolean;
    metadata: Metadata;

    identity: Identity;
}

interface PasswordIdentity {
    id: string;
    type: 'password';
    loginIDKey: string;
    loginID: string;
    realm: string;
    claims: {
        email?: string;
        phone?: string;
        // or other standard keys in future
    };
}
interface OAuthIdentity {
    id: string;
    type: 'oauth';
    providerID: string;
    providerUserID: string;
    rawProfile: object;
    claims: {
        email?: string;
        // or other standard keys in future
    };
}
interface CustomTokenIdentity {
    id: string;
    type: 'custom';
    providerUserID: string;
    rawProfile: object;
    claims: {
        // or other standard keys in future
    };
}

// all identity types have common fields: id, type and metadata.
type Identity = PasswordIdentity | OAuthIdentity | CustomTokenIdentity;

async function listIdentities(): Promise<Identity[]>;

async function addLoginID(loginID: { [key: string]: string }, realm?: string): Promise<void>;
async function removeLoginID(loginID: string, realm?: string): Promise<void>;
async function updateLoginID(oldLoginID: string, newLoginID: { [key: string]: string }): Promise<User>;

async function changePassword(newPassword: string, oldPassword?: string): Promise<User>;

```


## Configuration
`reauthentication.disabled` (boolean; default `false`):
Require re-authentication (i.e. access token must be issued recently) for
security-critical operations:
- add/remove login ID
- link/unlink SSO provider (except auto-link when logging in with OAuth)
- change password (if old password is not provided)

`reauthentication.interval` (integer; default 300, i.e. 5 minutes):
The period after the access token is issued, that is considered authenticated
for security-critical operations.

`updateLoginIDEnabled` (boolean; default `false`):
Allow updating login ID in change username use case.


## Use Case Example

### Get current identity
```typescript
const currentIdentity = (await whoami()).identity;
expectEquals(currentIdentity, {
    id: "1431CB1E-8A2F-4A44-874E-70C3DB3EE043",
    type: "password",
    loginIDKey: "username",
    loginID: "test",
    realm: "default",
    claims: {}
});
```

### List user identities
```typescript
const identities = await listIdentities();
expectEquals(identities, [
    {
        id: "CF9B926C-F178-4057-805A-2DC030FA858E",
        type: "password",
        loginIDKey: "email",
        loginID: "test@example.com",
        realm: "default",
        claims: {
            "email": "test@example.com"
        }
    },
    {
        id: "D6CE6CB7-8A2C-43CE-BC32-1B43E255D4DD",
        type: "password",
        loginIDKey: "contact_phone",
        loginID: "+85299999999",
        realm: "default",
        claims: {
            "phone": "+85299999999"
        }
    },
    {
        id: "E176037B-F0B6-4861-A6FB-B0C431258667",
        type: "password",
        loginIDKey: "fingerprint",
        loginID: "ZmluZ2VycHJpbnQ=",
        realm: "default",
        claims: {}
    },
    {
        id: "E65CA45C-7ADF-4F37-AF8C-1F99D526D6F1",
        type: "oauth",
        providerID: "some-site",
        providerUserID: "9999999999999999",
        rawProfile: {
            id: "9999999999999999",
            email: "test@example.com",
            contact_phone: "+85299999999",
            gender: "male",
        },
        claims: {
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
        id: "AA7584C0-725E-4224-B2BF-9C7432A02B2C",
        type: "password",
        loginIDKey: "email",
        loginID: "test@example.com",
        realm: "default",
        claims: {
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
        id: "AA7584C0-725E-4224-B2BF-9C7432A02B2C",
        type: "password",
        loginIDKey: "email",
        loginID: "test@example.com",
        realm: "default",
        claims: {
            "email": "test@example.com"
        }
    },
    {
        id: "9576B3FE-0076-4C32-ADED-36035C5D2C97",
        type: "password",
        loginIDKey: "secondary_email",
        loginID: "test@oursky.com",
        realm: "default",
        claims: {
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
        id: "B9FA2617-6023-4A11-8021-5180AFF40A04",
        type: "password",
        loginIDKey: "email",
        loginID: "test@example.com",
        realm: "default",
        claims: {
            "email": "test@example.com"
        }
    },
    {
        id: "C502193D-F98A-44FE-8942-31902258B81D",
        type: "password",
        loginIDKey: "username",
        loginID: "test",
        realm: "default",
        claims: {
            "username": "test"
        }
    },
]);
const currentIdentity = (await whoami()).identity;
expectEquals(currentIdentity, {
    id: "B9FA2617-6023-4A11-8021-5180AFF40A04",
    type: "password",
    loginIDKey: "email",
    loginID: "test@example.com",
    realm: "default",
    claims: {
        "email": "test@example.com"
    }
});

await removeLoginID("test@example.com");
// throws error "cannot remove current login ID"

await removeLoginID("test");
identities = await listIdentities();
expectEquals(identities, [
    {
        id: "B9FA2617-6023-4A11-8021-5180AFF40A04",
        type: "password",
        loginIDKey: "email",
        loginID: "test@example.com",
        realm: "default",
        claims: {
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
        id: "1C1340E0-2A4E-44FA-AFC1-F8EF01297DF6",
        type: "oauth",
        providerID: "some-site",
        providerUserID: "9999999999999999",
        rawProfile: {
            id: "9999999999999999",
            email: "test@example.com",
            contact_phone: "+85299999999",
            gender: "male",
        },
        claims: {
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
        id: "1C1340E0-2A4E-44FA-AFC1-F8EF01297DF6",
        type: "oauth",
        providerID: "some-site",
        providerUserID: "9999999999999999",
        rawProfile: {
            id: "9999999999999999",
            email: "test@example.com",
            contact_phone: "+85299999999",
            gender: "male",
        },
        claims: {
            email: "test@example.com",
            phone: "+85299999999",
        },
    },
    {
        id: "1DB32787-DE31-4186-8118-E7E721BDA623",
        type: "password",
        loginIDKey: "email",
        loginID: "test@example.com",
        realm: "default",
        claims: {
            "email": "test@example.com"
        }
    },
]);

```

### Update login ID
```typescript
let identities: Identity[];
let currentIdentity: Identity;

identities = await listIdentities();
expectEquals(identities, [
    {
        id: "1431CB1E-8A2F-4A44-874E-70C3DB3EE043",
        type: "password",
        loginIDKey: "username",
        loginID: "test1",
        realm: "default",
        claims: {}
    },
]);
currentIdentity = (await whoami()).identity;
expectEquals(currentIdentity, {
    id: "1431CB1E-8A2F-4A44-874E-70C3DB3EE043",
    type: "password",
    loginIDKey: "username",
    loginID: "test1",
    realm: "default",
    claims: {}
});

// after re-authentication (otherwise the call would fail):
await updateLoginID("test1", {"username": "test2"});

identities = await listIdentities();
expectEquals(identities, [
    {
        id: "A73DEA08-DF98-45F3-A780-B238E64FD583",
        type: "password",
        loginIDKey: "username",
        loginID: "test2",
        realm: "default",
        claims: {}
    },
]);
currentIdentity = (await whoami()).identity;
expectEquals(currentIdentity, {
    id: "A73DEA08-DF98-45F3-A780-B238E64FD583",
    type: "password",
    loginIDKey: "username",
    loginID: "test2",
    realm: "default",
    claims: {}
});

```