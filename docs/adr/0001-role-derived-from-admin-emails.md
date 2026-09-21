# Role is derived from the admin-email list, not stored

API payloads carry a Role (admin/user) but no role column exists:
roleForEmail derives it at session time from the ADMIN_EMAILS config
(packages/api/src/features/auth/domain/rules/role-rules.ts). A static
admin list avoids a role-management UI and migration for a single-operator
deployment; reversing means adding a user.role column plus backfill, which
is deferred until multiple operators actually need it.

## Consequences

- Changing the admin set is a config change plus re-login, not a DB write.
- Session payloads include role; nothing else reads ADMIN_EMAILS.
