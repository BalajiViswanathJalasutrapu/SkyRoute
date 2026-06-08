import { useState } from 'react';
import PropTypes from 'prop-types';
import { useFlightBooking } from '../hooks/useFlightBooking';
import Button from '@core/components/Button';
import styles from '@styles/flight-booking.module.css';

const DOCUMENT_CONFIG = {
  domestic:      { label: 'National ID',     pattern: /^[A-Z0-9]{8,12}$/, hint: '8–12 alphanumeric characters' },
  international: { label: 'Passport Number', pattern: /^[A-Z0-9]{6,9}$/,  hint: '6–9 alphanumeric characters' },
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function BookingForm({ flight, onBack }) {
  const { booking, loading, error, book } = useFlightBooking();

  const docConfig = flight.isDomestic ? DOCUMENT_CONFIG.domestic : DOCUMENT_CONFIG.international;

  const [form, setForm] = useState({ fullName: '', email: '', documentNumber: '' });
  const [fieldErrors, setFieldErrors] = useState({});

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: null }));
  }

  function validate() {
    const errors = {};
    if (!form.fullName.trim())               errors.fullName = 'Full name is required.';
    else if (form.fullName.length > 100)     errors.fullName = 'Full name must be 100 characters or fewer.';
    if (!form.email.trim())                  errors.email = 'Email is required.';
    else if (!EMAIL_PATTERN.test(form.email)) errors.email = 'Enter a valid email address.';
    if (!form.documentNumber.trim())         errors.documentNumber = `${docConfig.label} is required.`;
    else if (!docConfig.pattern.test(form.documentNumber.toUpperCase()))
      errors.documentNumber = `Invalid ${docConfig.label}. ${docConfig.hint}.`;
    return errors;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }

    book({
      flightId:       flight.flightId,
      cabinClass:     flight.cabinClass,
      passengerCount: flight.passengerCount ?? 1,
      leadPassenger: {
        fullName:       form.fullName.trim(),
        email:          form.email.trim(),
        documentNumber: form.documentNumber.trim().toUpperCase(),
      },
    });
  }

  if (booking) {
    return (
      <div className={styles.container}>
        <div className={styles.confirmation}>
          <span className={styles.confirmIcon}>✓</span>
          <h2 className={styles.confirmTitle}>Booking Confirmed</h2>
          <span className={styles.bookingRef}>{booking.bookingReference}</span>
          <p className={styles.confirmDetails}>
            {booking.origin} → {booking.destination}<br />
            {formatTime(booking.departureTime)} · {booking.cabinClass}<br />
            {booking.passengerCount} passenger{booking.passengerCount !== 1 ? 's' : ''} · ${booking.totalPrice.toFixed(2)} total<br />
            Confirmation sent to {booking.leadPassengerEmail}
          </p>
          <Button onClick={onBack} className={styles.searchAgainBtn}>
            Search Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Button variant="text" onClick={onBack} className={styles.backBtn}>
        ← Back to results
      </Button>

      <div className={styles.summary}>
        <div className={styles.summaryHeader}>
          <span className={styles.provider}>{flight.providerName}</span>
          <span className={styles.flightNumber}>{flight.flightNumber}</span>
          <span className={styles.cabin}>{flight.cabinClass}</span>
        </div>

        <div className={styles.summaryRoute}>
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

        <div className={styles.summaryFooter}>
          <span className={styles.totalPrice}>${flight.totalPrice.toFixed(2)}</span>
          <span className={styles.perPerson}>${flight.pricePerPerson.toFixed(2)} / person</span>
        </div>
      </div>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <h2 className={styles.formTitle}>Passenger Details</h2>

        <label className={styles.field}>
          <span className={styles.label}>Full Name</span>
          <input
            type="text"
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            maxLength={100}
            placeholder="As it appears on your document"
            className={fieldErrors.fullName ? styles.inputError : ''}
          />
          {fieldErrors.fullName && <span className={styles.fieldError}>{fieldErrors.fullName}</span>}
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Email</span>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Confirmation will be sent here"
            className={fieldErrors.email ? styles.inputError : ''}
          />
          {fieldErrors.email && <span className={styles.fieldError}>{fieldErrors.email}</span>}
        </label>

        <label className={styles.field}>
          <span className={styles.label}>{docConfig.label}</span>
          <input
            type="text"
            name="documentNumber"
            value={form.documentNumber}
            onChange={handleChange}
            placeholder={docConfig.hint}
            className={fieldErrors.documentNumber ? styles.inputError : ''}
          />
          {fieldErrors.documentNumber
            ? <span className={styles.fieldError}>{fieldErrors.documentNumber}</span>
            : <span className={styles.hint}>{docConfig.hint}</span>
          }
        </label>

        {error && <p className={styles.error}>{error}</p>}

        <Button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? 'Confirming…' : 'Confirm Booking'}
        </Button>
      </form>
    </div>
  );
}

BookingForm.propTypes = {
  flight: PropTypes.shape({
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
    passengerCount:  PropTypes.number,
  }).isRequired,
  onBack: PropTypes.func.isRequired,
};

export default BookingForm;
