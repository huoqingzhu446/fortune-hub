import { ref } from 'vue';
import { fetchFavorites, toggleFavorite } from '../api/favorites';
import { getErrorMessage } from '../services/errors';
import { getAuthToken } from '../services/session';
import { usePageStateStore } from '../stores/page-state';
import type { ToggleFavoritePayload } from '../types/favorite';

export function useFavoriteToggle() {
  const favoriteActive = ref(false);
  const favoriteLoading = ref(false);
  const pageStateStore = usePageStateStore();

  async function syncFavoriteState(itemKey?: string) {
    if (!itemKey || !getAuthToken()) {
      favoriteActive.value = false;
      return;
    }

    try {
      const response = await fetchFavorites();
      favoriteActive.value = response.data.items.some((item) => item.itemKey === itemKey);
    } catch (error) {
      console.warn('sync favorite state failed', error);
      favoriteActive.value = false;
    }
  }

  async function toggleCurrent(payload: ToggleFavoritePayload) {
    if (!getAuthToken()) {
      uni.navigateTo({
        url: '/pages/profile/index',
      });
      return false;
    }

    try {
      favoriteLoading.value = true;
      const response = await toggleFavorite(payload);
      favoriteActive.value = response.data.active;
      pageStateStore.markDirty(['explore', 'records', 'profile', 'favorites']);

      uni.showToast({
        title: response.data.active ? '已收藏' : '已取消',
        icon: 'none',
      });

      return response.data.active;
    } catch (error) {
      console.warn('toggle favorite failed', error);
      uni.showToast({
        title: getErrorMessage(error, '收藏失败'),
        icon: 'none',
      });
      return false;
    } finally {
      favoriteLoading.value = false;
    }
  }

  return {
    favoriteActive,
    favoriteLoading,
    syncFavoriteState,
    toggleCurrent,
  };
}
