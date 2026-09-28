import { Suspense, lazy } from 'react';

import { FrontComponentSkeletonLoader } from '@/front-components/components/FrontComponentSkeletonLoader';
import { viewableFrontComponentCommandContextComponentState } from '@/side-panel/pages/front-component/states/viewableFrontComponentCommandContextComponentState';
import { viewableFrontComponentIdComponentState } from '@/side-panel/pages/front-component/states/viewableFrontComponentIdComponentState';
import { viewableFrontComponentRecordContextComponentState } from '@/side-panel/pages/front-component/states/viewableFrontComponentRecordContextComponentState';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { isDefined } from 'twenty-shared/utils';

const FrontComponentRenderer = lazy(() =>
  import('@/front-components/components/FrontComponentRenderer').then(
    (module) => ({ default: module.FrontComponentRenderer }),
  ),
);

export const SidePanelFrontComponentPage = () => {
  const viewableFrontComponentId = useAtomComponentStateValue(
    viewableFrontComponentIdComponentState,
  );

  const viewableFrontComponentRecordContext = useAtomComponentStateValue(
    viewableFrontComponentRecordContextComponentState,
  );

  const viewableFrontComponentCommandContext = useAtomComponentStateValue(
    viewableFrontComponentCommandContextComponentState,
  );

  if (!isDefined(viewableFrontComponentId)) {
    return null;
  }

  const selectedRecordIds = isDefined(
    viewableFrontComponentRecordContext?.recordId,
  )
    ? [viewableFrontComponentRecordContext.recordId]
    : undefined;

  return (
    <Suspense fallback={<FrontComponentSkeletonLoader />}>
      <FrontComponentRenderer
        frontComponentId={viewableFrontComponentId}
        selectedRecordIds={selectedRecordIds}
        commandContext={viewableFrontComponentCommandContext?.commandContext}
        commandContextSourceApplicationId={
          viewableFrontComponentCommandContext?.sourceApplicationId
        }
        loadingFallback={<FrontComponentSkeletonLoader />}
      />
    </Suspense>
  );
};
