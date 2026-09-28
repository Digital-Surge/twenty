import { getFrontComponentCommandContextForApplication } from '@/front-components/utils/getFrontComponentCommandContextForApplication';

const commandContext = {
  currentViewId: 'view-1',
  targetedRecordsRule: {
    mode: 'exclusion' as const,
    excludedRecordIds: ['person-3'],
  },
  recordFilter: { not: { id: { in: ['person-3'] } } },
};

describe('getFrontComponentCommandContextForApplication', () => {
  it('should give the context when it comes straight from a command', () => {
    expect(
      getFrontComponentCommandContextForApplication({
        commandContext,
        applicationId: 'app-1',
      }),
    ).toBe(commandContext);
  });

  it('should give a handed-off context to a front component of the same application', () => {
    expect(
      getFrontComponentCommandContextForApplication({
        commandContext,
        commandContextSourceApplicationId: 'app-1',
        applicationId: 'app-1',
      }),
    ).toBe(commandContext);
  });

  it('should withhold a handed-off context from another application', () => {
    expect(
      getFrontComponentCommandContextForApplication({
        commandContext,
        commandContextSourceApplicationId: 'app-1',
        applicationId: 'app-2',
      }),
    ).toBeUndefined();
  });

  it('should give nothing when there is no command context', () => {
    expect(
      getFrontComponentCommandContextForApplication({
        applicationId: 'app-1',
      }),
    ).toBeUndefined();
  });
});
