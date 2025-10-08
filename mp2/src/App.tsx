import './App.css';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import GalleryPage from './pages/GalleryPage/GalleryPage';
import ListPage from './pages/ListPage/ListPage';
import MealDetailPage from './pages/MealDetailPage/MealDetailPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<ListPage />} />
        <Route path="gallery" element={<GalleryPage />} />
        <Route path="meal/:mealId" element={<MealDetailPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
