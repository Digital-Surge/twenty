import { SidePanelFrontComponentPage } from '@/side-panel/pages/front-component/components/SidePanelFrontComponentPage';
import { viewableFrontComponentCommandContextComponentState } from '@/side-panel/pages/front-component/states/viewableFrontComponentCommandContextComponentState';
import { viewableFrontComponentIdComponentState } from '@/side-panel/pages/front-component/states/viewableFrontComponentIdComponentState';
import { viewableFrontComponentRecordContextComponentState } from '@/side-panel/pages/front-component/states/viewableFrontComponentRecordContextComponentState';
import { SidePanelPageComponentInstanceContext } from '@/side-panel/states/contexts/SidePanelPageComponentInstanceContext';
import { render, screen } from '@testing-library/react';
import { createStore, Provider as JotaiProvider } from 'jotai';

const mockFrontComponentRenderer = jest.fn();

jest.mock('@/front-components/components/FrontComponentRenderer', () => ({
  FrontComponentRenderer: (props: Record<string, unknown>) => {
    mockFrontComponentRenderer(props);

    return <div data-testid="front-component-renderer" />;
  },
}));

jest.mock('@/front-components/components/FrontComponentSkeletonLoader', () => ({
  FrontComponentSkeletonLoader: () => null,
}));

const PAGE_INSTANCE_ID = 'side-panel-page-1';

const COMMAND_CONTEXT = {
  currentViewId: 'view-1',
  targetedRecordsRule: {
    mode: 'selection' as const,
    selectedRecordIds: ['person-1', 'person-2'],
  },
  recordFilter: { id: { in: ['person-1', 'person-2'] } },
};

const renderPage = (store: ReturnType<typeof createStore>) =>
  render(
    <JotaiProvider store={store}>
      <SidePanelPageComponentInstanceContext.Provider
        value={{ instanceId: PAGE_INSTANCE_ID }}
      >
        <SidePanelFrontComponentPage />
      </SidePanelPageComponentInstanceContext.Provider>
    </JotaiProvider>,
  );

describe('SidePanelFrontComponentPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createPageStore = () => {
    const store = createStore();

    store.set(
      viewableFrontComponentIdComponentState.atomFamily({
        instanceId: PAGE_INSTANCE_ID,
      }),
      'fc-1',
    );

    return store;
  };

  it('renders the front component with the command context of its page', async () => {
    const store = createPageStore();

    store.set(
      viewableFrontComponentCommandContextComponentState.atomFamily({
        instanceId: PAGE_INSTANCE_ID,
      }),
      { commandContext: COMMAND_CONTEXT, sourceApplicationId: 'app-1' },
    );

    renderPage(store);

    await screen.findByTestId('front-component-renderer');

    expect(mockFrontComponentRenderer).toHaveBeenLastCalledWith(
      expect.objectContaining({
        frontComponentId: 'fc-1',
        selectedRecordIds: undefined,
        commandContext: COMMAND_CONTEXT,
        commandContextSourceApplicationId: 'app-1',
      }),
    );
  });

  it('keeps the single record context and gives no command context without one', async () => {
    const store = createPageStore();

    store.set(
      viewableFrontComponentRecordContextComponentState.atomFamily({
        instanceId: PAGE_INSTANCE_ID,
      }),
      { recordId: 'lead-1', objectNameSingular: 'lead' },
    );

    renderPage(store);

    await screen.findByTestId('front-component-renderer');

    expect(mockFrontComponentRenderer).toHaveBeenLastCalledWith(
      expect.objectContaining({
        frontComponentId: 'fc-1',
        selectedRecordIds: ['lead-1'],
        commandContext: undefined,
        commandContextSourceApplicationId: undefined,
      }),
    );
  });
});
