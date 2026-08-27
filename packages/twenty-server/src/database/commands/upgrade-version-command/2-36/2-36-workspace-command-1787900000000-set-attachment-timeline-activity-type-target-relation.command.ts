import { Command } from 'nest-commander';
import { FieldMetadataType } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { hasTimelineActivityObjectMetadata } from 'src/database/commands/upgrade-version-command/2-34/utils/has-timeline-activity-object-metadata.util';
import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { type FlatTimelineActivityType } from 'src/engine/metadata-modules/flat-timeline-activity-type/types/flat-timeline-activity-type.type';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';

const STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER =
  '20202020-64aa-4b6f-b003-9c74b97cee20';
const ATTACHMENT_OBJECT_UNIVERSAL_IDENTIFIER =
  '20202020-bd3d-4c60-8dca-571c71d4447a';
const ATTACHMENT_TARGET_RELATION_FIELD_UNIVERSAL_IDENTIFIER =
  '721ddb1f-468d-535a-9809-cb3429a52e06';
const ATTACHMENT_TARGET_MORPH_ID = '20202020-f634-435d-ab8d-e1168b375c69';
const ATTACHMENT_TIMELINE_ACTIVITY_TYPE_UNIVERSAL_IDENTIFIERS = [
  '20202020-0d1a-4f0e-8a55-1c0a2f0a2c11', // attachmentLinked
  '20202020-0d1a-4f0e-8a55-1c0a2f0a2c12', // attachmentUnlinked
] as const;

