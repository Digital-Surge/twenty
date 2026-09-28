import { FrontComponentRenderer } from '@/front-components/components/FrontComponentRenderer';
import { render } from '@testing-library/react';
import { type ReactNode } from 'react';
import { FindOneFrontComponentDocument } from '~/generated-metadata/graphql';

const mockUseQuery = jest.fn();
const mockUseFrontComponentExecutionContext = jest.fn();

jest.mock('@apollo/client/react', () => ({
  ...jest.requireActual('@apollo/client/react'),
  useQuery: (document: unknown, options: unknown) =>
    mockUseQuery(document, options),
}));

jest.mock('@/front-components/hooks/useFrontComponentExecutionContext', () => ({
  useFrontComponentExecutionContext: (params: unknown) =>
    mockUseFrontComponentExecutionContext(params),
}));

jest.mock('@/front-components/hooks/useOnFrontComponentUpdated', () => ({
  useOnFrontComponentUpdated: jest.fn(),
}));

jest.mock(
  '@/front-components/hooks/useOnApplicationSdkClientChecksumsUpdated',
  () => ({
    useOnApplicationSdkClientChecksumsUpdated: jest.fn(),
  }),
);

jest.mock(
  '@/front-components/media-session/hooks/useFrontComponentMediaSession',
  () => ({
    useFrontComponentMediaSession: () => ({ mediaSessionHost: undefined }),
  }),
);

jest.mock(
  '@/settings/logic-functions/hooks/useGetLogicFunctionHttpUrl',
  () => ({
    useGetLogicFunctionHttpUrl: () => ({
      functionsBaseUrl: 'http://localhost/s',
    }),
  }),
);

jest.mock(
  '@/front-components/components/FrontComponentApplicationTokenPairEffect',
  () => ({
    FrontComponentApplicationTokenPairEffect: () => null,
  }),
);

jest.mock(
  '@/front-components/components/FrontComponentLoadErrorToastEffect',
  () => ({
    FrontComponentLoadErrorToastEffect: () => null,
  }),
);

jest.mock(
  '@/front-components/components/FrontComponentRendererProvider',
  () => ({
    FrontComponentRendererProvider: ({ children }: { children: ReactNode }) =>
      children,
  }),
);

jest.mock('twenty-front-component-renderer', () => ({
  FrontComponentRenderer: () => <div data-testid="shared-renderer" />,
}));

jest.mock('twenty-ui/primitives/feedback', () => ({
  ...jest.requireActual('twenty-ui/primitives/feedback'),
  useToast: () => ({ enqueueToast: jest.fn() }),
}));

const COMMAND_CONTEXT = {
  objectNameSingular: 'person',
  objectMetadataId: 'person-object-id',
  currentViewId: 'view-1',
  targetedRecordsRule: {
    mode: 'selection' as const,
    selectedRecordIds: ['person-1'],
  },
  recordFilter: { id: { in: ['person-1'] } },
};

const mockFindOneFrontComponent = (applicationId: string) => {
  mockUseQuery.mockImplementation((document: unknown) =>
    document === FindOneFrontComponentDocument
      ? {
          data: {
            frontComponent: {
              id: 'fc-1',
              applicationId,
              usesSdkClient: false,
              builtComponentChecksum: 'checksum',
              frontComponentSharedDependenciesChecksum: null,
              applicationTokenPair: null,
              applicationVariables: null,
            },
          },
          loading: false,
          error: undefined,
        }
      : { data: undefined, loading: false, error: undefined },
  );
};

const getCommandContextGiven = () =>
  mockUseFrontComponentExecutionContext.mock.lastCall?.[0].commandContext;

describe('FrontComponentRenderer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFrontComponentExecutionContext.mockReturnValue({
      executionContext: {},
      frontComponentHostCommunicationApi: {},
      storageNamespace: undefined,
    });
  });

  it('withholds a handed-off command context from a front component of another application', () => {
    mockFindOneFrontComponent('app-2');

    render(
      <FrontComponentRenderer
        frontComponentId="fc-1"
        commandContext={COMMAND_CONTEXT}
        commandContextSourceApplicationId="app-1"
      />,
    );

    expect(mockUseFrontComponentExecutionContext).toHaveBeenCalledWith(
      expect.objectContaining({
        frontComponentId: 'fc-1',
        applicationId: 'app-2',
      }),
    );
    expect(getCommandContextGiven()).toBeUndefined();
  });

  it('gives a handed-off command context to a front component of the same application', () => {
    mockFindOneFrontComponent('app-1');

    render(
      <FrontComponentRenderer
        frontComponentId="fc-1"
        commandContext={COMMAND_CONTEXT}
        commandContextSourceApplicationId="app-1"
      />,
    );

    expect(getCommandContextGiven()).toBe(COMMAND_CONTEXT);
  });

  it('gives a command context that comes straight from a command', () => {
    mockFindOneFrontComponent('app-2');

    render(
      <FrontComponentRenderer
        frontComponentId="fc-1"
        commandContext={COMMAND_CONTEXT}
      />,
    );

    expect(getCommandContextGiven()).toBe(COMMAND_CONTEXT);
  });
});
