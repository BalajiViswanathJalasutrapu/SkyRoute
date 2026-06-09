import PropTypes from 'prop-types';
import styles from '@styles/passenger-form-section.module.css';

function PassengerFormSection({ title, value, errors = {}, onChange, docConfig }) {
  function handleChange(e) {
    onChange(e.target.name, e.target.value);
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>{title}</span>
      </div>

      <label className={styles.field}>
        <span className={styles.label}>Full Name</span>
        <input
          type="text"
          name="fullName"
          value={value.fullName}
          onChange={handleChange}
          maxLength={100}
          placeholder="As it appears on your document"
          className={errors.fullName ? styles.inputError : ''}
        />
        {errors.fullName && <span className={styles.fieldError}>{errors.fullName}</span>}
      </label>

      <label className={styles.field}>
        <span className={styles.label}>{docConfig.label}</span>
        <input
          type="text"
          name="documentNumber"
          value={value.documentNumber}
          onChange={handleChange}
          placeholder={docConfig.hint}
          className={errors.documentNumber ? styles.inputError : ''}
        />
        {errors.documentNumber
          ? <span className={styles.fieldError}>{errors.documentNumber}</span>
          : <span className={styles.hint}>{docConfig.hint}</span>
        }
      </label>
    </div>
  );
}

PassengerFormSection.propTypes = {
  title:    PropTypes.string.isRequired,
  value:    PropTypes.shape({
    fullName:       PropTypes.string.isRequired,
    documentNumber: PropTypes.string.isRequired,
  }).isRequired,
  errors:   PropTypes.shape({
    fullName:       PropTypes.string,
    documentNumber: PropTypes.string,
  }),
  onChange:  PropTypes.func.isRequired,
  docConfig: PropTypes.shape({
    label:   PropTypes.string.isRequired,
    hint:    PropTypes.string.isRequired,
    pattern: PropTypes.instanceOf(RegExp).isRequired,
  }).isRequired,
};

export default PassengerFormSection;
