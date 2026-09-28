import { EMPTY_COMMAND_MENU_CONTEXT_API } from '@/command-menu-item/constants/EmptyCommandMenuContextApi';
import {
  CommandMenuContext,
  type CommandMenuContextType,
} from '@/command-menu-item/contexts/CommandMenuContext';
import { type HeadlessEngineCommandContextApi } from '@/command-menu-item/engine-command/types/HeadlessCommandContextApi';
import { buildHeadlessCommandContextApi } from '@/command-menu-item/engine-command/utils/buildHeadlessCommandContextApi';
import { useCommandMenuItemClick } from '@/command-menu-item/hooks/useCommandMenuItemClick';
import { type CommandMenuItemDefinition } from '@/command-menu-item/types/CommandMenuItemDefinition';
import { CommandMenuItemContainerType } from '@/command-menu-item/types/CommandMenuItemContainerType';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { act, renderHook } from '@testing-library/react';
import { type ReactNode } from 'react';
import { IconMail } from 'twenty-ui/icon';
import {
  CommandMenuItemAvailabilityType,
  EngineComponentKey,
} from '~/generated-metadata/graphql';

const mockMountCommand = jest.fn();
const mockOpenFrontComponentInSidePanel = jest.fn();
const mockCloseCommandMenu = jest.fn();

jest.mock('@/command-menu-item/engine-command/hooks/useMountCommand', () => ({
  useMountCommand: () => mockMountCommand,
}));

jest.mock('@/side-panel/hooks/useOpenFrontComponentInSidePanel', () => ({
  useOpenFrontComponentInSidePanel: () => ({
    openFrontComponentInSidePanel: mockOpenFrontComponentInSidePanel,
  }),
}));

jest.mock('@/command-menu-item/hooks/useCloseCommandMenu', () => ({
  useCloseCommandMenu: () => ({ closeCommandMenu: mockCloseCommandMenu }),
}));

jest.mock(
  '@/ui/utilities/state/component-state/hooks/useAvailableComponentInstanceIdOrThrow',
  () => ({
    useAvailableComponentInstanceIdOrThrow: () => 'main-context-store',
  }),
);

jest.mock(
  '@/ui/utilities/state/jotai/hooks/useAtomFamilySelectorValue',
  () => ({
    useAtomFamilySelectorValue: () => false,
  }),
);

jest.mock('@/ui/utilities/state/jotai/hooks/useAtomFamilyStateValue', () => ({
  useAtomFamilyStateValue: () => undefined,
}));

jest.mock(
  '@/command-menu-item/engine-command/utils/buildHeadlessCommandContextApi',
);

const PERSON_OBJECT_METADATA_ITEM = {
  id: 'person-object-id',
  nameSingular: 'person',
  namePlural: 'people',
} as EnrichedObjectMetadataItem;

const RECORD_FILTER = {
  and: [{ city: { eq: 'Brisbane' } }, { not: { id: { in: ['person-3'] } } }],
};

const HEADLESS_CONTEXT: HeadlessEngineCommandContextApi = {
  engineComponentKey: EngineComponentKey.FRONT_COMPONENT_RENDERER,
  contextStoreInstanceId: 'main-context-store',
  objectMetadataItem: PERSON_OBJECT_METADATA_ITEM,
  currentViewId: 'view-1',
  recordIndexId: 'people-view-1',
  targetedRecordsRule: { mode: 'exclusion', excludedRecordIds: ['person-3'] },
  selectedRecords: [],
  graphqlFilter: RECORD_FILTER,
  payload: null,
  navigationTargetObjectMetadataId: null,
};

const buildItem = (isHeadless: boolean): CommandMenuItemDefinition => ({
  id: 'command-menu-item-1',
  applicationId: 'app-1',
  frontComponentId: 'fc-1',
  frontComponent: { id: 'fc-1', name: 'Send', isHeadless },
  engineComponentKey: EngineComponentKey.FRONT_COMPONENT_RENDERER,
  label: 'Send marketing email',
  position: 0,
  isPinned: false,
  availabilityType: CommandMenuItemAvailabilityType.RECORD_SELECTION,
  isActive: true,
});

