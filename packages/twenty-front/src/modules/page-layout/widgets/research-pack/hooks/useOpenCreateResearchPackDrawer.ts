import { useCallback } from 'react';

import { isUpsertingActivityInDBState } from '@/activities/states/isCreatingActivityInDBState';
import { type ActivityTargetableObject } from '@/activities/types/ActivityTargetableEntity';
import { type Note } from '@/activities/types/Note';
import { type NoteTarget } from '@/activities/types/NoteTarget';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { findTargetFieldInfo } from '@/object-record/record-field/ui/utils/junction/findTargetFieldInfo';
import { viewableRecordIdState } from '@/object-record/record-side-panel/states/viewableRecordIdState';
import { viewableRecordNameSingularState } from '@/object-record/record-side-panel/states/viewableRecordNameSingularState';
import { useOpenRecordInSidePanel } from '@/side-panel/hooks/useOpenRecordInSidePanel';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import { CoreObjectNameSingular } from 'twenty-shared/types';

import { RESEARCH_PACK_NOTE_TITLE_PREFIX } from '../constants/ResearchPackNoteTitlePrefix';

export const useOpenCreateResearchPackDrawer = () => {
  const { createOneRecord: createOneResearchPack } = useCreateOneRecord<
    Note & { position: 'first' | 'last' }
  >({
    objectNameSingular: CoreObjectNameSingular.Note,
  });

  const { createOneRecord: createOneResearchPackTarget } =
    useCreateOneRecord<NoteTarget>({
      objectNameSingular: CoreObjectNameSingular.NoteTarget,
      shouldMatchRootQueryFilter: true,
    });

  const { objectMetadataItems } = useObjectMetadataItems();
  const { openRecordInSidePanel } = useOpenRecordInSidePanel();

  const setViewableRecordId = useSetAtomState(viewableRecordIdState);
  const setViewableRecordNameSingular = useSetAtomState(
    viewableRecordNameSingularState,
  );
  const setIsUpsertingActivityInDB = useSetAtomState(
    isUpsertingActivityInDBState,
  );

  const openCreateResearchPackDrawer = useCallback(
    async ({
      targetableObjects,
    }: {
      targetableObjects: ActivityTargetableObject[];
    }) => {
      const targetableObject = targetableObjects[0];

      setViewableRecordId(null);
      setViewableRecordNameSingular(CoreObjectNameSingular.Note);
      setIsUpsertingActivityInDB(true);

      const researchPack = await createOneResearchPack({
        title: RESEARCH_PACK_NOTE_TITLE_PREFIX,
        position: 'last',
      });

      if (targetableObjects.length > 0) {
        const noteTargetObjectMetadata = objectMetadataItems.find(
          (item) => item.nameSingular === CoreObjectNameSingular.NoteTarget,
        );

        const targetObjectMetadataItem = objectMetadataItems.find(
          (item) =>
            item.nameSingular === targetableObject.targetObjectNameSingular,
        );

        const targetFieldInfo = findTargetFieldInfo(
          noteTargetObjectMetadata?.fields ?? [],
          targetObjectMetadataItem?.id ?? '',
          objectMetadataItems,
        );

        const targetableObjectRelationIdName =
          targetFieldInfo?.joinColumnName ??
          `${targetableObject.targetObjectNameSingular}Id`;

        await createOneResearchPackTarget({
          noteId: researchPack.id,
          [targetableObjectRelationIdName]: targetableObject.id,
        });
      }

      openRecordInSidePanel({
        recordId: researchPack.id,
        objectNameSingular: CoreObjectNameSingular.Note,
        isNewRecord: true,
      });

      setViewableRecordId(researchPack.id);

      setIsUpsertingActivityInDB(false);
    },
    [
      createOneResearchPack,
      createOneResearchPackTarget,
      objectMetadataItems,
      openRecordInSidePanel,
      setViewableRecordId,
      setViewableRecordNameSingular,
      setIsUpsertingActivityInDB,
    ],
  );

  return openCreateResearchPackDrawer;
};
