import { useState } from 'react';
import FlightSearch from './features/flight-search/components/FlightSearch';
import BookingForm from './features/flight-booking/components/BookingForm';

function App() {
  const [view, setView] = useState('search');
  const [selectedFlight, setSelectedFlight] = useState(null);

  function handleBook(flight, passengers) {
    setSelectedFlight({ ...flight, passengerCount: Number(passengers) });
    setView('booking');
  }

  function handleBack() {
    setSelectedFlight(null);
    setView('search');
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-logo">SkyRoute</h1>
      </header>

      <main className="app-main">
        {view === 'search' && (
          <FlightSearch onBook={handleBook} />
        )}

        {view === 'booking' && selectedFlight && (
          <BookingForm flight={selectedFlight} onBack={handleBack} />
        )}
      </main>
    </div>
  );
}

export default App;
