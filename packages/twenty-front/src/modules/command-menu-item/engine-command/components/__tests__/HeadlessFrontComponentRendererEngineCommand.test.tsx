import { HeadlessFrontComponentRendererEngineCommand } from '@/command-menu-item/engine-command/components/HeadlessFrontComponentRendererEngineCommand';
import { useHeadlessCommandContextApi } from '@/command-menu-item/engine-command/hooks/useHeadlessCommandContextApi';
import { type HeadlessFrontComponentCommandContextApi } from '@/command-menu-item/engine-command/types/HeadlessCommandContextApi';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { render, screen } from '@testing-library/react';
import { EngineComponentKey } from '~/generated-metadata/graphql';

const mockFrontComponentRenderer = jest.fn();

jest.mock('@/front-components/components/FrontComponentRenderer', () => ({
  FrontComponentRenderer: (props: Record<string, unknown>) => {
    mockFrontComponentRenderer(props);

    return <div data-testid="front-component-renderer" />;
  },
}));

jest.mock(
  '@/command-menu-item/engine-command/hooks/useHeadlessCommandContextApi',
);

jest.mock(
  '@/ui/utilities/state/component-state/hooks/useAvailableComponentInstanceIdOrThrow',
  () => ({
    useAvailableComponentInstanceIdOrThrow: () => 'command-menu-item-1',
  }),
);

const buildContext = (
  overrides: Partial<HeadlessFrontComponentCommandContextApi>,
): HeadlessFrontComponentCommandContextApi => ({
  engineComponentKey: EngineComponentKey.FRONT_COMPONENT_RENDERER,
  contextStoreInstanceId: 'main-context-store',
  objectMetadataItem: {
    id: 'person-object-id',
    nameSingular: 'person',
    namePlural: 'people',
  } as EnrichedObjectMetadataItem,
  currentViewId: 'view-1',
  recordIndexId: 'people-view-1',
  targetedRecordsRule: { mode: 'selection', selectedRecordIds: [] },
  selectedRecords: [],
  graphqlFilter: null,
  payload: null,
  navigationTargetObjectMetadataId: null,
  frontComponentId: 'fc-1',
  ...overrides,
});

describe('HeadlessFrontComponentRendererEngineCommand', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('passes the selected ids and the command context of a selection', async () => {
    (useHeadlessCommandContextApi as jest.Mock).mockReturnValue(
      buildContext({
        targetedRecordsRule: {
          mode: 'selection',
          selectedRecordIds: ['person-1', 'person-2'],
        },
        selectedRecords: [
          { id: 'person-1', __typename: 'Person' },
          { id: 'person-2', __typename: 'Person' },
        ],
        graphqlFilter: { id: { in: ['person-1', 'person-2'] } },
      }),
    );

    render(<HeadlessFrontComponentRendererEngineCommand />);

    await screen.findByTestId('front-component-renderer');

    expect(mockFrontComponentRenderer).toHaveBeenLastCalledWith({
      frontComponentId: 'fc-1',
      commandMenuItemId: 'command-menu-item-1',
      selectedRecordIds: ['person-1', 'person-2'],
      commandContext: {
        objectNameSingular: 'person',
        objectMetadataId: 'person-object-id',
        currentViewId: 'view-1',
        targetedRecordsRule: {
          mode: 'selection',
          selectedRecordIds: ['person-1', 'person-2'],
        },
        recordFilter: { id: { in: ['person-1', 'person-2'] } },
      },
    });
  });

  it('passes Select all as an exclusion with the view filter and no selected ids', async () => {
    const recordFilter = {
      and: [
        { city: { eq: 'Brisbane' } },
        { not: { id: { in: ['person-3'] } } },
      ],
    };

    (useHeadlessCommandContextApi as jest.Mock).mockReturnValue(
      buildContext({
        targetedRecordsRule: {
          mode: 'exclusion',
          excludedRecordIds: ['person-3'],
        },
        graphqlFilter: recordFilter,
      }),
    );

    render(<HeadlessFrontComponentRendererEngineCommand />);

    await screen.findByTestId('front-component-renderer');

    expect(mockFrontComponentRenderer).toHaveBeenLastCalledWith(
      expect.objectContaining({
        selectedRecordIds: [],
        commandContext: {
          objectNameSingular: 'person',
          objectMetadataId: 'person-object-id',
          currentViewId: 'view-1',
          targetedRecordsRule: {
            mode: 'exclusion',
            excludedRecordIds: ['person-3'],
          },
          recordFilter,
        },
      }),
    );
  });
});
