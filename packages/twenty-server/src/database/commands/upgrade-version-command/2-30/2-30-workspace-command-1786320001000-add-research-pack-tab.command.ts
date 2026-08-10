import { Command } from 'nest-commander';

import { STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS } from 'twenty-shared/metadata';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { getStandardFlatEntitiesToCreateOrThrow } from 'src/database/commands/upgrade-version-command/2-10/utils/get-standard-flat-entities-to-create-or-throw.util';
import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { type FlatPageLayoutTab } from 'src/engine/metadata-modules/flat-page-layout-tab/types/flat-page-layout-tab.type';
import { type FlatPageLayoutWidget } from 'src/engine/metadata-modules/flat-page-layout-widget/types/flat-page-layout-widget.type';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { computeTwentyStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/twenty-standard-application/utils/twenty-standard-application-all-flat-entity-maps.constant';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';

const RESEARCH_PACK_TAB_UNIVERSAL_IDENTIFIERS = [
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.companyRecordPage.tabs.researchPack
    .universalIdentifier,
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.personRecordPage.tabs.researchPack
    .universalIdentifier,
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.opportunityRecordPage.tabs
    .researchPack.universalIdentifier,
];

const RESEARCH_PACK_WIDGET_UNIVERSAL_IDENTIFIERS = [
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.companyRecordPage.tabs.researchPack
    .widgets.researchPack.universalIdentifier,
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.personRecordPage.tabs.researchPack
    .widgets.researchPack.universalIdentifier,
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.opportunityRecordPage.tabs
    .researchPack.widgets.researchPack.universalIdentifier,
];

@RegisteredWorkspaceCommand('2.30.0', 1786320001000)
@Command({
  name: 'upgrade:2-30:add-research-pack-tab',
  description:
    'Adds the Research Pack tab/widget to the standard company, person and opportunity record page layouts',
})
export class AddResearchPackTabCommand extends ProvisionedWorkspaceCommandRunner {
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

    const { twentyStandardFlatApplication } =
      await this.applicationService.findWorkspaceTwentyStandardAndCustomApplicationOrThrow(
        { workspaceId },
      );

    const { flatPageLayoutTabMaps, flatPageLayoutWidgetMaps } =
      await this.workspaceCacheService.getOrRecompute(workspaceId, [
        'flatPageLayoutTabMaps',
        'flatPageLayoutWidgetMaps',
      ]);

    const { allFlatEntityMaps: standardAllFlatEntityMaps } =
      computeTwentyStandardApplicationAllFlatEntityMaps({
        now: new Date().toISOString(),
        workspaceId,
        twentyStandardApplicationId: twentyStandardFlatApplication.id,
      });

    const pageLayoutTabsToCreate =
      getStandardFlatEntitiesToCreateOrThrow<FlatPageLayoutTab>({
        standardFlatEntityMaps: standardAllFlatEntityMaps.flatPageLayoutTabMaps,
        existingFlatEntityMaps: flatPageLayoutTabMaps,
        universalIdentifiers: RESEARCH_PACK_TAB_UNIVERSAL_IDENTIFIERS,
      });

    const pageLayoutWidgetsToCreate =
      getStandardFlatEntitiesToCreateOrThrow<FlatPageLayoutWidget>({
        standardFlatEntityMaps:
          standardAllFlatEntityMaps.flatPageLayoutWidgetMaps,
        existingFlatEntityMaps: flatPageLayoutWidgetMaps,
        universalIdentifiers: RESEARCH_PACK_WIDGET_UNIVERSAL_IDENTIFIERS,
      });

    const totalOperationCount =
      pageLayoutTabsToCreate.length + pageLayoutWidgetsToCreate.length;

    if (totalOperationCount === 0) {
      this.logger.log(
        `Research Pack tab already present for workspace ${workspaceId}, skipping`,
      );

      return;
    }

    this.logger.log(
      `${isDryRun ? '[DRY RUN] ' : ''}Applying ${totalOperationCount} research pack layout operation(s) for workspace ${workspaceId}`,
    );

    if (isDryRun) {
      return;
    }

    const validateAndBuildResult =
      await this.workspaceMigrationValidateBuildAndRunService.validateBuildAndRunLegacyWorkspaceMigration(
        {
          isSystemBuild: true,
          applicationUniversalIdentifier:
            twentyStandardFlatApplication.universalIdentifier,
          workspaceId,
          allFlatEntityOperationByMetadataName: {
            pageLayoutTab: {
              flatEntityToCreate: pageLayoutTabsToCreate,
              flatEntityToDelete: [],
              flatEntityToUpdate: [],
            },
            pageLayoutWidget: {
              flatEntityToCreate: pageLayoutWidgetsToCreate,
              flatEntityToDelete: [],
              flatEntityToUpdate: [],
            },
          },
        },
      );

    if (validateAndBuildResult.status === 'fail') {
      throw new Error(
        `Failed to add the Research Pack tab for workspace ${workspaceId}: ${JSON.stringify(
          validateAndBuildResult,
          null,
          2,
        )}`,
      );
    }

    this.logger.log(
      `Added the Research Pack tab for workspace ${workspaceId}`,
    );
  }
}
