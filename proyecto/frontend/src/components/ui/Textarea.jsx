export default function Textarea({
  id,
  label,
  error,
  required = false,
  className = "",
  ...props
}) {
  return (
    <div className={`field field-full ${error ? "field-error" : ""} ${className}`}>
      {label && (
        <label htmlFor={id}>
          {label}
          {required && <span className="required-mark"> *</span>}
        </label>
      )}

      <textarea id={id} aria-invalid={Boolean(error)} {...props} />

      {error && <p className="field-error-message">{error}</p>}
    </div>
  );
}