const renderClickHook = (item: CommandMenuItemDefinition) => {
  const contextValue: CommandMenuContextType = {
    containerType: CommandMenuItemContainerType.CommandMenuList,
    displayType: 'listItem',
    commandMenuItems: [item],
    commandMenuContextApi: {
      ...EMPTY_COMMAND_MENU_CONTEXT_API,
      isSelectAll: true,
      objectMetadataItem: { nameSingular: 'person' },
    },
    isInPreviewMode: false,
  };

  return renderHook(
    () => useCommandMenuItemClick({ item, Icon: IconMail, label: item.label }),
    {
      wrapper: ({ children }: { children: ReactNode }) => (
        <CommandMenuContext.Provider value={contextValue}>
          {children}
        </CommandMenuContext.Provider>
      ),
    },
  );
};

describe('useCommandMenuItemClick', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (buildHeadlessCommandContextApi as jest.Mock).mockReturnValue(
      HEADLESS_CONTEXT,
    );
  });

  it('opens a side-panel front component with the command context', async () => {
    const { result } = renderClickHook(buildItem(false));

    await act(async () => {
      await result.current.handleClick();
    });

    expect(buildHeadlessCommandContextApi).toHaveBeenCalledWith(
      expect.objectContaining({
        contextStoreInstanceId: 'main-context-store',
        engineComponentKey: EngineComponentKey.FRONT_COMPONENT_RENDERER,
      }),
    );
    expect(mockOpenFrontComponentInSidePanel).toHaveBeenCalledWith({
      frontComponentId: 'fc-1',
      pageTitle: 'Send marketing email',
      pageIcon: IconMail,
      recordContext: undefined,
      commandContext: {
        commandContext: {
          objectNameSingular: 'person',
          objectMetadataId: 'person-object-id',
          currentViewId: 'view-1',
          targetedRecordsRule: {
            mode: 'exclusion',
            excludedRecordIds: ['person-3'],
          },
          recordFilter: RECORD_FILTER,
        },
      },
    });
    expect(
      mockOpenFrontComponentInSidePanel.mock.calls[0][0].commandContext,
    ).not.toHaveProperty('sourceApplicationId');
    expect(mockMountCommand).not.toHaveBeenCalled();
  });

  it('reads the command context before the command menu closes', async () => {
    const { result } = renderClickHook(buildItem(false));

    await act(async () => {
      await result.current.handleClick();
    });

    const [buildOrder] = (buildHeadlessCommandContextApi as jest.Mock).mock
      .invocationCallOrder;
    const [closeOrder] = mockCloseCommandMenu.mock.invocationCallOrder;

    expect(buildOrder).toBeLessThan(closeOrder);
    expect(closeOrder).toBeLessThan(
      mockOpenFrontComponentInSidePanel.mock.invocationCallOrder[0],
    );
  });

  it('still opens the side panel, without a context, when the context cannot be read', async () => {
    (buildHeadlessCommandContextApi as jest.Mock).mockImplementation(() => {
      throw new Error('context store not ready');
    });

    const { result } = renderClickHook(buildItem(false));

    await act(async () => {
      await result.current.handleClick();
    });

    expect(mockCloseCommandMenu).toHaveBeenCalled();
    expect(mockOpenFrontComponentInSidePanel).toHaveBeenCalledWith({
      frontComponentId: 'fc-1',
      pageTitle: 'Send marketing email',
      pageIcon: IconMail,
      recordContext: undefined,
      commandContext: undefined,
    });
  });

  it('still mounts a headless front component through the command mount flow', async () => {
    const { result } = renderClickHook(buildItem(true));

    await act(async () => {
      await result.current.handleClick();
    });

    expect(mockMountCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        engineCommandId: 'command-menu-item-1',
        contextStoreInstanceId: 'main-context-store',
        frontComponentId: 'fc-1',
      }),
    );
    expect(buildHeadlessCommandContextApi).not.toHaveBeenCalled();
    expect(mockOpenFrontComponentInSidePanel).not.toHaveBeenCalled();
  });
});
