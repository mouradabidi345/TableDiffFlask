import * as React from "react";
import { cn } from "@/lib/utils";

export interface MaterialInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const MaterialInput = React.forwardRef<HTMLInputElement, MaterialInputProps>(
  ({ className, label, error, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(false);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      setHasValue(e.target.value !== "");
      props.onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(e.target.value !== "");
      props.onChange?.(e);
    };

    React.useEffect(() => {
      if (props.value !== undefined) {
        setHasValue(String(props.value) !== "");
      }
    }, [props.value]);

    const isLabelFloating = isFocused || hasValue || props.value !== undefined && props.value !== "";

    return (
      <div className="relative">
        <input
          ref={ref}
          {...props}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={cn(
            "h-12 w-full rounded-md border border-input bg-background px-3 pt-4 pb-2 text-base",
            "transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive focus:ring-destructive focus:border-destructive",
            className
          )}
        />
        <label
          className={cn(
            "absolute left-3 text-muted-foreground pointer-events-none transition-all duration-200",
            isLabelFloating
              ? "top-1.5 text-xs font-medium uppercase tracking-wide"
              : "top-3.5 text-base",
            isFocused && "text-primary",
            error && "text-destructive"
          )}
        >
          {label}
        </label>
        {error && (
          <p className="mt-1.5 text-xs text-destructive">{error}</p>
        )}
      </div>
    );
  }
);

MaterialInput.displayName = "MaterialInput";

export { MaterialInput };
