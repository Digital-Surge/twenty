import { type AppLocale } from 'twenty-shared/translations';
import { type RecordGqlOperationFilter } from 'twenty-shared/types';

/**
 * The records a command targets, as the user chose them in the view.
 * - `selection`: the records the user ticked.
 * - `exclusion`: the user pressed "Select all": every record matching the
 *   view's filters, except the ones they unticked afterwards.
 */
export type FrontComponentTargetedRecordsRule =
  | {
      mode: 'selection';
      selectedRecordIds: string[];
    }
  | {
      mode: 'exclusion';
      excludedRecordIds: string[];
    };

export type FrontComponentExecutionContext = {
  frontComponentId: string;
  userId: string | null;
  /**
   * @deprecated Use `selectedRecordIds` instead. Derive single record as `selectedRecordIds.length === 1 ? selectedRecordIds[0] : null`.
   */
  recordId: string | null;
  /** All selected record IDs */
  selectedRecordIds: string[];
  timelineActivityId: string | null;
  /** Resolved color scheme of the host UI ('System' is already resolved) */
  colorScheme: 'light' | 'dark';
  locale?: AppLocale;
  /**
   * The object the command was run on (e.g. 'person'): what
   * `targetedRecordsRule` and `recordFilter` are about. Set only when the
   * front component was opened from a command on an object's records;
   * undefined otherwise.
   */
  objectNameSingular?: string;
  /** The metadata id of that object. Set alongside `objectNameSingular`. */
  objectMetadataId?: string;
  /**
   * The view the command was run from. Set only when the front component was
   * opened from a command and the command was run on a view; undefined
   * otherwise (and on hosts that do not forward the command context).
   */
  currentViewId?: string;
  /**
   * Which records the command targets. Set only when the front component was
   * opened from a command; undefined otherwise (and on hosts that do not
   * forward the command context).
   */
  targetedRecordsRule?: FrontComponentTargetedRecordsRule;
  /**
   * The record filter the host computed for the command: in `exclusion` mode
   * the view's filters (saved and unsaved), its search and `not id in
   * excludedRecordIds`; in `selection` mode `id in selectedRecordIds`. `{}`
   * means every record of the object. Set only when the front component was
   * opened from a command on an object's records; undefined otherwise.
   */
  recordFilter?: RecordGqlOperationFilter;
};

/**
 * The part of the execution context that describes the command a front
 * component was opened from. A snapshot taken when the command was run.
 */
export type FrontComponentCommandContext = Pick<
  FrontComponentExecutionContext,
  | 'objectNameSingular'
  | 'objectMetadataId'
  | 'currentViewId'
  | 'targetedRecordsRule'
  | 'recordFilter'
>;
