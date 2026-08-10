# Proposal: Show attachments (files) in the record timeline

> Draft for a GitHub issue / discussion on `twentyhq/twenty`.
> This is our fork's implementation summary — ready to paste into an issue, and a
> clean PR branch (`feat/attachments-in-timeline`) is prepared in the fork.

---

## Feature request: attachments should appear in the record timeline

### Problem

In Twenty, uploaded files (the `Attachment` object) appear in the **Files** widget of a
record, but **never in the record timeline**. There is no setting to change this, and the
data model does not support it: `timelineActivity` has no `targetAttachmentId` column, and
attachment events are excluded from timeline processing entirely.

Users expect a simple "X added a file" entry in the timeline — exactly like
`linked-note.created` / `linked-task.created` already work for notes and tasks.

### Why it doesn't work today

1. `attachment` is a **system object** (`isSystem = true`), and system objects are
   excluded from timeline processing unless listed in
   `SYSTEM_OBJECTS_WITH_TIMELINE_ACTIVITIES` (which today contains only
   `noteTarget` / `taskTarget`).
2. Even if events were processed, `TimelineActivityService` only knows how to build
   `linked-*` payloads for note/task via their junction tables (`noteTarget` /
   `taskTarget`). Attachments carry their target directly on the record
   (`targetCompanyId`, `targetPersonId`, `targetOpportunityId`, ...), so no junction
   lookup is needed.
3. `timelineActivity` has no `targetAttachmentId` column, so attachments have no
   "self" timeline — only the linked activity on the target record makes sense.

### Proposed solution (minimal, no schema change)

1. Add `'attachment'` to `SYSTEM_OBJECTS_WITH_TIMELINE_ACTIVITIES`.
2. In `TimelineActivityService.transformEventsToTimelineActivityPayloads`, handle
   `objectSingularName === 'attachment'` and emit **only** linked activities:
   - read the target morph column (`target<X>Id`) directly from the attachment record
     (`event.properties.after` / `.before`),
   - emit `linked-attachment.created|updated|deleted` on the **target record**,
     mirroring the existing `computeTimelineActivityPayloadsForActivityTargets`
     (noteTarget/taskTarget) pattern,
   - do **not** emit a "self" activity (there is no `targetAttachmentId` column).
3. No frontend changes needed: `linked-*` activities are already rendered generically
   via `filterOutInvalidTimelineActivities` / the linked-record activity row.

### Diff footprint

Roughly +60 lines across two files, purely additive:

- `packages/twenty-server/src/modules/timeline/constants/system-objects-with-timeline-activities.constant.ts`
  — add `'attachment'` to the allow-list.
- `packages/twenty-server/src/modules/timeline/services/timeline-activity.service.ts`
  — add the `attachment` branch and a private
  `computeTimelineActivityPayloadsForAttachments` method (pattern-copy of the
  `noteTarget` path, but reading the target column from the attachment record).

### Notes / behavior

- Every attachment create/update/delete on a target record produces a
  `linked-attachment.*` timeline entry on that record (same as notes/tasks).
- `linkedRecordCachedName` = `attachment.name` (falls back to `file[0].label`).
- Deletion produces `linked-attachment.deleted` (uses `properties.before`).
- Verified end-to-end in a dev workspace: creating two files on a company yields two
  `linked-attachment.created` entries in the company timeline, and both files render in
  the Files widget (standard).

### Open questions for maintainers

- Should **all** attachments go to the timeline, or only a subset (e.g., by field /
  folder)? This implementation opts for all attachments, matching the "standard
  functions" behavior of notes/tasks.
- Is a `targetAttachmentId` column ever planned (attachments with their own timeline)?
  If so, the "self" payload could be added later.

---

Implementation branch in the fork: `feat/attachments-in-timeline`
(2 files, no docs, based on latest `main`).
