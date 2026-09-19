# Blog

A monorepo (Nest api, TanStack Start web) whose product surface is a blog: signed-in users author posts in markdown, everyone reads them.

## Language

**Post**:
An article authored by a User; identified to readers by its Slug.
_Avoid_: Article, entry, blog post

**Author**:
The User who wrote a Post; the only one who may edit or delete it.
_Avoid_: Owner, creator

**Title**:
A Post's display name, 1–200 characters.
_Avoid_: Heading, name

**Slug**:
A Post's URL identity, derived from its Title and permanent once created.
_Avoid_: Handle, permalink, URL

**Category**:
A named grouping; at most one per Post. Its slug is its identity.
_Avoid_: Section, topic

**Tag**:
A named label; many per Post. Its slug is its identity.
_Avoid_: Keyword, label

**Thumbnail**:
The cover image shown with a Post.
_Avoid_: Hero image, featured image, cover

**Markdown**:
The authoring format of a Post body, stored verbatim and rendered at the edge.
_Avoid_: Content body, rich text
