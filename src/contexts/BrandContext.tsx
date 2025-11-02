import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Brand {
  id: string;
  name: string;
  code: string;
  logo_url: string | null;
  primary_color: string | null;
}

interface BrandContextType {
  brands: Brand[];
  currentBrand: Brand | null;
  setCurrentBrand: (brand: Brand) => void;
  loading: boolean;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export function BrandProvider({ children }: { children: ReactNode }) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [currentBrand, setCurrentBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const { data, error } = await supabase
        .from("brands")
        .select("*")
        .eq("status", "active")
        .order("name");

      if (error) throw error;

      setBrands(data || []);
      if (data && data.length > 0 && !currentBrand) {
        setCurrentBrand(data[0]);
      }
    } catch (error: any) {
      toast.error("Failed to load brands");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BrandContext.Provider value={{ brands, currentBrand, setCurrentBrand, loading }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (context === undefined) {
    throw new Error("useBrand must be used within a BrandProvider");
  }
  return context;
}
