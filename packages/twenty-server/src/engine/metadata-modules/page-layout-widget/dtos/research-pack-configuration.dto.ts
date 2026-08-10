import { Field, ObjectType } from '@nestjs/graphql';

import { IsIn, IsNotEmpty } from 'class-validator';

import { WidgetConfigurationType } from 'src/engine/metadata-modules/page-layout-widget/enums/widget-configuration-type.type';

@ObjectType('ResearchPackConfiguration')
export class ResearchPackConfigurationDTO {
  @Field(() => WidgetConfigurationType)
  @IsIn([WidgetConfigurationType.RESEARCH_PACK])
  @IsNotEmpty()
  configurationType: WidgetConfigurationType.RESEARCH_PACK;
}
