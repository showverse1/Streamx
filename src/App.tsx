import React, { useEffect } from 'react';
import { Layout } from './components/Layout';
import { VideoPlayer } from './components/VideoPlayer';
import { Home } from './pages/Home';
import { SeriesDetail } from './pages/SeriesDetail';
import { Search } from './pages/Search';
import { Downloads } from './pages/Downloads';
import { Profile } from './pages/Profile';
import { useAppStore } from './store';

export default function App() {
  const {
    currentTab,
    selectedSeriesId,
    activePlayback,
    loadSeries
  } = useAppStore();

  useEffect(() => {
    loadSeries();
  }, [loadSeries]);

  const renderActiveView = () => {
    // 1. If a series is selected for detail view
    if (selectedSeriesId) {
      return <SeriesDetail />;
    }

    // 2. Otherwise render current bottom navigation tab
    switch (currentTab) {
      case 'home':
        return <Home />;
      case 'search':
        return <Search />;
      case 'downloads':
        return <Downloads />;
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

      {/* Fullscreen Video Player with Custom Touch Gestures & Landscape Lock */}
      {activePlayback && <VideoPlayer />}
    </>
  );
}
