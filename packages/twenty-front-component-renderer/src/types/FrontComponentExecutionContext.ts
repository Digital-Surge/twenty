// The worker contract carries the SDK's context type as is, so fields added
// to it (such as the command context) reach the worker without a second copy.
export type { FrontComponentExecutionContext } from 'twenty-sdk/front-component';
