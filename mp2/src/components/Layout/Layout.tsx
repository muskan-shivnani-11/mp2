import { NavLink, Outlet } from 'react-router-dom';
import './Layout.css';

function Layout() {
  return (
    <div className="layout">
      <header className="layout__header">
        <div className="layout__brand">
          <span className="layout__title">Meal Explorer</span>
          <span className="layout__subtitle">Powered by TheMealDB</span>
        </div>
        <nav className="layout__nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive ? 'layout__link layout__link--active' : 'layout__link'
            }
          >
            List
          </NavLink>
          <NavLink
            to="/gallery"
            className={({ isActive }) =>
              isActive ? 'layout__link layout__link--active' : 'layout__link'
            }
          >
            Gallery
          </NavLink>
        </nav>
      </header>
      <main className="layout__main">
        <Outlet />
      </main>
      <footer className="layout__footer">
        <span>
          Data courtesy of{' '}
          <a
            className="layout__footer-link"
            href="https://www.themealdb.com/api.php"
            target="_blank"
            rel="noreferrer"
          >
            TheMealDB
          </a>
        </span>
      </footer>
    </div>
  );
}

export default Layout;
