import type { Plugin } from '../services/types';
import { pluginLabel } from './pluginCatalog';

/** Searching every available plugin at once is the default choice. */
export const ALL_PLUGINS = 'all-plugins';
export type PluginChoice = Plugin | typeof ALL_PLUGINS;
export const ALL_PLUGINS_LABEL = 'Todos os plugins';

/**
 * Header label of a plugin choice.
 * @example choiceLabel(ALL_PLUGINS) // 'Todos os plugins'
 */
export const choiceLabel = (choice: PluginChoice): string => (choice === ALL_PLUGINS ? ALL_PLUGINS_LABEL : pluginLabel(choice));
