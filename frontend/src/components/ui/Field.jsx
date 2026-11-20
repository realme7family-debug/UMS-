// thin wrappers so forms stay readable
export function Field({ label, required, children, hint, className = "" }) {
  return (
    <div className={className}>
      {label && (
        <label className="label">
          {label}
          {required && <span className="text-brand-600"> *</span>}
        </label>
      )}
      {children}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function Input({ label, required, hint, className, ...props }) {
  return (
    <Field label={label} required={required} hint={hint} className={className}>
      <input className="input" required={required} {...props} />
    </Field>
  );
}

export function Select({ label, required, hint, className, options = [], placeholder, ...props }) {
  return (
    <Field label={label} required={required} hint={hint} className={className}>
      <select className="input" required={required} {...props}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) =>
          typeof o === "object" ? (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ) : (
            <option key={o} value={o}>
              {o}
            </option>
          )
        )}
      </select>
    </Field>
  );
}

export function Textarea({ label, required, hint, className, ...props }) {
  return (
    <Field label={label} required={required} hint={hint} className={className}>
      <textarea className="input min-h-[96px]" required={required} {...props} />
    </Field>
  );
}
