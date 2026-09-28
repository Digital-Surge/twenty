import { type HeadlessEngineCommandContextApi } from '@/command-menu-item/engine-command/types/HeadlessCommandContextApi';
import { type FrontComponentCommandContext } from 'twenty-front-component-renderer';
import { isDefined } from 'twenty-shared/utils';

// The command context handed to an app's front component: a plain,
// structured-clonable snapshot of the object, the view, the targeted records
// and the record filter the command was run with.
export const buildFrontComponentCommandContext = ({
  objectMetadataItem,
  currentViewId,
  targetedRecordsRule,
  graphqlFilter,
}: Pick<
  HeadlessEngineCommandContextApi,
  | 'objectMetadataItem'
  | 'currentViewId'
  | 'targetedRecordsRule'
  | 'graphqlFilter'
>): FrontComponentCommandContext => ({
  ...(isDefined(objectMetadataItem)
    ? {
        objectNameSingular: objectMetadataItem.nameSingular,
        objectMetadataId: objectMetadataItem.id,
      }
    : {}),
  ...(isDefined(currentViewId) ? { currentViewId } : {}),
  targetedRecordsRule:
    targetedRecordsRule.mode === 'exclusion'
      ? {
          mode: 'exclusion',
          excludedRecordIds: [...targetedRecordsRule.excludedRecordIds],
        }
      : {
          mode: 'selection',
          selectedRecordIds: [...targetedRecordsRule.selectedRecordIds],
        },
  // Without an object there is no filter to give. With one, an empty filter
  // (Select all on a view without filters) means every record: {}.
  ...(isDefined(objectMetadataItem)
    ? { recordFilter: graphqlFilter ?? {} }
    : {}),
});
