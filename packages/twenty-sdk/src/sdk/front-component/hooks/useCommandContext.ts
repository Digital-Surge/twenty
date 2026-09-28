import {
  type FrontComponentCommandContext,
  type FrontComponentExecutionContext,
} from '../types/FrontComponentExecutionContext';
import { useFrontComponentExecutionContext } from './useFrontComponentExecutionContext';

let lastCommandContext:
  | { key: string; value: FrontComponentCommandContext }
  | undefined;

// The host pushes a new execution context object on every one of its
// renders, so the result is cached by content: the hook keeps returning the
// same object while the command context is unchanged.
export const selectCommandContext = (
  context: FrontComponentExecutionContext,
): FrontComponentCommandContext => {
  const commandContext: FrontComponentCommandContext = {
    objectNameSingular: context.objectNameSingular,
    objectMetadataId: context.objectMetadataId,
    currentViewId: context.currentViewId,
    targetedRecordsRule: context.targetedRecordsRule,
    recordFilter: context.recordFilter,
  };

  const key = JSON.stringify(commandContext);

  if (lastCommandContext?.key === key) {
    return lastCommandContext.value;
  }

  lastCommandContext = { key, value: commandContext };

  return commandContext;
};

/**
 * The context of the command this front component was opened from: the
 * object and the view it was run on, the targeted records and the record
 * filter the host computed. Every field is undefined outside a command, and
 * on hosts that do not forward the command context.
 */
export const useCommandContext = (): FrontComponentCommandContext => {
  return useFrontComponentExecutionContext(selectCommandContext);
};
