import axios from 'axios';
import type {
  Ingredient,
  MealCategory,
  MealDetail,
  MealSummary,
  RawMeal,
} from '../types/meal';

const mealApi = axios.create({
  baseURL: 'https://www.themealdb.com/api/json/v1/1',
  timeout: 10000,
});

const toMealSummary = (meal: RawMeal, fallbackCategory?: string): MealSummary => ({
  id: meal.idMeal,
  name: meal.strMeal,
  category: meal.strCategory ?? fallbackCategory ?? null,
  area: meal.strArea ?? null,
  thumbnail: meal.strMealThumb,
});

const buildIngredients = (meal: RawMeal): Ingredient[] => {
  const ingredients: Ingredient[] = [];

  for (let i = 1; i <= 20; i += 1) {
    const name = meal[`strIngredient${i}` as keyof RawMeal];
    const measure = meal[`strMeasure${i}` as keyof RawMeal];

    if (name && name.trim()) {
      ingredients.push({
        ingredient: name.trim(),
        measure: measure?.trim() ?? '',
      });
    }
  }

  return ingredients;
};

const toMealDetail = (meal: RawMeal): MealDetail => ({
  id: meal.idMeal,
  name: meal.strMeal,
  category: meal.strCategory ?? null,
  area: meal.strArea ?? null,
  thumbnail: meal.strMealThumb,
  instructions: meal.strInstructions ?? '',
  tags: meal.strTags ? meal.strTags.split(',').map((tag) => tag.trim()).filter(Boolean) : [],
  youtube: meal.strYoutube ?? null,
  source: meal.strSource ?? null,
  ingredients: buildIngredients(meal),
});

export async function searchMeals(query: string, signal?: AbortSignal): Promise<MealSummary[]> {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return [];
  }

  const response = await mealApi.get<{ meals: RawMeal[] | null }>('/search.php', {
    params: { s: trimmedQuery },
    signal,
  });

  const meals = response.data.meals ?? [];

  return meals.map((meal) => toMealSummary(meal));
}

export async function listMealCategories(signal?: AbortSignal): Promise<MealCategory[]> {
  const response = await mealApi.get<{ meals: MealCategory[] }>('/list.php', {
    params: { c: 'list' },
    signal,
  });

  return response.data.meals;
}

export async function filterMealsByCategory(
  category: string,
  signal?: AbortSignal
): Promise<MealSummary[]> {
  const response = await mealApi.get<{ meals: RawMeal[] | null }>('/filter.php', {
    params: { c: category },
    signal,
  });

  const meals = response.data.meals ?? [];

  return meals.map((meal) => toMealSummary(meal, category));
}

export async function getMealById(id: string, signal?: AbortSignal): Promise<MealDetail | null> {
  if (!id) {
    return null;
  }

  const response = await mealApi.get<{ meals: RawMeal[] | null }>('/lookup.php', {
    params: { i: id },
    signal,
  });

  const [meal] = response.data.meals ?? [];

  return meal ? toMealDetail(meal) : null;
}

export async function getRandomMeals(count: number, signal?: AbortSignal): Promise<MealSummary[]> {
  const promises = Array.from({ length: count }).map(() =>
    mealApi.get<{ meals: RawMeal[] | null }>('/random.php', { signal })
  );

  const responses = await Promise.allSettled(promises);

  return responses
    .map((result) => {
      if (result.status !== 'fulfilled') {
        return null;
      }

      const [meal] = result.value.data.meals ?? [];

      return meal ? toMealSummary(meal) : null;
    })
    .filter((meal): meal is MealSummary => Boolean(meal));
}
