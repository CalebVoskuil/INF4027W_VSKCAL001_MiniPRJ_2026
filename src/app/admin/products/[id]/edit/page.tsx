"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getProductById, updateProduct } from "@/lib/firebase/firestore";
import { Product } from "@/types";
import { toast } from "sonner";

const productSchema = z.object({
  name: z.string().min(1),
  brand: z.string().min(1),
  model: z.string().min(1),
  price: z.string().min(1),
  costPrice: z.string().min(1),
  ram: z.string().min(1),
  storage: z.string().min(1),
  battery: z.string().min(1),
  camera: z.string().min(1),
  display: z.string().min(1),
  processor: z.string().min(1),
  os: z.string().min(1),
  tags: z.string().optional(),
});

type ProductForm = z.infer<typeof productSchema>;

export default function EditProductPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState("midrange");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { },
  } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
  });

  useEffect(() => {
    async function fetchProduct() {
      try {
        const p = await getProductById(id);
        if (p) {
          setProduct(p);
          setCategory(p.category);
          reset({
            name: p.name,
            brand: p.brand,
            model: p.model,
            price: p.price.toString(),
            costPrice: p.costPrice.toString(),
            ram: p.specs.ram,
            storage: p.specs.storage,
            battery: p.specs.battery,
            camera: p.specs.camera,
            display: p.specs.display,
            processor: p.specs.processor,
            os: p.specs.os,
            tags: p.tags?.join(", ") ?? "",
          });
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id, reset]);

  const onSubmit = async (data: ProductForm) => {
    setSaving(true);
    try {
      const tags = data.tags
        ? data.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [];

      await updateProduct(id, {
        name: data.name,
        brand: data.brand,
        model: data.model,
        price: parseFloat(data.price),
        costPrice: parseFloat(data.costPrice),
        category: category as "budget" | "midrange" | "flagship",
        specs: {
          ram: data.ram,
          storage: data.storage,
          battery: data.battery,
          camera: data.camera,
          display: data.display,
          processor: data.processor,
          os: data.os,
        },
        tags,
      });

      toast.success("Product updated successfully");
      router.push("/admin/products");
    } catch {
      toast.error("Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!product) {
    return <p>Product not found</p>;
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/products">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Edit Product</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="font-semibold mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Product Name *</Label>
              <Input className="mt-1" {...register("name")} />
            </div>
            <div>
              <Label>Brand *</Label>
              <Input className="mt-1" {...register("brand")} />
            </div>
            <div>
              <Label>Model *</Label>
              <Input className="mt-1" {...register("model")} />
            </div>
            <div>
              <Label>Price (ZAR) *</Label>
              <Input className="mt-1" type="number" {...register("price")} />
            </div>
            <div>
              <Label>Cost Price (ZAR) *</Label>
              <Input className="mt-1" type="number" {...register("costPrice")} />
            </div>
            <div>
              <Label>Category *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="budget">Budget</SelectItem>
                  <SelectItem value="midrange">Mid-Range</SelectItem>
                  <SelectItem value="flagship">Flagship</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tags</Label>
              <Input className="mt-1" {...register("tags")} />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="font-semibold mb-4">Specifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>RAM *</Label><Input className="mt-1" {...register("ram")} /></div>
            <div><Label>Storage *</Label><Input className="mt-1" {...register("storage")} /></div>
            <div><Label>Battery *</Label><Input className="mt-1" {...register("battery")} /></div>
            <div><Label>Camera *</Label><Input className="mt-1" {...register("camera")} /></div>
            <div><Label>Display *</Label><Input className="mt-1" {...register("display")} /></div>
            <div><Label>Processor *</Label><Input className="mt-1" {...register("processor")} /></div>
            <div><Label>OS *</Label><Input className="mt-1" {...register("os")} /></div>
          </div>
        </div>

        <Button
          type="submit"
          disabled={saving}
          className="w-full bg-coral hover:bg-coral-dark text-white py-6"
        >
          {saving ? "Saving..." : "Update Product"}
        </Button>
      </form>
    </div>
  );
}
