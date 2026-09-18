import { UserProfile, DailyLog, QuickFilterOption } from '../types';

export const DEFAULT_USER_PROFILE: UserProfile = {
  gender: 'male',
  age: 28,
  height: 175,
  weight: 68,
  activityLevel: 'light',
  weeklyWorkouts: 3,
  goal: 'fat_loss',
  dietaryPreferences: ['快手省时', '一人食好做', '家常少油'],
  dislikes: [],
  strictlyExclude: [],
  defaultServings: 1,
};

export const QUICK_FILTERS: QuickFilterOption[] = [
  {
    id: '15min',
    label: '15分钟',
    subtitle: '快手省时',
    iconName: 'Timer',
  },
  {
    id: 'single_person',
    label: '一人食',
    subtitle: '份量刚好',
    iconName: 'User',
  },
  {
    id: 'high_protein',
    label: '高蛋白',
    subtitle: '扎实饱腹',
    iconName: 'Flame',
  },
  {
    id: 'homestyle',
    label: '家常菜',
    subtitle: '经典少油',
    iconName: 'Utensils',
  },
];

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getInitialDailyLog(): DailyLog {
  return {
    date: getTodayDateString(),
    records: [
      {
        id: 'rec_breakfast_sample',
        mealType: 'breakfast',
        title: '晨间元气快手早餐',
        calories: 285,
        protein: 15.5,
        carbs: 34.0,
        fat: 8.5,
        timeString: '08:15',
        dishes: [
          { name: '水煮蛋 1个', calories: 75, protein: 6.5, carbs: 0.5, fat: 5.0 },
          { name: '全麦吐司面包 2片', calories: 150, protein: 5.5, carbs: 28.0, fat: 2.0 },
          { name: '纯低脂牛奶 200ml', calories: 60, protein: 3.5, carbs: 5.5, fat: 1.5 }
        ],
      },
    ],
  };
}
