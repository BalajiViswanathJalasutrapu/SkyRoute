import { useState } from 'react';
import PropTypes from 'prop-types';
import { useFlightBooking } from '../hooks/useFlightBooking';
import Button from '@core/components/Button';
import PassengerFormSection from '@core/components/PassengerFormSection';
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

  const docConfig      = flight.isDomestic ? DOCUMENT_CONFIG.domestic : DOCUMENT_CONFIG.international;
  const additionalCount = (flight.passengerCount ?? 1) - 1;

  const [leadForm, setLeadForm] = useState({ fullName: '', email: '', documentNumber: '' });
  const [additionalForms, setAdditionalForms] = useState(
    () => Array.from({ length: additionalCount }, () => ({ fullName: '', documentNumber: '' }))
  );
  const [leadErrors, setLeadErrors] = useState({});
  const [additionalErrors, setAdditionalErrors] = useState(
    () => Array.from({ length: additionalCount }, () => ({}))
  );

  function handleLeadChange(e) {
    const { name, value } = e.target;
    setLeadForm(prev => ({ ...prev, [name]: value }));
    if (leadErrors[name]) setLeadErrors(prev => ({ ...prev, [name]: null }));
  }

  function handleAdditionalChange(index, field, value) {
    setAdditionalForms(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
    if (additionalErrors[index]?.[field]) {
      setAdditionalErrors(prev => prev.map((e, i) => i === index ? { ...e, [field]: null } : e));
    }
  }

  function validateLead() {
    const errors = {};
    if (!leadForm.fullName.trim())                errors.fullName = 'Full name is required.';
    else if (leadForm.fullName.length > 100)      errors.fullName = 'Full name must be 100 characters or fewer.';
    if (!leadForm.email.trim())                   errors.email = 'Email is required.';
    else if (!EMAIL_PATTERN.test(leadForm.email)) errors.email = 'Enter a valid email address.';
    if (!leadForm.documentNumber.trim())          errors.documentNumber = `${docConfig.label} is required.`;
    else if (!docConfig.pattern.test(leadForm.documentNumber.toUpperCase()))
      errors.documentNumber = `Invalid ${docConfig.label}. ${docConfig.hint}.`;
    return errors;
  }

  function validateAdditional() {
    return additionalForms.map(p => {
      const errors = {};
      if (!p.fullName.trim())            errors.fullName = 'Full name is required.';
      else if (p.fullName.length > 100)  errors.fullName = 'Full name must be 100 characters or fewer.';
      if (!p.documentNumber.trim())      errors.documentNumber = `${docConfig.label} is required.`;
      else if (!docConfig.pattern.test(p.documentNumber.toUpperCase()))
        errors.documentNumber = `Invalid ${docConfig.label}. ${docConfig.hint}.`;
      return errors;
    });
  }

  function handleSubmit(e) {
    e.preventDefault();

    const newLeadErrors       = validateLead();
    const newAdditionalErrors = validateAdditional();
    const hasLeadErrors       = Object.keys(newLeadErrors).length > 0;
    const hasAdditionalErrors = newAdditionalErrors.some(e => Object.keys(e).length > 0);

    if (hasLeadErrors || hasAdditionalErrors) {
      setLeadErrors(newLeadErrors);
      setAdditionalErrors(newAdditionalErrors);
      return;
    }

    book({
      flightId:   flight.flightId,
      cabinClass: flight.cabinClass,
      leadPassenger: {
        fullName:       leadForm.fullName.trim(),
        email:          leadForm.email.trim(),
        documentNumber: leadForm.documentNumber.trim().toUpperCase(),
      },
      additionalPassengers: additionalForms.map(p => ({
        fullName:       p.fullName.trim(),
        documentNumber: p.documentNumber.trim().toUpperCase(),
      })),
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
            Confirmation sent to {booking.leadPassenger.email}
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

        {/* ── Lead passenger ── */}
        <div className={styles.passengerSection}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>Lead Passenger</span>
            <span className={styles.sectionBadge}>Primary</span>
          </div>

          <label className={styles.field}>
            <span className={styles.label}>Full Name</span>
            <input
              type="text"
              name="fullName"
              value={leadForm.fullName}
              onChange={handleLeadChange}
              maxLength={100}
              placeholder="As it appears on your document"
              className={leadErrors.fullName ? styles.inputError : ''}
            />
            {leadErrors.fullName && <span className={styles.fieldError}>{leadErrors.fullName}</span>}
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Email</span>
            <input
              type="email"
              name="email"
              value={leadForm.email}
              onChange={handleLeadChange}
              placeholder="Confirmation will be sent here"
              className={leadErrors.email ? styles.inputError : ''}
            />
            {leadErrors.email && <span className={styles.fieldError}>{leadErrors.email}</span>}
          </label>

          <label className={styles.field}>
            <span className={styles.label}>{docConfig.label}</span>
            <input
              type="text"
              name="documentNumber"
              value={leadForm.documentNumber}
              onChange={handleLeadChange}
              placeholder={docConfig.hint}
              className={leadErrors.documentNumber ? styles.inputError : ''}
            />
            {leadErrors.documentNumber
              ? <span className={styles.fieldError}>{leadErrors.documentNumber}</span>
              : <span className={styles.hint}>{docConfig.hint}</span>
            }
          </label>
        </div>

        {/* ── Additional passengers ── */}
        {additionalForms.map((passenger, index) => (
          <div key={index}>
            <div className={styles.sectionDivider} />
            <PassengerFormSection
              title={`Passenger ${index + 2}`}
              value={passenger}
              errors={additionalErrors[index]}
              onChange={(field, value) => handleAdditionalChange(index, field, value)}
              docConfig={docConfig}
            />
          </div>
        ))}

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
