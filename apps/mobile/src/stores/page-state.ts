import { defineStore } from 'pinia';
import { ref } from 'vue';

export type CachedPageKey =
  | 'home'
  | 'explore'
  | 'records'
  | 'profile'
  | 'favorites'
  | 'settings'
  | 'lucky';

const DEFAULT_KEYS: CachedPageKey[] = [
  'home',
  'explore',
  'records',
  'profile',
  'favorites',
  'settings',
  'lucky',
];

export const usePageStateStore = defineStore('page-state', () => {
  const versions = ref<Record<CachedPageKey, number>>({
    home: 1,
    explore: 1,
    records: 1,
    profile: 1,
    favorites: 1,
    settings: 1,
    lucky: 1,
  });

  function versionOf(key: CachedPageKey) {
    return versions.value[key];
  }

  function markDirty(keys: CachedPageKey | CachedPageKey[]) {
    const nextKeys = Array.isArray(keys) ? keys : [keys];

    nextKeys.forEach((key) => {
      versions.value[key] += 1;
    });
  }

  function markCoreDirty() {
    markDirty(DEFAULT_KEYS);
  }

  return {
    versionOf,
    markDirty,
    markCoreDirty,
  };
});
