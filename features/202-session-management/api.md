# Session Management APIs

## SDK API
```typescript
interface UserAgent {
    raw: string;
    name: string; // browser name or app ID
    version: string; // browser version or app version
    os: string;
    osVersion: string;
    device: string;
}

interface Session {
    id: string;
    identityID: string;
    createdAt: Date;
    lastAccessedAt: Date;
    createdByIP: string;
    lastAccessedIP: string;
    createdByUserAgent: UserAgent;
    lastAccessedUserAgent: UserAgent;
    name: string;
    data: object;
}

// list all sessions of current user
function listSessions(): Promise<Session[]>;

// get specific session information for current user
// for master-key, can use for any user
function getSession(sessionID: string): Promise<Session>;

// update specific session name for current user
// for master-key, can use for any user and also update custom attributes
function updateSession(sessionID: string, name: string | undefined, data?: object): Promise<void>;

function revokeOtherSessions(): Promise<void>;

// revoking current session is disallowed
// for master-key, can use for any session
function revokeSession(sessionID: string): Promise<void>;

class AuthContainer {
    get currentSessionID(): string | null;
}
```

## SDK User Agent

In general, for native SDKs, the user agent would have following format:
```
[App ID]/[App Version]([Device]; [OS]) [SDK Library Name]/[SDK version]
```

Examples:
- `io.skygear.test.ios/1.0.1 (iPhone11,8; iOS 12.0) SKYKit/2.0.1`
- `io.skygear.test.android/1.3.0 (Samsung GT-S5830L; Android 9.0) io.skygear.skygear/2.2.0`

The parsed user agent information is provided in best-effort basis, and its
information may not be backward compatible.
Some parsed user agent information may not be available, and empty string
would be used instead.
