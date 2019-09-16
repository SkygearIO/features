# Session Management APIs

## SDK API
```typescript
// Field value would be empty string if not available
interface UserAgent {
    raw: string;
    name: string; // browser name or app ID
    version: string; // browser version or app version
    os: string;
    osVersion: string;
    deviceName: string;
    deviceModel: string;
}

interface Session {
    id: string;
    identityID: string;
    createdAt: Date;
    lastAccessedAt: Date;
    createdByIP: string;
    lastAccessedIP: string;
    userAgent: UserAgent;
}

interface ExtraSessionInfoOptions {
    deviceName?: string;
}

class AuthContainer {
    get currentSessionID(): string | null;

    extraSessionInfoOptions: ExtraSessionInfoOptions;

    // after updating extra session info options, call this to save it to
    // persistent storage.
    saveExtraSessionInfoOptions(): Promise<void>;

    // list all sessions of current user
    listSessions(): Promise<Session[]>;

    // get specific session information for current user
    // for master-key, can use for any user
    getSession(sessionID: string): Promise<Session>;

    revokeOtherSessions(): Promise<void>;

    // revoking current session is disallowed
    // for master-key, can use for any session
    revokeSession(sessionID: string): Promise<void>;
}

// get current device name; return empty string if cannot detect.
function getDeviceName(): Promise<string>;
```

## SDK User Agent

In general, for native SDKs, the user agent would have following format:
```
[App ID]/[App Version](Skygear; [Device]; [OS]) [SDK Library Name]/[SDK version]
```

Examples:
- `io.skygear.test/1.0.1 (Skygear; iPhone11,8; iOS 12.0) SKYKit/2.0.1`
- `io.skygear.test/1.3.0 (Skygear; Samsung GT-S5830L; Android 9.0) io.skygear.skygear/2.2.0`

For web SDK, the user agent would be controlled by browser, for example:

`Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36`

The parsed user agent information is provided in best-effort basis, and its
information may not be backward compatible.


## SDK Extra Information Collection
Extra information collection is disabled by default. If enabled, the collected
information would be sent in header `X-Skygear-Extra-Info` as base64 encoded JSON encoded object.

Client SDKs should persist the extra information configuration locally.

Example header:
```
X-Skygear-Extra-Info: eyAiZGV2aWNlX25hbWUiOiAiTXkgUGhvbmUiIH0K
```

## Web-hook Events
In event context, a `session` attribute with value type `Session` would be
added:
```json
{
    "timestamp": 1565859018,
    "request_id": "66014B80-0813-481B-9CD9-7C5A12B4671F",
    "user_id": "F973C930-D357-428E-8E6D-A32B0FF1CFF4",
    "identity_id": "1658AC0E-1D62-4612-BDE3-31464121C9A3",
    "session": {
        "id": "FEAD3339-4A26-4C43-8737-27AC88D1173E",
        "identity_id": "1658AC0E-1D62-4612-BDE3-31464121C9A3"
        // ...
    }
}
```

For `session_delete` event, the `reason` field will have one more possible
value `revoke`.
