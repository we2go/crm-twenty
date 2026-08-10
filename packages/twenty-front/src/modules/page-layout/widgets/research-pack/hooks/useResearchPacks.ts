import { useMemo } from 'react';

import { useActivities } from '@/activities/hooks/useActivities';
import { FIND_MANY_TIMELINE_ACTIVITIES_ORDER_BY } from '@/activities/timeline-activities/constants/FindManyTimelineActivitiesOrderBy';
import { type ActivityTargetableObject } from '@/activities/types/ActivityTargetableEntity';
import { type Note } from '@/activities/types/Note';
import {
    CoreObjectNameSingular,
    type RecordGqlOperationVariables,
} from 'twenty-shared/types';

import { isResearchPackNote } from '../utils/isResearchPackNote';

export const useResearchPacks = (
  targetableObject: ActivityTargetableObject,
) => {
  const researchPacksQueryVariables = useMemo(
    () =>
      ({
        orderBy: FIND_MANY_TIMELINE_ACTIVITIES_ORDER_BY,
      }) as RecordGqlOperationVariables,
    [],
  );

  const { activities, loading, fetchMoreActivities, hasNextPage } =
    useActivities<Note>({
      objectNameSingular: CoreObjectNameSingular.Note,
      activityTargetsOrderByVariables: researchPacksQueryVariables.orderBy ?? [
        {},
      ],
      targetableObjects: [targetableObject],
      limit: 10,
    });

  const researchPacks = useMemo(
    () => (activities as Note[]).filter(isResearchPackNote),
    [activities],
  );

  return {
    researchPacks,
    loading,
    totalCountResearchPacks: researchPacks.length,
    fetchMoreResearchPacks: fetchMoreActivities,
    hasNextPage,
  };
};
