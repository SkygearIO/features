# Sample Use Cases


## Synchronize Metadata to Self-Managed Profile

Developer may want to synchronize metadata when it is updated by user:
- When user update metadata, an external service should be notified to
  synchronize their managed profile according to user metadata in auth gear.
- External service may want to validate & reject invalid user metadata.

### Suggested Solution

- In `before_user_update`:
    - Validate input user metadata is valid, otherwise disallow the operation.
- In `user_sync`:
    - Save new user profile and event sequence number in database, if and only
      if the incoming event is later then the sequence number saved.

### Naive Approaches
- Do not check sequence number before saving.  
    - Problem: Event delivery order is unspecified, a older event may arrive
               later than earlier events.

- Check timestamp instead of sequence number.  
    - Problem: Timestamps may have time skew issue.


## Invitation Code

Developer may require user to present an invitation code before signing up:
- Invitation code is generated for each potential new user
- Signing up without code/invalid code should fail
- A invitation code has limit on number of consumption
- User may be tracked on which code is used to sign up

### Suggested Solution

We use pessimistic concurrency control to ensure no user can signup without a
valid invitation code under normal situation:

```typescript
declare function cryptoSecureRandomString(): string;

// simplified auth functions

interface User {
    id: string;
    metadata: any;
}

interface Identity {
    id: string;
    loginIDKey: string;
    loginID: string;
}

declare function disableUser(id: string): Promise<void>;
declare function deleteLoginID(loginID: string): Promise<void>;
declare function signupWithEmail(loginID: { [key: string]: string }, password: string): Promise<User>;

// DB entities
interface InvitationCode {
    id: string;
    code: string;
    consumptionLimit: number;
}

interface InvitationCodeConsumption {
    token: string;
    codeID: string;
    expiry: Date;
    consumedUserID: string | null;
}

declare function getInvitationCodeByCode(code: string): Promise<InvitationCode | null>;
declare function getInvitationCodeByID(id: string): Promise<InvitationCode | null>;
declare function getInvitationCodeConsumptionByToken(token: string): Promise<InvitationCodeConsumption | null>;
declare function getInvitationCodeConsumptionsByCodeID(codeID: string): Promise<InvitationCodeConsumption[]>;
declare function saveInvitationCodeConsumption(consumption: InvitationCodeConsumption): Promise<void>;

function isConsumptionValid(consumption: InvitationCodeConsumption): boolean {
    // a consumption record associated with a user never expires
    if (consumption.consumedUserID !== null) {
        return true
    }
    return consumption.expiry < new Date()
}

// expiry of the lock on invitation code
const LockExpiryMS: number = 1000 * 60
// invitation token is included in login IDs: prevent multiple use of same token
const InvitationTokenLoginIDKey = "invitation_token";

interface ConsumptionToken {
    value: string;
    expiry: Date;
}

// Claim invitation code API: client should call this to attempt to claim a invitation code
async function claimInvitationCode(code: string): Promise<ConsumptionToken> {
    const invitationCode = await getInvitationCodeByCode(code);
    if (!invitationCode) {
        throw new Error("invitation code is invalid");
    }

    const consumption: InvitationCodeConsumption = {
        token: cryptoSecureRandomString(),
        codeID: invitationCode.id,
        expiry: new Date(Date.now() + LockExpiryMS),
        consumedUserID: null,
    };
    await saveInvitationCodeConsumption(consumption);

    const consumptions = await getInvitationCodeConsumptionsByCodeID(invitationCode.id);
    if (consumptions.filter(isConsumptionValid).length > invitationCode.consumptionLimit) {
        throw new Error("invitation code reached consumption limit");
    }

    return {
        value: consumption.token,
        expiry: consumption.expiry
    };
}

// before_user_create handler
async function beforeUserCreate(user: User, identities: Identity[]): Promise<void> {
    const invitation = identities.find(identity => identity.loginIDKey === InvitationTokenLoginIDKey);
    if (!invitation) {
        throw new Error("invitation token is invalid");
    }

    const token = invitation.loginID;
    const consumption = await getInvitationCodeConsumptionByToken(token);
    if (!consumption || consumption.expiry > new Date()) {
        throw new Error("invitation token is invalid");
    }
}

// after_user_create handler
async function afterUserCreate(user: User, identities: Identity[]): Promise<void> {
    const invitation = identities.find(identity => identity.loginIDKey === InvitationTokenLoginIDKey)!;

    const token = invitation.loginID;
    const consumption = await getInvitationCodeConsumptionByToken(token);
    consumption.consumedUserID = user.id;
    await saveInvitationCodeConsumption(consumption);

    const code = await getInvitationCodeByID(consumption.codeID);
    const consumptions = await getInvitationCodeConsumptionsByCodeID(consumption.codeID);
    if (consumptions.filter(isConsumptionValid).length > code.consumptionLimit) {
        // consumption limit exceed, even with validation: anomaly occured.
        // likely the event delivery is delayed
        // disable the user and notify the admin to investigate
        await disableUser(user.id);
        return;
    }

    await deleteLoginID(invitation.loginID);
}

// client-side signup logic
let invitationToken: string | null;
let invitationTokenExpiry: Date | null;
async function signup(email: string, password: string, invitationCode: string): Promise<User> {
    // reuse token if previous-signup failed
    if (!invitationToken || invitationTokenExpiry > new Date()) {
        const token = await claimInvitationCode(invitationCode);
        invitationToken = token.value;
        invitationTokenExpiry = token.expiry
    }
    return await signupWithEmail({ email, [InvitationTokenLoginIDKey]: invitationToken }, password);
}
```

