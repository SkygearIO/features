# Session Management APIs

## SDK API
```typescript
interface Session {
    id: string;
    identityID: string;
    createdAt: Date;
    lastAccessedAt: Date;
    createdByIP: string;
    lastAccessedIP: string;
    createdByUserAgent: string;
    lastAccessedUserAgent: string;
    data: object;
}

// list all sessions of current user
function listSessions(): Promise<Session[]>;

// get specific session information for current user
// for master-key, can use for any user
function getSession(sessionID: string): Promise<Session>;

// this is master-key only API
function updateSession(sessionID: string, data: object): Promise<void>;

function revokeOtherSessions(): Promise<void>;

// revoking current session is disallowed
// for master-key, can use for any session
function revokeSession(sessionID: string): Promise<void>;

class AuthContainer {
    get currentSessionID(): string | null;
}
```
