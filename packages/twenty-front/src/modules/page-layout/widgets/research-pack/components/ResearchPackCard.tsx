import { CustomResolverFetchMoreLoader } from '@/activities/components/CustomResolverFetchMoreLoader';
import { SkeletonLoader } from '@/activities/components/SkeletonLoader';
import { NoteList } from '@/activities/notes/components/NoteList';
import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { useObjectPermissionsForObject } from '@/object-record/hooks/useObjectPermissionsForObject';
import { usePublishWidgetHeaderInfo } from '@/page-layout/widgets/hooks/usePublishWidgetHeaderInfo';
import { useTargetRecord } from '@/ui/layout/contexts/useTargetRecord';
import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { useMemo } from 'react';
import {
    AnimatedPlaceholder,
    AnimatedPlaceholderEmptyContainer,
    AnimatedPlaceholderEmptySubTitle,
    AnimatedPlaceholderEmptyTextContainer,
    AnimatedPlaceholderEmptyTitle,
} from 'twenty-ui/feedback';
import { IconPuzzle } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/input';

import { useOpenCreateResearchPackDrawer } from '../hooks/useOpenCreateResearchPackDrawer';
import { useResearchPacks } from '../hooks/useResearchPacks';

const StyledResearchPacksContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  height: 100%;
  overflow: auto;
`;

export const ResearchPackCard = () => {
  const targetRecord = useTargetRecord();

  const {
    researchPacks,
    loading,
    totalCountResearchPacks,
    fetchMoreResearchPacks,
    hasNextPage,
  } = useResearchPacks(targetRecord);

  const handleLastRowVisible = async () => {
    if (hasNextPage) {
      await fetchMoreResearchPacks();
    }
  };

  const openCreateResearchPackDrawer = useOpenCreateResearchPackDrawer();

  const isResearchPacksEmpty = researchPacks.length === 0;

  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular: targetRecord.targetObjectNameSingular,
  });

  const objectPermissions = useObjectPermissionsForObject(
    objectMetadataItem.id,
  );

  const hasObjectUpdatePermissions = objectPermissions.canUpdateObjectRecords;

  const newResearchPackAction = useMemo(
    () =>
      hasObjectUpdatePermissions
        ? {
            Icon: IconPuzzle,
            label: t`New research`,
            onClick: () =>
              openCreateResearchPackDrawer({
                targetableObjects: [targetRecord],
              }),
          }
        : undefined,
    [hasObjectUpdatePermissions, openCreateResearchPackDrawer, targetRecord],
  );

  usePublishWidgetHeaderInfo({
    count: totalCountResearchPacks,
    primaryAction: newResearchPackAction,
  });

  if (loading && isResearchPacksEmpty) {
    return <SkeletonLoader />;
  }

  if (isResearchPacksEmpty) {
    return (
      <AnimatedPlaceholderEmptyContainer>
        <AnimatedPlaceholder type="noNote" />
        <AnimatedPlaceholderEmptyTextContainer>
          <AnimatedPlaceholderEmptyTitle>
            {t`No research packs`}
          </AnimatedPlaceholderEmptyTitle>
          <AnimatedPlaceholderEmptySubTitle>
            {t`There are no research packs associated with this record.`}
          </AnimatedPlaceholderEmptySubTitle>
        </AnimatedPlaceholderEmptyTextContainer>
        {hasObjectUpdatePermissions && (
          <Button
            Icon={IconPuzzle}
            title={t`New research`}
            variant="secondary"
            onClick={() =>
              openCreateResearchPackDrawer({
                targetableObjects: [targetRecord],
              })
            }
          />
        )}
      </AnimatedPlaceholderEmptyContainer>
    );
  }

  return (
    <StyledResearchPacksContainer>
      <NoteList notes={researchPacks} />
      <CustomResolverFetchMoreLoader
        loading={loading}
        onLastRowVisible={handleLastRowVisible}
      />
    </StyledResearchPacksContainer>
  );
};
