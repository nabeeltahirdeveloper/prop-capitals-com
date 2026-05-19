import { useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useTranslation } from "../../contexts/LanguageContext";

const toDateObj = (s) => {
  if (!s) return undefined;
  try {
    return parseISO(s);
  } catch {
    return undefined;
  }
};

/**
 * Reusable "Custom Date Range" filter.
 *
 * Replaces the old pair of separate "from" / "to" <input type="date"> fields
 * with a single popover range picker.
 *
 * Props:
 *  - fromDate / toDate : strings in "yyyy-MM-dd" format ("" when unset)
 *  - onChange(fromStr, toStr) : called with updated "yyyy-MM-dd" strings
 *  - className : optional extra classes for the trigger button
 */
export default function DateRangeFilter({
  fromDate = "",
  toDate = "",
  onChange,
  className,
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const range = {
    from: toDateObj(fromDate),
    to: toDateObj(toDate),
  };

  const handleSelect = (selected) => {
    const from = selected?.from ? format(selected.from, "yyyy-MM-dd") : "";
    const to = selected?.to ? format(selected.to, "yyyy-MM-dd") : "";
    onChange?.(from, to);
    if (selected?.from && selected?.to) setOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange?.("", "");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full sm:w-auto justify-start text-left font-normal bg-muted border-border text-xs h-9",
            !range.from && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          {range.from ? (
            range.to ? (
              <>
                {format(range.from, "MMM dd, yyyy")} -{" "}
                {format(range.to, "MMM dd, yyyy")}
              </>
            ) : (
              format(range.from, "MMM dd, yyyy")
            )
          ) : (
            <span>
              {t("common.customDateRange", {
                defaultValue: "Custom Date Range",
              })}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <CalendarComponent
          mode="range"
          selected={range}
          onSelect={handleSelect}
          numberOfMonths={2}
          initialFocus
        />
        {range.from && (
          <div className="p-3 border-t border-border flex justify-end">
            <Button variant="ghost" size="sm" onClick={handleClear}>
              {t("common.clear", { defaultValue: "Clear" })}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
