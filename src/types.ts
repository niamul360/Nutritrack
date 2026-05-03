export interface FoodEntry {
  id?: string;
  userId: string;
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  date: string; // YYYY-MM-DD
  timestamp: any; // Firestore Timestamp
}

export interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  servingSize?: string;
}

export interface UserSettings {
  calorieGoal: number;
  displayName?: string;
  photoURL?: string;
  unitPreference?: 'metric' | 'imperial';
  macroRatios?: {
    protein: number; // percentage
    carbs: number; // percentage
    fats: number; // percentage
  };
  updatedAt: any;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}
