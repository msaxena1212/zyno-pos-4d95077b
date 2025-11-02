import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Tag, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useBrand } from "@/contexts/BrandContext";

interface Offer {
  id: string;
  name: string;
  code: string;
  description: string | null;
  type: string;
  discount_percentage: number | null;
  discount_value: number | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
}

const Offers = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const { currentBrand } = useBrand();
  const form = useForm();

  useEffect(() => {
    fetchOffers();
  }, [currentBrand]);

  const fetchOffers = async () => {
    try {
      const { data, error } = await supabase
        .from("offers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOffers(data || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch offers");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: any) => {
    try {
      if (editingOffer) {
        // Update existing offer
        const { error } = await supabase.from("offers").update({
          name: values.name,
          code: values.code,
          description: values.description,
          type: values.type,
          discount_percentage: values.type === 'percentage' ? values.discount_value : null,
          discount_value: values.type === 'fixed' ? values.discount_value : null,
          start_date: values.start_date,
          end_date: values.end_date,
        }).eq("id", editingOffer.id);

        if (error) throw error;
        toast.success("Offer updated successfully");
      } else {
        // Create new offer
        const { error } = await supabase.from("offers").insert({
          name: values.name,
          code: values.code,
          description: values.description,
          type: values.type,
          discount_percentage: values.type === 'percentage' ? values.discount_value : null,
          discount_value: values.type === 'fixed' ? values.discount_value : null,
          start_date: values.start_date,
          end_date: values.end_date,
          brand_id: currentBrand?.id,
          status: 'draft',
        });

        if (error) throw error;
        toast.success("Offer created successfully");
      }

      setOpen(false);
      setEditingOffer(null);
      form.reset();
      fetchOffers();
    } catch (error: any) {
      toast.error(error.message || "Failed to save offer");
    }
  };

  const handleEdit = (offer: Offer) => {
    setEditingOffer(offer);
    form.reset({
      name: offer.name,
      code: offer.code,
      description: offer.description,
      type: offer.type,
      discount_value: offer.type === 'percentage' ? offer.discount_percentage : offer.discount_value,
      start_date: offer.start_date ? offer.start_date.slice(0, 16) : '',
      end_date: offer.end_date ? offer.end_date.slice(0, 16) : '',
    });
    setOpen(true);
  };

  const handleDelete = async (offerId: string) => {
    if (!confirm("Are you sure you want to delete this offer?")) return;

    try {
      const { error } = await supabase
        .from("offers")
        .delete()
        .eq("id", offerId);

      if (error) throw error;
      toast.success("Offer deleted successfully");
      fetchOffers();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete offer");
    }
  };

  const toggleOfferStatus = async (offerId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'archived' : 'active';
    
    try {
      const { error } = await supabase
        .from("offers")
        .update({ status: newStatus })
        .eq("id", offerId);

      if (error) throw error;
      toast.success(`Offer ${newStatus === 'active' ? 'activated' : 'archived'} successfully`);
      fetchOffers();
    } catch (error: any) {
      toast.error(error.message || "Failed to update offer status");
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Offers & Promotions</h1>
          <p className="text-muted-foreground">Manage promotional offers and discounts</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Offer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Offer</DialogTitle>
              <DialogDescription>Create a promotional offer or discount</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Offer Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Summer Sale 2024" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Offer Code</FormLabel>
                      <FormControl>
                        <Input placeholder="SUMMER2024" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Offer description..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="percentage">Percentage</SelectItem>
                            <SelectItem value="fixed">Fixed Amount</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="discount_value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount Value</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="10" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="end_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingOffer ? "Update Offer" : "Create Offer"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Offers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {offers.map((offer) => (
                <TableRow key={offer.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      {offer.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{offer.code}</Badge>
                  </TableCell>
                  <TableCell className="capitalize">{offer.type}</TableCell>
                  <TableCell>
                    {offer.type === 'percentage' 
                      ? `${offer.discount_percentage}%` 
                      : `₹${offer.discount_value}`}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {offer.start_date && new Date(offer.start_date).toLocaleDateString()} - {offer.end_date && new Date(offer.end_date).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        offer.status === "active" ? "default" : 
                        offer.status === "draft" ? "secondary" : 
                        "outline"
                      }
                      className="cursor-pointer"
                      onClick={() => toggleOfferStatus(offer.id, offer.status)}
                    >
                      {offer.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(offer)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(offer.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Offers;
