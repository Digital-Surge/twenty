import { SidePanelPageComponentInstanceContext } from '@/side-panel/states/contexts/SidePanelPageComponentInstanceContext';
import { createAtomComponentState } from '@/ui/utilities/state/jotai/utils/createAtomComponentState';
import { type FrontComponentCommandContext } from 'twenty-front-component-renderer';

export type ViewableFrontComponentCommandContext = {
  commandContext: FrontComponentCommandContext;
  // Set when a front component re-opened itself with its command context:
  // the context is only given to a front component of that application
  // (defence in depth on top of the same-component rule).
  sourceApplicationId?: string;
};

export const viewableFrontComponentCommandContextComponentState =
  createAtomComponentState<ViewableFrontComponentCommandContext | null>({
    key: 'side-panel/viewable-front-component-command-context',
    defaultValue: null,
    componentInstanceContext: SidePanelPageComponentInstanceContext,
  });
