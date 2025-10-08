import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { filterMealsByCategory, listMealCategories } from '../../api/mealApi';
import type { MealCategory, MealSummary } from '../../types/meal';
import './GalleryPage.css';

const GalleryPage = () => {
  const [categories, setCategories] = useState<MealCategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [meals, setMeals] = useState<MealSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    listMealCategories(controller.signal)
      .then((loadedCategories) => {
        if (!active) {
          return;
        }
        setCategories(loadedCategories);
        // Select the first category by default to populate the gallery.
        const [firstCategory] = loadedCategories;
        if (firstCategory) {
          setSelectedCategories([firstCategory.strCategory]);
        }
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setError('We could not load categories. Please refresh the page.');
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (selectedCategories.length === 0) {
      setMeals([]);
      return;
    }

    let active = true;
    const controller = new AbortController();

    setLoading(true);
    setError(null);

    Promise.all(
      selectedCategories.map((category) =>
        filterMealsByCategory(category, controller.signal)
      )
    )
      .then((results) => {
        if (!active) {
          return;
        }

        const uniqueMeals = new Map<string, MealSummary>();
        results.forEach((categoryMeals) => {
          categoryMeals.forEach((meal) => {
            uniqueMeals.set(meal.id, meal);
          });
        });

        setMeals(Array.from(uniqueMeals.values()));
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setError('Something went wrong fetching gallery meals.');
        setMeals([]);
      })
      .finally(() => {
        if (!active) {
          return;
        }
        setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [selectedCategories]);

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((current) => {
      if (current.includes(category)) {
        return current.filter((value) => value !== category);
      }
      return [...current, category];
    });
  };

  const mealIdList = useMemo(() => meals.map((meal) => meal.id), [meals]);

  return (
    <section className="gallery-page">
      <header className="gallery-page__intro">
        <h1 className="gallery-page__title">Meal Gallery</h1>
        <p className="gallery-page__subtitle">
          Pick one or more categories to curate a gallery of recipes with rich imagery.
        </p>
      </header>

      <div className="gallery-page__filters">
        <h2 className="gallery-page__filters-title">Filter by category</h2>
        <ul className="gallery-page__category-list">
          {categories.map((category) => {
            const isSelected = selectedCategories.includes(category.strCategory);
            return (
              <li key={category.strCategory}>
                <label className={isSelected ? 'gallery-page__chip gallery-page__chip--active' : 'gallery-page__chip'}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleCategoryToggle(category.strCategory)}
                  />
                  <span>{category.strCategory}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>

      {selectedCategories.length === 0 && (
        <p className="gallery-page__status">
          Select at least one category to populate the gallery.
        </p>
      )}
      {loading && <p className="gallery-page__status">Loading meals...</p>}
      {error && <p className="gallery-page__error">{error}</p>}
      {!loading && meals.length === 0 && selectedCategories.length > 0 && !error && (
        <p className="gallery-page__status">No meals available for the selected categories.</p>
      )}

      <div className="gallery-page__grid">
        {meals.map((meal, index) => (
          <Link
            key={meal.id}
            to={`/meal/${meal.id}`}
            state={{ list: mealIdList, index, origin: 'gallery' }}
            className="gallery-page__card"
          >
            <img src={meal.thumbnail} alt={meal.name} loading="lazy" />
            <div className="gallery-page__card-body">
              <h3>{meal.name}</h3>
              <p>{meal.category}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default GalleryPage;
