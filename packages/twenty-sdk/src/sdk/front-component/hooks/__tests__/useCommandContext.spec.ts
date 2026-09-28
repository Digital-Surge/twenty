import { describe, expect, expectTypeOf, it } from 'vitest';

import {
  type FrontComponentCommandContext,
  type FrontComponentExecutionContext,
  type FrontComponentTargetedRecordsRule,
  useCommandContext,
} from '@/sdk/front-component';
import { selectCommandContext } from '@/sdk/front-component/hooks/useCommandContext';
import { type RecordGqlOperationFilter } from 'twenty-shared/types';

const baseContext: FrontComponentExecutionContext = {
  frontComponentId: 'fc-1',
  userId: 'user-1',
  recordId: null,
  selectedRecordIds: [],
  timelineActivityId: null,
  colorScheme: 'light',
};

describe('FrontComponentExecutionContext command fields', () => {
  it('are optional, so a context without a command still type-checks', () => {
    expectTypeOf<
      FrontComponentExecutionContext['objectNameSingular']
    >().toEqualTypeOf<string | undefined>();
    expectTypeOf<
      FrontComponentExecutionContext['objectMetadataId']
    >().toEqualTypeOf<string | undefined>();
    expectTypeOf<
      FrontComponentExecutionContext['currentViewId']
    >().toEqualTypeOf<string | undefined>();
    expectTypeOf<
      FrontComponentExecutionContext['targetedRecordsRule']
    >().toEqualTypeOf<FrontComponentTargetedRecordsRule | undefined>();
    expectTypeOf<
      FrontComponentExecutionContext['recordFilter']
    >().toEqualTypeOf<RecordGqlOperationFilter | undefined>();

    expectTypeOf(baseContext).toMatchTypeOf<FrontComponentExecutionContext>();
  });

  it('describe the targeted records as a selection or an exclusion', () => {
    expectTypeOf<FrontComponentTargetedRecordsRule>().toEqualTypeOf<
      | { mode: 'selection'; selectedRecordIds: string[] }
      | { mode: 'exclusion'; excludedRecordIds: string[] }
    >();

    const rule: FrontComponentTargetedRecordsRule = {
      mode: 'exclusion',
      excludedRecordIds: ['person-3'],
    };

    if (rule.mode === 'exclusion') {
      expectTypeOf(rule.excludedRecordIds).toEqualTypeOf<string[]>();
    }

    const invalidRule: FrontComponentTargetedRecordsRule = {
      mode: 'exclusion',
      // @ts-expect-error an exclusion carries excludedRecordIds, not selectedRecordIds
      selectedRecordIds: [],
    };

    expect(invalidRule.mode).toBe('exclusion');
  });

  it('are the whole command context', () => {
    expectTypeOf<FrontComponentCommandContext>().toEqualTypeOf<{
      objectNameSingular?: string;
      objectMetadataId?: string;
      currentViewId?: string;
      targetedRecordsRule?: FrontComponentTargetedRecordsRule;
      recordFilter?: RecordGqlOperationFilter;
    }>();
    expectTypeOf(
      useCommandContext,
    ).returns.toEqualTypeOf<FrontComponentCommandContext>();
  });
});

describe('selectCommandContext', () => {
  it('gives undefined fields outside a command', () => {
    expect(selectCommandContext(baseContext)).toStrictEqual({
      objectNameSingular: undefined,
      objectMetadataId: undefined,
      currentViewId: undefined,
      targetedRecordsRule: undefined,
      recordFilter: undefined,
    });
  });

  it('gives the command context the host forwarded', () => {
    const context: FrontComponentExecutionContext = {
      ...baseContext,
      objectNameSingular: 'person',
      objectMetadataId: 'person-object-id',
      currentViewId: 'view-1',
      targetedRecordsRule: {
        mode: 'exclusion',
        excludedRecordIds: ['person-3'],
      },
      recordFilter: { not: { id: { in: ['person-3'] } } },
    };

    expect(selectCommandContext(context)).toStrictEqual({
      objectNameSingular: 'person',
      objectMetadataId: 'person-object-id',
      currentViewId: 'view-1',
      targetedRecordsRule: {
        mode: 'exclusion',
        excludedRecordIds: ['person-3'],
      },
      recordFilter: { not: { id: { in: ['person-3'] } } },
    });
  });

  it('returns the same object while the command context is unchanged', () => {
    const context: FrontComponentExecutionContext = {
      ...baseContext,
      currentViewId: 'view-1',
      targetedRecordsRule: {
        mode: 'selection',
        selectedRecordIds: ['person-1'],
      },
    };

    const commandContext = selectCommandContext(context);

    expect(selectCommandContext(context)).toBe(commandContext);
    // The host pushes a fresh (structured-cloned) context on every render.
    expect(selectCommandContext(structuredClone(context))).toBe(commandContext);
    expect(selectCommandContext({ ...context, colorScheme: 'dark' })).toBe(
      commandContext,
    );
  });

  it('returns a new object when the command context changes', () => {
    const context: FrontComponentExecutionContext = {
      ...baseContext,
      currentViewId: 'view-1',
    };

    const commandContext = selectCommandContext(context);
    const changedCommandContext = selectCommandContext({
      ...context,
      currentViewId: 'view-2',
    });

    expect(changedCommandContext).not.toBe(commandContext);
    expect(changedCommandContext.currentViewId).toBe('view-2');
  });
});
