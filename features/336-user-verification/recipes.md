# Recipes

## Override verification status of the user

Developer may want custom support to be able to override the verification
status of the user.

To acheive this, developer may use the update verification state API:
- To mark user as verified: set `is_manually_verified` to true. The user will
  be always considered verified.
- To mark user as unverified: clear `verify_info` map. The user will need to
  verify their login IDs again.

## Ensure verified user cannot become unverified

To simplify application logic, developer may want to maintain the invariant that
once the user become verified, it would not become unverified again.

To acheive this, developer may use a `before_identity_delete` hook handler to
disallow removing a verified login ID.