// =============================================================================
// Форковый кастом: «вложения на timeline связанной записи».
//
// Нативные типы attachmentLinked/attachmentUnlinked добавляются апстримом в
// 2.34/2.35 через морф-отношение target объекта attachment. При кросс-апгрейде
// (например, 2.30 → 2.36) провижининг может оставить у них NULL в
// targetRelationFieldUniversalIdentifier. Тогда rule-движок трактует их как
// SELF-правила на самом объекте attachment, и вложения НЕ появляются на
// timeline связанной записи.
//
// Команда чинит это: если target-отношение у attachment-типов не задано —
// проставляет морф-отношение target (по образцу нативных команд 2.34/2.35).
// buildTimelineActivityTargetJoinColumns раскрывает морф на ВСЕ таргеты
// (company, person, opportunity, custom и т.д.), т.е. поведение полностью
// совпадает со старым кастомом форка, но на нативном механизме (без двойной
// эмиссии). Идемпотентна.
// =============================================================================
@RegisteredWorkspaceCommand('2.36.0', 1787900000000)
@Command({
  name: 'upgrade:2-36:set-attachment-timeline-activity-type-target-relation',
  description:
    'Point attachmentLinked/attachmentUnlinked timeline activity types at the attachment target morph relation',
})
export class SetAttachmentTimelineActivityTypeTargetRelationCommand extends ProvisionedWorkspaceCommandRunner {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly applicationService: ApplicationService,
    private readonly workspaceCacheService: WorkspaceCacheService,
    private readonly workspaceMigrationValidateBuildAndRunService: WorkspaceMigrationValidateBuildAndRunService,
  ) {
    super(workspaceIteratorService);
  }

  override async runOnWorkspace({
    workspaceId,
    options,
  }: RunOnWorkspaceArgs): Promise<void> {
    const isDryRun = options.dryRun ?? false;

    const {
      flatFieldMetadataMaps,
      flatObjectMetadataMaps,
      flatTimelineActivityTypeMaps,
    } = await this.workspaceCacheService.getOrRecompute(workspaceId, [
      'flatFieldMetadataMaps',
      'flatObjectMetadataMaps',
      'flatTimelineActivityTypeMaps',
    ]);

    if (!hasTimelineActivityObjectMetadata(flatObjectMetadataMaps)) {
      return;
    }

    const flatTimelineActivityTypesToFix = ATTACHMENT_TIMELINE_ACTIVITY_TYPE_UNIVERSAL_IDENTIFIERS.map(
      (universalIdentifier) =>
        flatTimelineActivityTypeMaps.byUniversalIdentifier[
          universalIdentifier
        ],
    ).filter(
      (timelineActivityType) =>
        isDefined(timelineActivityType) &&
        !isDefined(timelineActivityType.targetRelationFieldUniversalIdentifier),
    );

    if (flatTimelineActivityTypesToFix.length === 0) {
      this.logger.log(
        `Attachment timeline activity types already have a target relation for workspace ${workspaceId}`,
      );

      return;
    }

    const attachmentObjectMetadata =
      flatObjectMetadataMaps.byUniversalIdentifier[
        ATTACHMENT_OBJECT_UNIVERSAL_IDENTIFIER
      ];
    const isAttachmentTargetMorphRelation = (
      fieldMetadata: (typeof flatFieldMetadataMaps.byUniversalIdentifier)[string],
    ) =>
      isDefined(fieldMetadata) &&
      isDefined(attachmentObjectMetadata) &&
      fieldMetadata.objectMetadataId === attachmentObjectMetadata.id &&
      fieldMetadata.type === FieldMetadataType.MORPH_RELATION &&
      fieldMetadata.morphId === ATTACHMENT_TARGET_MORPH_ID;
    const attachmentTargetRelationFieldMetadata = Object.values(
      flatFieldMetadataMaps.byUniversalIdentifier,
    )
      .filter(isDefined)
      .filter(isAttachmentTargetMorphRelation)
      .sort((firstFieldMetadata, secondFieldMetadata) => {
        const firstIsPreferred =
          firstFieldMetadata.universalIdentifier ===
          ATTACHMENT_TARGET_RELATION_FIELD_UNIVERSAL_IDENTIFIER;
        const secondIsPreferred =
          secondFieldMetadata.universalIdentifier ===
          ATTACHMENT_TARGET_RELATION_FIELD_UNIVERSAL_IDENTIFIER;

        if (firstIsPreferred !== secondIsPreferred) {
          return firstIsPreferred ? -1 : 1;
        }

        return firstFieldMetadata.universalIdentifier.localeCompare(
          secondFieldMetadata.universalIdentifier,
        );
      })[0];

    if (!isDefined(attachmentTargetRelationFieldMetadata)) {
      this.logger.warn(
        `No attachment target morph relation for workspace ${workspaceId}, skipping`,
      );

      return;
    }

    const now = new Date().toISOString();
    const flatTimelineActivityTypesToUpdate: FlatTimelineActivityType[] =
      flatTimelineActivityTypesToFix.map((timelineActivityType) => ({
        ...timelineActivityType,
        targetRelationFieldUniversalIdentifier:
          attachmentTargetRelationFieldMetadata.universalIdentifier,
        updatedAt: now,
      }));

    this.logger.log(
      `${isDryRun ? '[DRY RUN] Would set' : 'Setting'} attachment timeline activity type target relation for ${flatTimelineActivityTypesToUpdate.length} type(s) in workspace ${workspaceId}`,
    );

    if (isDryRun) {
      return;
    }

    const { twentyStandardFlatApplication } =
      await this.applicationService.findWorkspaceTwentyStandardAndCustomApplicationOrThrow(
        { workspaceId },
      );

    const result =
      await this.workspaceMigrationValidateBuildAndRunService.validateBuildAndRunWorkspaceMigration(
        {
          workspaceId,
          applicationUniversalIdentifier:
            STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
          allFlatEntityOperationByMetadataName: {
            timelineActivityType: {
              flatEntityToCreate: [],
              flatEntityToUpdate: flatTimelineActivityTypesToUpdate,
              flatEntityToDelete: [],
            },
          },
        },
      );

    if (result.status === 'fail') {
      throw new Error(
        `Failed to set attachment timeline activity type target relation for workspace ${workspaceId}:\n${JSON.stringify(result, null, 2)}`,
      );
    }

    this.logger.log(
      `Attachment timeline activity type target relation set for workspace ${workspaceId}`,
    );
  }
}
