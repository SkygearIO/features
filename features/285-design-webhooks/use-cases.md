# Sample Use Cases


## Synchronize Metadata to Self-Managed Profile

Developer may want to synchronize metadata when it is updated by user:
- When user update metadata, an external service should be notified to
  synchronize their managed profile according to user metadata in auth gear.
- External service may want to validate & reject invalid user metadata.

### Suggested Solution

- In `before_user_metadata_update`:
    - Validate input user metadata is valid, otherwise disallow the operation.
- In `after_user_metadata_update`:
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
valid invitation code:

- Invitation code consumptions are stored in database:
    - (invitation code ID, expiry time, consumed user ID)
    - If consumed user ID is present, expiry time is ignored and will not expire.
    - If record is expired, the record should be ignored.
- Pass invitation code and intended login ID to a developer-created 'claim code' endpoint,
  in exchange for a invitation token:
    - Create a code consumption record with a short expiry time (e.g. 1 min).
    - Reject if the code consumption limit would be exceed (ignoring expired records).
    - Return a JWT referencing the consumption record and intended login ID.
- Pass invitation token in user metadata of signup request.
- In `before_user_create` event handler:
    - Check the invitation token is valid, not expired, and matches the intended login ID.
    - Check the referenced consumption record is not consumed.
    - Disallow the operation if any of the 2 conditions failed.
- If signup failed due to other validation (e.g. duplicated login ID),
  invitation token should be reused in subsequent signup request until
  its expiry.
- In `after_user_create` event handler:
    - Clear the expiry time and set consumed user ID in referenced consumption record.


### Naive Approaches
- Pass invitation code instead of invitation token in signup request, and create
  consumption record in `before_user_create` event handler.  
    - Problem: If the signup failed, user cannot reuse the code until the
               tempoarary consumption record expired.

- Do not save/check the intended login ID.  
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

- Pass signup form in user metadata of signup request.
- In `before_user_create` event handler:
    - Validate the form is valid, otherwise disallow the operation.
- In `after_user_create` event handler:
    - Save the form in self-managed database
    - If the save failed, it means a concurrency conflict occured and
      must be resolved.

If a conflict occured (e.g. due to violated unique constraints), in most case
it means end-user intentionally double-submit the form attempting to bypass
constraints. Developer can resolve the conflict by:
- disabling the user that failed to save profile and notify admin to investigate; or
- requiring the user that failed to save to fill in sign up form again.
