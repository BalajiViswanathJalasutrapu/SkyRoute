import PropTypes from 'prop-types';
import styles from '@styles/button.module.css';

function Button({ children, variant = 'primary', type = 'button', disabled = false, onClick, className = '' }) {
  return (
    <button
      type={type}
      className={[styles.btn, styles[variant], className].filter(Boolean).join(' ')}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

Button.propTypes = {
  children:  PropTypes.node.isRequired,
  variant:   PropTypes.oneOf(['primary', 'success', 'ghost', 'text']),
  type:      PropTypes.oneOf(['button', 'submit', 'reset']),
  disabled:  PropTypes.bool,
  onClick:   PropTypes.func,
  className: PropTypes.string,
};

export default Button;
