import { type FieldDefinition } from '@/object-record/record-field/ui/types/FieldDefinition';
import { type FieldMetadata } from '@/object-record/record-field/ui/types/FieldMetadata';
import { isFieldAddress } from '@/object-record/record-field/ui/types/guards/isFieldAddress';
import { isFieldBoolean } from '@/object-record/record-field/ui/types/guards/isFieldBoolean';
import { isFieldCurrency } from '@/object-record/record-field/ui/types/guards/isFieldCurrency';
import { isFieldDate } from '@/object-record/record-field/ui/types/guards/isFieldDate';
import { isFieldDateTime } from '@/object-record/record-field/ui/types/guards/isFieldDateTime';
import { isFieldDisplayedAsPhone } from '@/object-record/record-field/ui/types/guards/isFieldDisplayedAsPhone';
import { isFieldEmails } from '@/object-record/record-field/ui/types/guards/isFieldEmails';
import { isFieldFullName } from '@/object-record/record-field/ui/types/guards/isFieldFullName';
import { isFieldLinks } from '@/object-record/record-field/ui/types/guards/isFieldLinks';
import { isFieldMultiSelect } from '@/object-record/record-field/ui/types/guards/isFieldMultiSelect';
import { isFieldNumber } from '@/object-record/record-field/ui/types/guards/isFieldNumber';
import { isFieldPhones } from '@/object-record/record-field/ui/types/guards/isFieldPhones';
import { isFieldRating } from '@/object-record/record-field/ui/types/guards/isFieldRating';
import { isFieldRelation } from '@/object-record/record-field/ui/types/guards/isFieldRelation';
import { isFieldRichText } from '@/object-record/record-field/ui/types/guards/isFieldRichText';
import { isFieldSelect } from '@/object-record/record-field/ui/types/guards/isFieldSelect';
import { isFieldText } from '@/object-record/record-field/ui/types/guards/isFieldText';
import { isUndefinedOrNull } from '~/utils/isUndefinedOrNull';

import { isFieldArray } from '@/object-record/record-field/ui/types/guards/isFieldArray';
import { isFieldFiles } from '@/object-record/record-field/ui/types/guards/isFieldFiles';
import { IconPencil, type IconComponent } from 'twenty-ui/icon';

export const getFieldButtonIcon = (
  fieldDefinition:
    | Pick<FieldDefinition<FieldMetadata>, 'type' | 'metadata'>
    | undefined
    | null,
): IconComponent | undefined => {
  if (isUndefinedOrNull(fieldDefinition)) return undefined;

  if (
    isFieldDisplayedAsPhone(fieldDefinition) ||
    isFieldMultiSelect(fieldDefinition) ||
    (isFieldRelation(fieldDefinition) &&
      fieldDefinition.metadata.relationObjectMetadataNameSingular !==
        'workspaceMember') ||
    isFieldLinks(fieldDefinition) ||
    isFieldEmails(fieldDefinition) ||
    isFieldArray(fieldDefinition) ||
    isFieldFiles(fieldDefinition) ||
    isFieldPhones(fieldDefinition) ||
    // Editable scalar fields — show the pencil edit button on hover
    isFieldText(fieldDefinition) ||
    isFieldNumber(fieldDefinition) ||
    isFieldDate(fieldDefinition) ||
    isFieldDateTime(fieldDefinition) ||
    isFieldBoolean(fieldDefinition) ||
    isFieldSelect(fieldDefinition) ||
    isFieldCurrency(fieldDefinition) ||
    isFieldRating(fieldDefinition) ||
    isFieldFullName(fieldDefinition) ||
    isFieldAddress(fieldDefinition) ||
    isFieldRichText(fieldDefinition)
  ) {
    return IconPencil;
  }
};
