// 类型定义
export interface ProgressState {
  completedIds: number[];
  wrongIds: number[];
  favoriteIds: number[];
  moduleStats: Record<string, number>;
  examHistory: any[];
  practiceIndexByModule: Record<string, number>;
  schemaVersion: number;
}

const STORAGE_KEY = 'interview_app_v1';

export const storageService = {
  save(state: ProgressState) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  },
  
  load(): Partial<ProgressState> {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return {};
    
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load progress', e);
      return {};
    }
  }
};
