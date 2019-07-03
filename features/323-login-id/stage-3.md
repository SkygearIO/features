# Email/SMS Interpretation in Auth Features, Create/delete login ID


## Configuration
- Let `WelcomeEmailDestination` be an enum:
    - `first`: First supported login IDs of user
    - `all`: All supported login IDs of user
- Update field `welcomeEmail`:
    - Add field `destination` (enum `WelcomeEmailDestination`,
      optional, default to `first`)


## SDK API
Following snippets use TypeScript:
```diff
+ async createLoginID(loginIDKey: string, loginID: string, realm?: string): Promise<void>;
+ async deleteLoginID(loginIDKey: string, loginID: string, realm?: string): Promise<void>;
```

This backing HTTP API of this SDK API is to be designed in another issue.

## Auth logic

- Signup:
    - Let first login IDs be the first login IDs for each login ID key.
        - For example:
          ```json
          [
              { "key": "email", "value": "test+1@example.com" },
              { "key": "email", "value": "test+2@example.com" },
              { "key": "secondary_email", "value": "test+3@example.com" },
              { "key": "phone", "value": "+85299999999" },
              { "key": "username", "value": "test" }
          ]
          ```
          The first login IDs are:
          ```json
          [
              { "key": "email", "value": "test+1@example.com" },
              { "key": "secondary_email", "value": "test+3@example.com" },
              { "key": "phone", "value": "+85299999999" },
              { "key": "username", "value": "test" }
          ]
          ```

- Welcome Email:
    - In context of signing up, send email to destinations specified in config:
        - `first`: Send to first email/phone login IDs,
                   otherwise do nothing.
            - For above example: `test+1@example.com` and `+85299999999`
        - `all`: Send to all email/phone login IDs,
                 otherwise do nothing.
            - For above example: `test+1@example.com`, `test+2@example.com`, `test+3@example.com`, and `+85299999999`
