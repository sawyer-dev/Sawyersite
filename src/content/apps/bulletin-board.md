---
title: Bulletin Board
summary: Leave a customized sticky note on a shared board. Notes are reviewed before they become public.
status: prototype
interaction: Compose a note, position it on the board, then submit it for approval.
entryComponent: bulletin-board
categories: [Community, Interactive]
updated: 2026-10-12
featured: true
limitations:
  - Requires an Apps Script web app deployment configured by the site owner.
  - Notes are plain text, limited in length, and appear only after manual approval.
  - Visitors cannot edit or remove a note after submitting it.
---

## How it works

Choose a name, write a short message, and adjust the note's font, size, colors, rotation, and position. The note is sent for review and appears on the public board only after approval.

## Privacy and moderation

No visitor account or email address is collected. Your name and message are stored in the owner's private Google Sheet while the note is awaiting review. If approved, they are displayed publicly. Rejected notes are deleted.

## Service status

This prototype needs the owner to create and configure the Google Sheet and deploy the accompanying Apps Script. The interface shows a setup message until its deployment URL is configured.
