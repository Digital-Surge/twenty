import { type FrontComponentCommandContext } from 'twenty-front-component-renderer';
import { isDefined } from 'twenty-shared/utils';

// A command context handed off by a front component (re-opening itself)
// only reaches a front component of that same application.
export const getFrontComponentCommandContextForApplication = ({
  commandContext,
  commandContextSourceApplicationId,
  applicationId,
}: {
  commandContext?: FrontComponentCommandContext;
  commandContextSourceApplicationId?: string;
  applicationId: string;
}): FrontComponentCommandContext | undefined =>
  !isDefined(commandContextSourceApplicationId) ||
  commandContextSourceApplicationId === applicationId
    ? commandContext
    : undefined;
