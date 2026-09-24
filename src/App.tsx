import React, { useEffect } from 'react';
import { Layout } from './components/Layout';
import { VideoPlayer } from './components/VideoPlayer';
import { AuthModal } from './components/AuthModal';
import { ContentManagerModal } from './components/ContentManagerModal';
import { Home } from './pages/Home';
import { SeriesDetail } from './pages/SeriesDetail';
import { MoviesPage } from './pages/MoviesPage';
import { Search } from './pages/Search';
import { Profile } from './pages/Profile';
import { useAppStore } from './store';

export default function App() {
  const {
    currentTab,
    selectedSeriesId,
    activePlayback,
    loadSeries,
    initAuthListener
  } = useAppStore();

  useEffect(() => {
    loadSeries();
    const unsubscribe = initAuthListener();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [loadSeries, initAuthListener]);

  const renderActiveView = () => {
    // 1. If a series is selected for detail view
    if (selectedSeriesId) {
      return <SeriesDetail />;
    }

    // 2. Otherwise render current bottom navigation tab
    switch (currentTab) {
      case 'home':
        return <Home />;
      case 'movies':
        return <MoviesPage />;
      case 'search':
        return <Search />;
      case 'downloads':
        return <MoviesPage />;
      case 'me':
        return <Profile />;
      default:
        return <Home />;
    }
  };

  return (
    <>
      <Layout>
        {renderActiveView()}
      </Layout>

      {/* Email & Password Authentication Modal */}
      <AuthModal />

      {/* Content Studio & Bulk Uploader Modal */}
      <ContentManagerModal />

      {/* Fullscreen Video Player with Custom Touch Gestures & Landscape Lock (for Home/Downloads; SeriesDetail uses inline YouTube player) */}
      {activePlayback && !selectedSeriesId && <VideoPlayer />}
    </>
  );
}
