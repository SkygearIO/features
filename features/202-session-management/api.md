# Session Management APIs

## SDK API
```typescript
interface Session {
    id: string;
    identityID: string;
    createdAt: Date;
    lastAccessAt: Date;
    createdByIP: string;
    lastAccessIP: string;
    createdByUserAgent: string;
    lastAccessUserAgent: string;
    data: object;
}

function listSessions(): Promise<Session[]>;

function getSession(sessionID: string): Promise<Session>;

function updateSession(sessionID: string, data: object): Promise<void>;

function revokeOtherSessions(): Promise<void>;

function revokeSession(sessionID: string): Promise<void>;

class AuthContainer {
    get currentSessionID(): string | null;
}
```
