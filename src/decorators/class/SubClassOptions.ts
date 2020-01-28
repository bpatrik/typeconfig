import {ToJSONOptions} from './base/IConfigClassBase';

export interface SubClassOptions extends ToJSONOptions {
  attachDescription?: boolean;
  attachDefaults?: boolean;
  enumsAsString?: boolean;
}
