import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getRandomMeals, searchMeals } from '../../api/mealApi';
import type { MealSummary } from '../../types/meal';
import './ListPage.css';

type SortKey = 'name' | 'category' | 'area';
type SortOrder = 'asc' | 'desc';

const SORT_LABELS: Record<SortKey, string> = {
  name: 'Name',
  category: 'Category',
  area: 'Region',
};

const sortMeals = (meals: MealSummary[], key: SortKey, order: SortOrder) => {
  const items = [...meals];
  const direction = order === 'asc' ? 1 : -1;

  return items.sort((a, b) => {
    let left: string | null = null;
    let right: string | null = null;

    if (key === 'name') {
      left = a.name;
      right = b.name;
    } else if (key === 'category') {
      left = a.category;
      right = b.category;
    } else if (key === 'area') {
      left = a.area;
      right = b.area;
    }

    const normalizedLeft = left ? left.toLowerCase() : '';
    const normalizedRight = right ? right.toLowerCase() : '';

    if (normalizedLeft === normalizedRight) {
      return 0;
    }

    return normalizedLeft > normalizedRight ? direction : -direction;
  });
};

const SORT_KEYS: SortKey[] = ['name', 'category', 'area'];

const ListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';
  const rawSortKey = searchParams.get('sort');
  const rawSortOrder = searchParams.get('order');

  const [query, setQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState<MealSummary[]>([]);
  const [featuredMeals, setFeaturedMeals] = useState<MealSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>(
    SORT_KEYS.includes(rawSortKey as SortKey) ? (rawSortKey as SortKey) : 'name'
  );
  const [sortOrder, setSortOrder] = useState<SortOrder>(
    rawSortOrder === 'desc' ? 'desc' : 'asc'
  );

  const syncSearchParams = (nextQueryValue: string, nextSortKeyValue: SortKey, nextSortOrderValue: SortOrder) => {
    const params = new URLSearchParams();

    if (nextQueryValue.trim()) {
      params.set('q', nextQueryValue.trim());
    }

    if (nextSortKeyValue !== 'name') {
      params.set('sort', nextSortKeyValue);
    }

    if (nextSortOrderValue !== 'asc') {
      params.set('order', nextSortOrderValue);
    }

    setSearchParams(params, { replace: true });
  };

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    getRandomMeals(8, controller.signal)
      .then((meals) => {
        if (!active) {
          return;
        }
        setFeaturedMeals(meals);
        setError(null);
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setError('We could not load featured meals. Please try again later.');
      })
      .finally(() => {
        if (!active) {
          return;
        }
        setInitialLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      const trimmedQuery = query.trim();

      if (!trimmedQuery) {
        setSearchResults([]);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      searchMeals(trimmedQuery, controller.signal)
        .then((meals) => {
          if (!active) {
            return;
          }
          setSearchResults(meals);
          setError(null);
        })
        .catch(() => {
          if (!active) {
            return;
          }
          setError('We could not complete that search. Please try again.');
          setSearchResults([]);
        })
        .finally(() => {
          if (!active) {
            return;
          }
          setLoading(false);
        });
    }, 400);

    return () => {
      active = false;
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  const displayMeals = useMemo(() => {
    const meals = query.trim() ? searchResults : featuredMeals;
    return sortMeals(meals, sortKey, sortOrder);
  }, [featuredMeals, query, searchResults, sortKey, sortOrder]);

  const handleQueryChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextQuery = event.target.value;
    setQuery(nextQuery);
    syncSearchParams(nextQuery, sortKey, sortOrder);
  };

  const handleSortKeyChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextSortKey = event.target.value as SortKey;
    setSortKey(nextSortKey);
    syncSearchParams(query, nextSortKey, sortOrder);
  };

  const toggleSortOrder = () => {
    const nextOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(nextOrder);
    syncSearchParams(query, sortKey, nextOrder);
  };

  const mealIdList = useMemo(
    () => displayMeals.map((meal) => meal.id),
    [displayMeals]
  );

  const showEmptyState =
    !initialLoading && !loading && displayMeals.length === 0 && query.trim().length > 0;

  return (
    <section className="list-page">
      <div className="list-page__intro">
        <h1 className="list-page__title">Find Your Next Meal</h1>
        <p className="list-page__subtitle">Start typing to search across thousands of recipes.</p>
      </div>

      <div className="list-page__controls">
        <label className="list-page__search">
          <span className="list-page__label">List meals</span>
          <input
            type="search"
            value={query}
            onChange={handleQueryChange}
            placeholder="Try &quot;chicken&quot; or &quot;pasta&quot;"
          />
        </label>

        <div className="list-page__sorting">
          <label className="list-page__label" htmlFor="sort-key">
            Sort by
          </label>
          <select id="sort-key" value={sortKey} onChange={handleSortKeyChange}>
            {Object.entries(SORT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={toggleSortOrder}
            className="list-page__order-button"
            aria-label={`Change to ${sortOrder === 'asc' ? 'descending' : 'ascending'} order`}
          >
            {sortOrder === 'asc' ? '▲ Asc' : '▼ Desc'}
          </button>
        </div>
      </div>

      {loading && <p className="list-page__status">Loading recipes...</p>}
      {initialLoading && !loading && (
        <p className="list-page__status">Gathering featured meals for you...</p>
      )}
      {error && <p className="list-page__error">{error}</p>}
      {showEmptyState && <p className="list-page__status">No meals match that search yet.</p>}

      <ul className="list-page__results">
        {displayMeals.map((meal, index) => (
          <li key={meal.id} className="list-page__item">
            <Link
              to={`/meal/${meal.id}`}
              state={{ list: mealIdList, index, origin: query.trim() ? 'search' : 'featured' }}
              className="list-page__card"
            >
              <img src={meal.thumbnail} alt={meal.name} loading="lazy" />
              <div className="list-page__card-body">
                <h2>{meal.name}</h2>
                <p>
                  <span className="list-page__badge">{meal.category ?? 'Uncategorized'}</span>
                  <span className="list-page__badge list-page__badge--muted">
                    {meal.area ?? 'Unknown origin'}
                  </span>
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default ListPage;
