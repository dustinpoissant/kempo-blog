# Changelog

All notable changes to `kempo-blog` are documented in this file.

## [Unreleased]

## [0.2.0] - 2026-11-09

Requires kempo 4.11.0 or later.

### Added

- **Two page builder widgets** in the Blog group: **Recent posts** (`k-blog-recent-posts-widget`), the latest published posts with a count and an optional category or tag, and **Post list** (`k-blog-post-list-widget`), published posts a page at a time with an optional category, tag or author. Neither offers a status, so a page cannot show drafts.
- The `kempo` peer dependency is now `>=4.11.0`, which page widgets need.
- **The page widgets are kempo-ui page builder widgets.** Their page components extend kempo-ui's `ShadowComponent`, and a page stores them as `kempo-blog-recent-posts` and `kempo-blog-post-list`. It needs the kempo release that has kempo-ui's page builder, and kempo-ui 1.3.1 or later (the `kempo-ui` peer dependency is now `>=1.3.1`).

### Fixed

- **Anonymous visitors could list drafts.** `GET /blog/api/posts` took a `status` from the address for everyone, so `?status=draft` returned drafts to anyone. Visitors without `posts:read` now always get published posts; a person with it can still ask for any status.
