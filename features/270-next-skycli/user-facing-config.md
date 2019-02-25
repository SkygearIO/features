## User facing config

In skycli, we allow user to edit the tenant config. Instead of editing the
sever config directly, we are going to convert the config to a more user
friendly version.

User can update the completed tenant config by command `skycli app update-tenant-config`.
Or update the config in different section e.g. `skycli app update-tenant-config SSO`.

Please find the config sample below, be note that user can omit fields that they
are happy with the default value. All the default value should be explained in
the doc.

- [Server config sample](server-config.yaml)
- [User facing config sample](user-facing-config.yaml)

### Different between server config and user facing config
- Remove fields
    - Not editable fields
        - `APP_NAME`
        - `DATABASE_URL`
    - Difficult concept that we should have default value
        - `AUTH_RECORD_KEYS`
        - `URL_PREFIX` of Auth gear, `SSO`, `FORGOT_PASSWORD`, `USER_VERIFY`, `WELCOME_EMAIL`
        - `JS_SDK_CDN_URL`
    - Remove profile store configuration, we don't allow using record as user profile store. Auth gear will use the default store (Save profile as JSON in auth gear db).
        - `USER_PROFILE.IMPLEMENTATION`
        - `USER_PROFILE.IMPL_STORE_URL`
- Rename `SSO_SETTING` to `SSO`, move `SSO_CONFIGS` under `SSO`
- Simplify sso auto link config to true or false, rename from `AUTO_LINK_PROVIDER_KEYS` to `MERGE_USERS_WITH_IDENTICAL_EMAIL`
- In user verify phone config, omit email related fields which are redundant
- Rename all html template fields with inline html

### Server update

- User can omit the items if they are happy with the default value. Review all
  components in auth gear, update with sensible default config value. So user
  can enable the feature by providing minimal config.
  Some of the default value suggestion:
    - Default AUTH_RECORD_KEYS =  [["email"],["username"]]
    - Default Auth gear URL_PREFIX, URL_PREFIX of SSO, FORGOT_PASSWORD, USER_VERIFY, WELCOME_EMAIL
    - Default `JS_SDK_CDN_URL` in SSO, with latest sdk cdn (next version)
    - User verification
        - Default `CRITERIA` to any
        - Default `AUTO_UPDATE` to true
        - Default `AUTO_SEND_SIGNUP` and `AUTO_SEND_UPDATE` to true?

- Support cluster default config? For config like `SMTP`, we may not want user
  input those setting separately per app.

### Implementation

- Controller responsible for converting the config. Controller will store both
  the server config and user facing config in db. When user save the config by
  command, controller will convert the user facing config to server config.
  The conversion is one way, so user should not update the config in db directly.
  Server will only read the server config, storing user facing config in db is for
  user editing only.
- Controller will read all template fields, compare and see if there is any changes.
  Upload the content as a file and update the template url in server config.
- Controller need to consider merging the unknown fields to the server config
  when doing the conversation. So when we add new fields to the server tenant if
  those attributes look good to user, we don't need to update the conversation
  code in controller.
