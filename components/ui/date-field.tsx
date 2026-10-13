"use client";

import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type InputHTMLAttributes,
} from "react";
import { FaCalendarDays } from "react-icons/fa6";
import { cn } from "@/lib/utils";
import { fieldBase } from "@/components/ui/form";
import { dayFirstToIso, isoToDayFirst } from "@/lib/day-first-date";
import { useLocale } from "@/components/i18n/locale-provider";

type DateFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "onChange" | "defaultValue" | "min" | "max"
> & {
  /** ISO calendar day (`YYYY-MM-DD`), or "" when empty. */
  value: string;
  /** Emits an ISO calendar day (`YYYY-MM-DD`), or "" when cleared. */
  onChange: (value: string) => void;
  /** Earliest selectable day, ISO. */
  min?: string;
  /** Latest selectable day, ISO. */
  max?: string;
};

/**
 * A date input that always displays and accepts day-first dates
 * (`13/10/2026`). Native `<input type="date">` follows the *browser* locale,
 * which cannot be overridden, so this shows an ordinary text field for the
 * value and keeps a hidden native picker behind the calendar button for the
 * convenience of a pop-up calendar.
 */
export const DateField = forwardRef<HTMLInputElement, DateFieldProps>(function DateField(
  { value, onChange, min, max, className, required, placeholder, onFocus, onBlur, ...rest },
  forwardedRef
) {
  const { t } = useLocale();
  const textRef = useRef<HTMLInputElement | null>(null);
  const pickerRef = useRef<HTMLInputElement | null>(null);
  const [text, setText] = useState(() => isoToDayFirst(value));
  const [editing, setEditing] = useState(false);
  const [invalid, setInvalid] = useState(false);

  // Follow the value when it changes from outside (opening an existing record,
  // clearing a form), but never fight the person while they are typing.
  useEffect(() => {
    if (!editing) {
      setText(isoToDayFirst(value));
      setInvalid(false);
    }
  }, [value, editing]);

  const attachRef = (node: HTMLInputElement | null) => {
    textRef.current = node;
    if (typeof forwardedRef === "function") forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  };

  const setValidity = (message: string) => textRef.current?.setCustomValidity(message);

  /** null when the typed date is acceptable, otherwise the message to show. */
  function validationError(iso: string | null): string | null {
    if (!iso) return t("field.dateInvalid");
    if (min && iso < min) return t("field.dateOutOfRange");
    if (max && iso > max) return t("field.dateOutOfRange");
    return null;
  }

  function handleChange(raw: string) {
    setText(raw);
    if (!raw.trim()) {
      setInvalid(false);
      setValidity("");
      onChange("");
      return;
    }
    const iso = dayFirstToIso(raw);
    const error = validationError(iso);
    setInvalid(Boolean(error));
    setValidity(error ?? "");
    if (iso && !error) onChange(iso);
  }

  function handleFocus(event: FocusEvent<HTMLInputElement>) {
    setEditing(true);
    onFocus?.(event);
  }

  function handleBlur(event: FocusEvent<HTMLInputElement>) {
    setEditing(false);
    if (text.trim() && validationError(dayFirstToIso(text))) {
      // Put back the last good value rather than leave a half-typed date.
      setText(isoToDayFirst(value));
      setInvalid(false);
      setValidity("");
    }
    onBlur?.(event);
  }

  function openPicker() {
    const input = pickerRef.current as
      | (HTMLInputElement & { showPicker?: () => void })
      | null;
    if (!input) return;
    if (typeof input.showPicker === "function") {
      try {
        input.showPicker();
        return;
      } catch {
        // Some browsers refuse; fall back to focusing the native field.
      }
    }
    input.focus();
  }

  return (
    <div className="relative">
      <input
        ref={attachRef}
        type="text"
        autoComplete="off"
        value={text}
        placeholder={placeholder ?? "dd/mm/yyyy"}
        required={required}
        aria-invalid={invalid || undefined}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={(event) => handleChange(event.target.value)}
        className={cn(
          fieldBase,
          className,
          "pr-10",
          invalid && "border-red-300 focus:border-red-500 focus:ring-red-500/20"
        )}
        {...rest}
      />
      <button
        type="button"
        onClick={openPicker}
        aria-label={t("aria.chooseDate")}
        className="absolute inset-y-0 right-0 flex w-10 cursor-pointer items-center justify-center rounded-r-md text-muted transition-colors hover:text-ink"
      >
        <FaCalendarDays className="h-4 w-4" aria-hidden />
      </button>
      <input
        ref={pickerRef}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        value={/^\d{4}-\d{2}-\d{2}$/.test(value) ? value : ""}
        min={min}
        max={max}
        onChange={(event) => {
          const iso = event.target.value;
          onChange(iso);
          setText(isoToDayFirst(iso));
          setInvalid(false);
          setValidity("");
        }}
        className="sr-only"
      />
    </div>
  );
});

DateField.displayName = "DateField";
