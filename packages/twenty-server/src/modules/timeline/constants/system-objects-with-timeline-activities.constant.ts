export const SYSTEM_OBJECTS_WITH_TIMELINE_ACTIVITIES = [
  'noteTarget',
  'taskTarget',
  // Attachments are system objects but should surface on the timeline of the
  // record they are linked to (e.g. a research pack file on a company).
  'attachment',
];
