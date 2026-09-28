import { buildFrontComponentCommandContext } from '@/command-menu-item/engine-command/utils/buildFrontComponentCommandContext';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';

const personObjectMetadataItem = {
  id: 'person-object-id',
  nameSingular: 'person',
  namePlural: 'people',
} as EnrichedObjectMetadataItem;

describe('buildFrontComponentCommandContext', () => {
  it('should forward a selection with its view and id filter', () => {
    const selectedRecordIds = ['person-1', 'person-2'];

    const commandContext = buildFrontComponentCommandContext({
      objectMetadataItem: personObjectMetadataItem,
      currentViewId: 'view-1',
      targetedRecordsRule: { mode: 'selection', selectedRecordIds },
      graphqlFilter: { id: { in: selectedRecordIds } },
    });

    expect(commandContext).toStrictEqual({
      objectNameSingular: 'person',
      objectMetadataId: 'person-object-id',
      currentViewId: 'view-1',
      targetedRecordsRule: {
        mode: 'selection',
        selectedRecordIds: ['person-1', 'person-2'],
      },
      recordFilter: { id: { in: ['person-1', 'person-2'] } },
    });
    expect(
      commandContext.targetedRecordsRule?.mode === 'selection' &&
        commandContext.targetedRecordsRule.selectedRecordIds,
    ).not.toBe(selectedRecordIds);
  });

  it('should forward Select all as an exclusion with the computed view filter', () => {
    const recordFilter = {
      and: [
        { city: { eq: 'Brisbane' } },
        { not: { id: { in: ['person-3'] } } },
      ],
    };

    const commandContext = buildFrontComponentCommandContext({
      objectMetadataItem: personObjectMetadataItem,
      currentViewId: 'view-1',
      targetedRecordsRule: {
        mode: 'exclusion',
        excludedRecordIds: ['person-3'],
      },
      graphqlFilter: recordFilter,
    });

    expect(commandContext).toStrictEqual({
      objectNameSingular: 'person',
      objectMetadataId: 'person-object-id',
      currentViewId: 'view-1',
      targetedRecordsRule: {
        mode: 'exclusion',
        excludedRecordIds: ['person-3'],
      },
      recordFilter,
    });
  });

  it('should give an empty filter for Select all on a view without filters', () => {
    const commandContext = buildFrontComponentCommandContext({
      objectMetadataItem: personObjectMetadataItem,
      currentViewId: 'view-1',
      targetedRecordsRule: { mode: 'exclusion', excludedRecordIds: [] },
      graphqlFilter: undefined,
    });

    expect(commandContext.recordFilter).toStrictEqual({});
  });

  it('should name the object the filter is over', () => {
    const commandContext = buildFrontComponentCommandContext({
      objectMetadataItem: personObjectMetadataItem,
      currentViewId: null,
      targetedRecordsRule: { mode: 'selection', selectedRecordIds: [] },
      graphqlFilter: { id: { in: [] } },
    });

    expect(commandContext.objectNameSingular).toBe('person');
    expect(commandContext.objectMetadataId).toBe('person-object-id');
    expect('currentViewId' in commandContext).toBe(false);
  });

  it('should leave out the object, the view and the filter when there is no view or object', () => {
    const commandContext = buildFrontComponentCommandContext({
      objectMetadataItem: null,
      currentViewId: null,
      targetedRecordsRule: { mode: 'selection', selectedRecordIds: [] },
      graphqlFilter: null,
    });

    expect(commandContext).toStrictEqual({
      targetedRecordsRule: { mode: 'selection', selectedRecordIds: [] },
    });
    expect('objectNameSingular' in commandContext).toBe(false);
    expect('objectMetadataId' in commandContext).toBe(false);
    expect('currentViewId' in commandContext).toBe(false);
    expect('recordFilter' in commandContext).toBe(false);
  });

  it('should survive the structured clone that carries it to the worker', () => {
    const commandContext = buildFrontComponentCommandContext({
      objectMetadataItem: personObjectMetadataItem,
      currentViewId: 'view-1',
      targetedRecordsRule: {
        mode: 'exclusion',
        excludedRecordIds: ['person-3'],
      },
      graphqlFilter: { not: { id: { in: ['person-3'] } } },
    });

    expect(structuredClone(commandContext)).toStrictEqual(commandContext);
    expect(JSON.parse(JSON.stringify(commandContext))).toStrictEqual(
      commandContext,
    );
  });
});
