import { getPreferenceValues } from "@raycast/api";
import { RsyncOptions } from "../types/server";

/** Rsync-related preference keys (matches package.json preferences) */
interface RsyncPreferences {
  rsyncHumanReadable: boolean;
  rsyncProgress: boolean;
  rsyncDelete: boolean;
}

/**
 * Get rsync preferences from Raycast preferences.
 * @returns RsyncOptions object derived from preferences
 */
export function getRsyncPreferences(): RsyncOptions {
  const preferences = getPreferenceValues<RsyncPreferences>();
  return {
    humanReadable: preferences.rsyncHumanReadable,
    progress: preferences.rsyncProgress,
    delete: preferences.rsyncDelete,
  };
}
