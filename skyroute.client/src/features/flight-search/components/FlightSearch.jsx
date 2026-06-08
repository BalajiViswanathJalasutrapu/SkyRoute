import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useFlightSearch } from '../hooks/useFlightSearch';
import Button from '@core/components/Button';
import styles from '@styles/flight-search.module.css';

const AIRPORTS = [
  { code: 'LAX', label: 'LAX — Los Angeles' },
  { code: 'JFK', label: 'JFK — New York' },
  { code: 'ORD', label: 'ORD — Chicago' },
  { code: 'DEL', label: 'DEL — Delhi' },
  { code: 'BOM', label: 'BOM — Mumbai' },
  { code: 'DXB', label: 'DXB — Dubai' },
];

const CABIN_CLASSES = ['Economy', 'Business', 'First'];

const SORT_OPTIONS = [
  { value: 'price',     label: 'Price' },
  { value: 'duration',  label: 'Duration' },
  { value: 'departure', label: 'Departure' },
];

function localDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const TODAY = localDateString(new Date());

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function FlightSearch({ onBook }) {
  const { results, loading, error, search } = useFlightSearch();

  const [hasSearched, setHasSearched] = useState(false);
  const [sortBy, setSortBy] = useState('price');
  const [form, setForm] = useState({
    origin:      '',
    destination: '',
    travelDate:  '',
    passengers:  1,
    cabinClass:  'Economy',
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setHasSearched(true);
    search({ ...form, passengers: Number(form.passengers) });
  }

  const sortedResults = useMemo(() => {
    return [...results].sort((a, b) => {
      if (sortBy === 'price')     return a.totalPrice - b.totalPrice;
      if (sortBy === 'duration')  return a.durationMinutes - b.durationMinutes;
      if (sortBy === 'departure') return new Date(a.departureTime) - new Date(b.departureTime);
      return 0;
    });
  }, [results, sortBy]);

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.formRow}>
          <label className={styles.field}>
            <span className={styles.label}>From</span>
            <select name="origin" value={form.origin} onChange={handleChange} required>
              <option value="" disabled>Select airport</option>
              {AIRPORTS.map(({ code, label }) => (
                <option key={code} value={code} disabled={code === form.destination}>{label}</option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span className={styles.label}>To</span>
            <select name="destination" value={form.destination} onChange={handleChange} required>
              <option value="" disabled>Select airport</option>
              {AIRPORTS.map(({ code, label }) => (
                <option key={code} value={code} disabled={code === form.origin}>{label}</option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Date</span>
            <input
              type="date"
              name="travelDate"
              value={form.travelDate}
              onChange={handleChange}
              min={TODAY}
              required
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Passengers</span>
            <input
              type="number"
              name="passengers"
              value={form.passengers}
              onChange={handleChange}
              min={1}
              max={9}
              required
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Cabin</span>
            <select name="cabinClass" value={form.cabinClass} onChange={handleChange}>
              {CABIN_CLASSES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>

          <Button type="submit" disabled={loading} className={styles.searchBtn}>
            {loading ? 'Searching…' : 'Search Flights'}
          </Button>
        </div>
      </form>

      {error && <p className={styles.error}>{error}</p>}

      {hasSearched && !loading && !error && results.length === 0 && (
        <p className={styles.empty}>No flights found for this route. Try different dates or airports.</p>
      )}

      {results.length > 0 && (
        <section className={styles.results}>
          <div className={styles.sortBar}>
            <span className={styles.sortLabel}>Sort by:</span>
            {SORT_OPTIONS.map(({ value, label }) => (
              <Button
                key={value}
                variant={sortBy === value ? 'primary' : 'ghost'}
                onClick={() => setSortBy(value)}
              >
                {label}
              </Button>
            ))}
            <span className={styles.resultCount}>
              {results.length} flight{results.length !== 1 ? 's' : ''} found
            </span>
          </div>

          <ul className={styles.resultList}>
            {sortedResults.map(flight => (
              <li key={flight.flightId} className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className={styles.provider}>{flight.providerName}</span>
                  <span className={styles.flightNumber}>{flight.flightNumber}</span>
                  <span className={styles.cabin}>{flight.cabinClass}</span>
                </div>

                <div className={styles.cardRoute}>
                  <div className={styles.routePoint}>
                    <span className={styles.time}>{formatTime(flight.departureTime)}</span>
                    <span className={styles.airport}>{flight.origin}</span>
                  </div>
                  <div className={styles.routeMid}>
                    <span className={styles.duration}>{formatDuration(flight.durationMinutes)}</span>
                    <span className={styles.routeLine} />
                  </div>
                  <div className={styles.routePoint}>
                    <span className={styles.time}>{formatTime(flight.arrivalTime)}</span>
                    <span className={styles.airport}>{flight.destination}</span>
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <div className={styles.pricing}>
                    <span className={styles.totalPrice}>${flight.totalPrice.toFixed(2)}</span>
                    <span className={styles.perPerson}>${flight.pricePerPerson.toFixed(2)} / person</span>
                  </div>
                  {onBook && (
                    <Button variant="success" onClick={() => onBook(flight, form.passengers)}>
                      Book
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

const FlightResultShape = PropTypes.shape({
  flightId:        PropTypes.string.isRequired,
  providerName:    PropTypes.string.isRequired,
  flightNumber:    PropTypes.string.isRequired,
  origin:          PropTypes.string.isRequired,
  destination:     PropTypes.string.isRequired,
  departureTime:   PropTypes.string.isRequired,
  arrivalTime:     PropTypes.string.isRequired,
  durationMinutes: PropTypes.number.isRequired,
  cabinClass:      PropTypes.string.isRequired,
  pricePerPerson:  PropTypes.number.isRequired,
  totalPrice:      PropTypes.number.isRequired,
  isDomestic:      PropTypes.bool.isRequired,
});

FlightSearch.propTypes = {
  onBook: PropTypes.func,
};

export { FlightResultShape };
export default FlightSearch;
