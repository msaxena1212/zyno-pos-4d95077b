import { Check, ChevronsUpDown, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useBrand } from "@/contexts/BrandContext";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function BrandSwitcher() {
  const { brands, currentBrand, setCurrentBrand } = useBrand();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="truncate">{currentBrand?.name || "Select brand..."}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search brand..." />
          <CommandList>
            <CommandEmpty>No brand found.</CommandEmpty>
            <CommandGroup>
              {brands.map((brand) => (
                <CommandItem
                  key={brand.id}
                  value={brand.name}
                  onSelect={() => {
                    setCurrentBrand(brand);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      currentBrand?.id === brand.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {brand.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
