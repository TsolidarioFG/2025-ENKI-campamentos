export default function Select({
  id,
  label,
  error,
  required = false,
  className = "",
  children,
  ...props
}) {
  return (
    <div className={`field ${error ? "field-error" : ""} ${className}`}>
      {label && (
        <label htmlFor={id}>
          {label}
          {required && <span className="required-mark"> *</span>}
        </label>
      )}

      <select id={id} aria-invalid={Boolean(error)} {...props}>
        {children}
      </select>

      {error && <p className="field-error-message">{error}</p>}
    </div>
  );
}