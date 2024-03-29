import {ToJSONOptions} from './base/IConfigClassBase';

export interface SubClassOptions<TAGS> extends ToJSONOptions<TAGS> {
  attachDescription?: boolean;
  attachState?: boolean;
  enumsAsString?: boolean;
  skipDefaultValues?: boolean;
  /**
   * If a property is set through cli or env variable, it becomes readonly
   */
  disableAutoReadonly?: boolean;
  /**
   * tracks readonly property, but do not use it for validation
   */
  /**
   Skips properties with the following tags
   */
  softReadonly?: boolean;
  /**
   Attaches the following tags to all properties
   */
  tags?: TAGS;
  /**
   Skips rendering (toJSON) properties with the following tags
   */
  skipTags?: TAGS;
  /**
   Keep properties with the following tags. If a tag is bot kept and skipped, it will be skipped.
   */
  keepTags?: TAGS;
}
