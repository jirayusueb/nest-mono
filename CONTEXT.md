# nest-mono

A blogging platform: Nest API with cookie sessions, image media, and an
admin-capable author surface, plus a TanStack Start web app.

## Language

### Publishing

**Blog**: The publishing context as a whole — the feature containing Posts,
Categories, and Tags. Never a single piece of content.
_Avoid_: post, article

**Post**: A piece of content written by a User; identified by id and by a
unique Slug among non-deleted Posts. Soft-deleted, never hard-deleted.
_Avoid_: blog, article, entry

**Category**: An optional single grouping for a Post; unique by name and slug.

**Tag**: An optional label; a Post carries at most 10, unique by derived slug.

**Slug**: The URL identifier of a Post, Category, or Tag; released for reuse
when its Post is soft-deleted.

### Identity & Access

**User**: A person with an email — author of Posts, owner of Media.
_Avoid_: account, identity, session user

**Account**: A credential row for a User (provider + password). Storage
concept only; never appears in APIs.
_Avoid_: identity, user

**AuthIdentity**: The auth feature's projection of a User plus credentials —
the shape sign-up and sign-in work against.
_Avoid_: Account (storage row), SessionUser (request principal)

**Session**: A login for a User with an expiry. Only the token hash is
stored; the raw token exists at issuance and in the cookie, nowhere else.

**SessionUser**: The authenticated principal attached to a request.
_Avoid_: User (stored person), AuthIdentity

**Role**: `admin` or `user`. Derived at session time from the configured
admin-email list; never persisted. See docs/adr/0001.

### Media

**Media**: A User-owned uploaded image record (key, content type, bytes,
confirmed flag).

**UploadTarget**: A short-lived grant to upload one object at a key.

**Bucket Object**: The stored bytes in the bucket store, addressed by key.

**thumbnailUrl**: A Post's image reference as a plain URL — deliberately not
a media foreign key.
