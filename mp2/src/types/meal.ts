export interface RawMeal {
  idMeal: string;
  strMeal: string;
  strDrinkAlternate?: string | null;
  strCategory: string | null;
  strArea: string | null;
  strInstructions: string | null;
  strMealThumb: string;
  strTags: string | null;
  strYoutube: string | null;
  strSource: string | null;
  [key: `strIngredient${number}`]: string | null | undefined;
  [key: `strMeasure${number}`]: string | null | undefined;
}

export interface Ingredient {
  ingredient: string;
  measure: string;
}

export interface MealSummary {
  id: string;
  name: string;
  category: string | null;
  area: string | null;
  thumbnail: string;
}

export interface MealDetail extends MealSummary {
  instructions: string;
  tags: string[];
  youtube: string | null;
  source: string | null;
  ingredients: Ingredient[];
}

export interface MealCategory {
  strCategory: string;
}
