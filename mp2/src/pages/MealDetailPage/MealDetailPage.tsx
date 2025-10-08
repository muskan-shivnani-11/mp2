import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getMealById } from '../../api/mealApi';
import type { MealDetail } from '../../types/meal';
import './MealDetailPage.css';

interface DetailState {
  list?: string[];
  index?: number;
  origin?: string;
}

const MealDetailPage = () => {
  const { mealId } = useParams<{ mealId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = location.state as DetailState | null;

  const [meal, setMeal] = useState<MealDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listState, setListState] = useState<{
    list: string[];
    index: number;
    origin?: string;
  } | null>(() => {
    if (locationState?.list && typeof locationState.index === 'number') {
      return {
        list: locationState.list,
        index: locationState.index,
        origin: locationState.origin,
      };
    }
    return null;
  });

  useEffect(() => {
    if (locationState?.list && typeof locationState.index === 'number') {
      setListState({
        list: locationState.list,
        index: locationState.index,
        origin: locationState.origin,
      });
    }
  }, [locationState]);

  useEffect(() => {
    if (!mealId) {
      return;
    }

    let active = true;
    const controller = new AbortController();

    setLoading(true);
    setError(null);

    getMealById(mealId, controller.signal)
      .then((result) => {
        if (!active) {
          return;
        }
        if (!result) {
          setError('We could not find that meal.');
          setMeal(null);
          return;
        }
        setMeal(result);
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setError('Something went wrong fetching the meal.');
        setMeal(null);
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
  }, [mealId]);

  const handleNavigate = (offset: number) => {
    if (!listState) {
      return;
    }

    const { list } = listState;
    if (list.length === 0) {
      return;
    }

    const nextIndex = ((listState.index + offset) % list.length + list.length) % list.length;
    const nextId = list[nextIndex];
    if (!nextId) {
      return;
    }

    setListState((current) =>
      current
        ? {
            ...current,
            index: nextIndex,
          }
        : null
    );

    navigate(`/meal/${nextId}`, {
      state: { list, index: nextIndex, origin: listState.origin },
      replace: true,
    });
  };

  const instructions = useMemo(() => {
    if (!meal?.instructions) {
      return [];
    }

    return meal.instructions
      .split(/\r?\n+/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
  }, [meal]);

  const canNavigate = listState && listState.list.length > 1;
  const navigationDisabled = !listState || listState.list.length === 0;

  return (
    <section className="meal-detail">
      {loading && <p className="meal-detail__status">Loading meal details...</p>}
      {error && <p className="meal-detail__error">{error}</p>}
      {!loading && !error && meal && (
        <>
          <div className="meal-detail__hero">
            <img src={meal.thumbnail} alt={meal.name} className="meal-detail__image" />
            <div className="meal-detail__summary">
              <h1 className="meal-detail__title">{meal.name}</h1>
              <div className="meal-detail__meta">
                <span className="meal-detail__meta-badge">
                  {meal.category ?? 'Uncategorized'}
                </span>
                <span className="meal-detail__meta-badge meal-detail__meta-badge--muted">
                  {meal.area ?? 'Unknown origin'}
                </span>
                {listState?.origin && (
                  <span className="meal-detail__meta-badge meal-detail__meta-badge--outline">
                    From {listState.origin}
                  </span>
                )}
              </div>
              {meal.tags.length > 0 && (
                <ul className="meal-detail__tags">
                  {meal.tags.map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>
              )}
              <div className="meal-detail__controls">
                <button
                  type="button"
                  onClick={() => handleNavigate(-1)}
                  disabled={navigationDisabled}
                >
                  ◀ Prev
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate(1)}
                  disabled={navigationDisabled}
                >
                  Next ▶
                </button>
              </div>
              {!canNavigate && !navigationDisabled && (
                <p className="meal-detail__hint">
                  Keep browsing to build a list for quick navigation.
                </p>
              )}
              {navigationDisabled && (
                <p className="meal-detail__hint">
                  Visit this page from the search or gallery to enable quick navigation.
                </p>
              )}
            </div>
          </div>

          <div className="meal-detail__content">
            <section className="meal-detail__section">
              <h2>Ingredients</h2>
              <ul className="meal-detail__ingredients">
                {meal.ingredients.map((item) => (
                  <li key={`${item.ingredient}-${item.measure}`}>
                    <span>{item.ingredient}</span>
                    <span className="meal-detail__measure">{item.measure || 'To taste'}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="meal-detail__section">
              <h2>Instructions</h2>
              <div className="meal-detail__instructions">
                {instructions.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </section>

            {(meal.youtube || meal.source) && (
              <section className="meal-detail__section meal-detail__links">
                <h2>Keep exploring</h2>
                <ul>
                  {meal.youtube && (
                    <li>
                      <a href={meal.youtube} target="_blank" rel="noreferrer">
                        Watch on YouTube
                      </a>
                    </li>
                  )}
                  {meal.source && (
                    <li>
                      <a href={meal.source} target="_blank" rel="noreferrer">
                        Visit original recipe
                      </a>
                    </li>
                  )}
                </ul>
              </section>
            )}
          </div>
        </>
      )}
    </section>
  );
};

export default MealDetailPage;