### Naive Approaches
- Pass invitation code instead of invitation token in signup request, and create
  consumption record in `before_user_create` event handler.  
    - Problem: If the signup failed, user cannot reuse the code until the
               tempoarary consumption record expired.

- Do not save/check the token in login IDs.  
    - Problem: Malicious user may create many users using same invitation token.


## Signup Form Processing

Developer may require user to fill in signup form before signing up:
- The application will validate the signup form
- Signing up without valid signup form should fail
- Signup form result is stored in self-managed database (i.e. not in auth gear)

### Suggested Solution

Developer may use the same approach as invitation codes. However, if having
users without profile is an acceptable risk, optimistic concurrency control
can be used instead to simplify logic:

```typescript
// simplified auth functions

interface User {
    id: string;
    metadata: any;
}

interface Identity {
    id: string;
    loginIDKey: string;
    loginID: string;
}

declare function disableUser(id: string): Promise<void>;
declare function signupWithEmail(loginID: { [key: string]: string }, password: string, metadata: any): Promise<User>;

// DB entities
interface Profile {
    userID: string;
    formData: any;
}

class ConstraintViolatedError extends Error { }

declare function saveProfile(profile: Profile): Promise<void>;

function validateForm(formData: any): boolean {
    // TODO: validate signup form in data
    return true;
}

// before_user_create handler
async function beforeUserCreate(user: User, identities: Identity[]): Promise<void> {
    if (!validateForm(user.metadata.form_data)) {
        throw new Error("signup form is invalid");
    }
}

// after_user_create handler
async function afterUserCreate(user: User, identities: Identity[]): Promise<void> {
    const profile: Profile = {
        userID: user.id,
        formData: user.metadata.form_data,
    }

    try {
        await saveProfile(profile);
    } catch (error) {
        if (error instanceof ConstraintViolatedError) {
            // concurrency conflict occured:
            // some constraints in database is violated. (e.g. email uniqueness)
            // most likely the end-user intentionally double-submit the form,
            // attempting to bypass constaints.
            // to resolve the conflict:

            // approach 1: disable to user and notify admin
            await disableUser(user.id);

            // approach 2: require user to fill-in signup form again after logging in
            profile.formData = null;
            await saveProfile(profile);

            return;
        }
        throw error;
    }
}

// client-side signup logic
async function signup(email: string, password: string, formData: any): Promise<User> {
    return await signupWithEmail({ email }, password, { form_data: formData });
}
```


## Ensuring Consistency

Due to web-hook latency, user may call an API that depends on data not yet
populate by web-hook handlers (e.g. profile not yet created after signing up).
When application detected inconsistency, application should handle it gracefully:

- reject request that depends on inconsistent state, user can retry after
  state converged to consistency; or
- attempt to restore consistency immediately, e.g. create profile immediately if
  no profile is found.

Developer should consider which approach suit their application best.
