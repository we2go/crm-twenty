import { isResearchPackNote } from '@/page-layout/widgets/research-pack/utils/isResearchPackNote';

describe('isResearchPackNote', () => {
  it('should return true for notes whose title starts with the research prefix', () => {
    expect(isResearchPackNote({ title: 'Research: competitor analysis' })).toBe(
      true,
    );
    expect(isResearchPackNote({ title: 'Research' })).toBe(true);
    expect(isResearchPackNote({ title: 'research market entry' })).toBe(true);
  });

  it('should return false for notes without the research prefix', () => {
    expect(isResearchPackNote({ title: 'Follow-up call' })).toBe(false);
    expect(isResearchPackNote({ title: 'Pre-research notes' })).toBe(false);
  });

  it('should return false when the title is missing', () => {
    expect(isResearchPackNote({ title: null })).toBe(false);
    expect(isResearchPackNote({ title: undefined })).toBe(false);
  });
});
