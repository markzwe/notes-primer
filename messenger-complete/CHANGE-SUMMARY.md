# Completed messenger: review before applying to the original project

This folder is a separate runnable implementation. Original project files and
records were preserved.

## Changes

- Added Session model, session authentication service, HTTP logout, and socket
  disconnection on revocation. JWTs reference an active session.
- Extended Conversation with private/group kinds and a conditional unique key
  for private pairs. Added named fixed-membership groups.
- Added atomic message sequence allocation, stable pagination and sender names.
- Mounted message HTTP routes and added post-persistence live notifications.
- Added authenticated Socket.IO with user and conversation rooms and expiry.
- Completed frontend conversation lists, group form, messages, composer,
  pagination, connection state, notifications and reconnect recovery.
- Added shared HTTP client, same-tab session restoration, responsive styling,
  setup scripts, fresh-database configuration, tests and architecture docs.

## Data impact

This version runs on 3002/5175 and uses messenger_complete, rather than the
original project's ports and messenger database. Existing records are not
imported. The index initializer only creates this version's indexes; it does
not drop legacy indexes or migrate old records. Running this schema against the
old database without a migration would be incorrect.

## Proposed application after approval

Copy the reviewed source, package manifests/lockfiles, tests, setup scripts and
configuration into cps490-26f-htetz1 after saving a source backup. Preserve the
original Git history, planning documents and old environment file. Use a new
environment file pointing at the separate messenger_complete database; keep the
old database available. Do not delete or migrate old records as part of that
copy. Dependency installation updates the original project's node_modules.

Importing old users, conversations and messages is separate work requiring an
explicit backup and migration plan.
