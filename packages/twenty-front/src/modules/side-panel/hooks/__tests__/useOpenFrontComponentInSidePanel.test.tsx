import { useOpenFrontComponentInSidePanel } from '@/side-panel/hooks/useOpenFrontComponentInSidePanel';
import { useSidePanelMenu } from '@/side-panel/hooks/useSidePanelMenu';
import { viewableFrontComponentCommandContextComponentState } from '@/side-panel/pages/front-component/states/viewableFrontComponentCommandContextComponentState';
import { viewableFrontComponentIdComponentState } from '@/side-panel/pages/front-component/states/viewableFrontComponentIdComponentState';
import { viewableFrontComponentRecordContextComponentState } from '@/side-panel/pages/front-component/states/viewableFrontComponentRecordContextComponentState';
import { act, renderHook } from '@testing-library/react';
import { createStore, Provider as JotaiProvider } from 'jotai';
import { type ReactNode } from 'react';
import { SidePanelPages } from 'twenty-shared/types';
import { IconMail } from 'twenty-ui/icon';

jest.mock('@/side-panel/hooks/useSidePanelMenu');

const COMMAND_CONTEXT = {
  currentViewId: 'view-1',
  targetedRecordsRule: {
    mode: 'exclusion' as const,
    excludedRecordIds: ['person-3'],
  },
  recordFilter: { not: { id: { in: ['person-3'] } } },
};

describe('useOpenFrontComponentInSidePanel', () => {
  const mockNavigateSidePanelMenu = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useSidePanelMenu as jest.Mock).mockReturnValue({
      navigateSidePanelMenu: mockNavigateSidePanelMenu,
    });
  });

  const renderOpenFrontComponentHook = (
    store: ReturnType<typeof createStore>,
  ) =>
    renderHook(() => useOpenFrontComponentInSidePanel(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <JotaiProvider store={store}>{children}</JotaiProvider>
      ),
    });

  const getOpenedPageId = (callIndex = 0): string =>
    mockNavigateSidePanelMenu.mock.calls[callIndex][0].pageId;

  const getCommandContextOfPage = (
    store: ReturnType<typeof createStore>,
    instanceId: string,
  ) =>
    store.get(
      viewableFrontComponentCommandContextComponentState.atomFamily({
        instanceId,
      }),
    );

  it('stores the command context on the page it opens', () => {
    const store = createStore();
    const { result } = renderOpenFrontComponentHook(store);

    act(() => {
      result.current.openFrontComponentInSidePanel({
        frontComponentId: 'fc-1',
        pageTitle: 'Send marketing email',
        pageIcon: IconMail,
        commandContext: {
          commandContext: COMMAND_CONTEXT,
          sourceApplicationId: 'app-1',
        },
      });
    });

    const instanceId = getOpenedPageId();

    expect(mockNavigateSidePanelMenu).toHaveBeenCalledWith(
      expect.objectContaining({
        page: SidePanelPages.ViewFrontComponent,
        pageId: instanceId,
      }),
    );
    expect(
      store.get(
        viewableFrontComponentIdComponentState.atomFamily({ instanceId }),
      ),
    ).toBe('fc-1');
    expect(
      store.get(
        viewableFrontComponentCommandContextComponentState.atomFamily({
          instanceId,
        }),
      ),
    ).toEqual({
      commandContext: COMMAND_CONTEXT,
      sourceApplicationId: 'app-1',
    });
  });

  it('stores no command context when none is given', () => {
    const store = createStore();
    const { result } = renderOpenFrontComponentHook(store);

    act(() => {
      result.current.openFrontComponentInSidePanel({
        frontComponentId: 'fc-1',
        pageTitle: 'Lead',
        pageIcon: IconMail,
        recordContext: { recordId: 'lead-1', objectNameSingular: 'lead' },
      });
    });

    const instanceId = getOpenedPageId();

    expect(
      store.get(
        viewableFrontComponentRecordContextComponentState.atomFamily({
          instanceId,
        }),
      ),
    ).toEqual({ recordId: 'lead-1', objectNameSingular: 'lead' });
    expect(
      store.get(
        viewableFrontComponentCommandContextComponentState.atomFamily({
          instanceId,
        }),
      ),
    ).toBeNull();
  });

  it('keeps each page its own command context', () => {
    const store = createStore();
    const { result } = renderOpenFrontComponentHook(store);

    act(() => {
      result.current.openFrontComponentInSidePanel({
        frontComponentId: 'fc-1',
        pageTitle: 'Page A',
        pageIcon: IconMail,
        commandContext: {
          commandContext: COMMAND_CONTEXT,
          sourceApplicationId: 'app-1',
        },
      });
    });

    act(() => {
      result.current.openFrontComponentInSidePanel({
        frontComponentId: 'fc-2',
        pageTitle: 'Page B',
        pageIcon: IconMail,
      });
    });

    const pageAInstanceId = getOpenedPageId(0);
    const pageBInstanceId = getOpenedPageId(1);

    expect(pageBInstanceId).not.toBe(pageAInstanceId);
    expect(getCommandContextOfPage(store, pageBInstanceId)).toBeNull();
    expect(getCommandContextOfPage(store, pageAInstanceId)).toEqual({
      commandContext: COMMAND_CONTEXT,
      sourceApplicationId: 'app-1',
    });
  });
});
