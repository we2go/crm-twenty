import { RESEARCH_PACK_NOTE_TITLE_PREFIX } from '../constants/ResearchPackNoteTitlePrefix';

export const isResearchPackNote = (note: {
  title?: string | null;
}): boolean => {
  if (!note.title) {
    return false;
  }

  return note.title
    .trim()
    .toLowerCase()
    .startsWith(RESEARCH_PACK_NOTE_TITLE_PREFIX.toLowerCase());
};
