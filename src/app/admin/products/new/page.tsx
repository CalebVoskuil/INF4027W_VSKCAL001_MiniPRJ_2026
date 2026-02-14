"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Upload, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createProduct } from "@/lib/firebase/firestore";
import { uploadProductImage } from "@/lib/firebase/storage";
import { toast } from "sonner";

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  price: z.string().min(1, "Price is required"),
  costPrice: z.string().min(1, "Cost price is required"),
  ram: z.string().min(1, "RAM is required"),
  storage: z.string().min(1, "Storage is required"),
  battery: z.string().min(1, "Battery is required"),
  camera: z.string().min(1, "Camera is required"),
  display: z.string().min(1, "Display is required"),
  processor: z.string().min(1, "Processor is required"),
  os: z.string().min(1, "OS is required"),
  tags: z.string().optional(),
});

type ProductForm = z.infer<typeof productSchema>;

export default function NewProductPage() {
  const [category, setCategory] = useState<string>("midrange");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setImageFiles([...imageFiles, ...Array.from(files)]);
    }
  };

  const removeImage = (index: number) => {
    setImageFiles(imageFiles.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ProductForm) => {
    setLoading(true);
    try {
      const tags = data.tags
        ? data.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [];

      const productId = await createProduct({
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
        images: [],
        tags,
        stock: 50,
        views: 0,
        salesCount: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Upload images
      const imageUrls: string[] = [];
      for (let i = 0; i < imageFiles.length; i++) {
        const url = await uploadProductImage(
          productId,
          imageFiles[i],
          `image-${i}.${imageFiles[i].name.split(".").pop()}`
        );
        imageUrls.push(url);
      }

      if (imageUrls.length > 0) {
        const { updateProduct } = await import("@/lib/firebase/firestore");
        await updateProduct(productId, { images: imageUrls });
      }

      toast.success("Product created successfully");
      router.push("/admin/products");
    } catch (error) {
      console.error("Failed to create product:", error);
      toast.error("Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/products">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Add New Product</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-6">
        {/* Basic Info */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="font-semibold mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Product Name *</Label>
              <Input className="mt-1" placeholder="Samsung Galaxy S24 Ultra" {...register("name")} />
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label>Brand *</Label>
              <Input className="mt-1" placeholder="Samsung" {...register("brand")} />
              {errors.brand && <p className="text-sm text-red-500 mt-1">{errors.brand.message}</p>}
            </div>
            <div>
              <Label>Model *</Label>
              <Input className="mt-1" placeholder="S24 Ultra" {...register("model")} />
              {errors.model && <p className="text-sm text-red-500 mt-1">{errors.model.message}</p>}
            </div>
            <div>
              <Label>Price (ZAR) *</Label>
              <Input className="mt-1" type="number" placeholder="28999" {...register("price")} />
              {errors.price && <p className="text-sm text-red-500 mt-1">{errors.price.message}</p>}
            </div>
            <div>
              <Label>Cost Price (ZAR) *</Label>
              <Input className="mt-1" type="number" placeholder="21000" {...register("costPrice")} />
              {errors.costPrice && <p className="text-sm text-red-500 mt-1">{errors.costPrice.message}</p>}
            </div>
            <div>
              <Label>Category *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="budget">Budget</SelectItem>
                  <SelectItem value="midrange">Mid-Range</SelectItem>
                  <SelectItem value="flagship">Flagship</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tags (comma separated)</Label>
              <Input className="mt-1" placeholder="5G, fast-charging, AMOLED" {...register("tags")} />
            </div>
          </div>
        </div>

        {/* Specs */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="font-semibold mb-4">Specifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>RAM *</Label>
              <Input className="mt-1" placeholder="12GB" {...register("ram")} />
              {errors.ram && <p className="text-sm text-red-500 mt-1">{errors.ram.message}</p>}
            </div>
            <div>
              <Label>Storage *</Label>
              <Input className="mt-1" placeholder="512GB" {...register("storage")} />
              {errors.storage && <p className="text-sm text-red-500 mt-1">{errors.storage.message}</p>}
            </div>
            <div>
              <Label>Battery *</Label>
              <Input className="mt-1" placeholder="5000mAh" {...register("battery")} />
              {errors.battery && <p className="text-sm text-red-500 mt-1">{errors.battery.message}</p>}
            </div>
            <div>
              <Label>Camera *</Label>
              <Input className="mt-1" placeholder="200MP + 50MP + 12MP" {...register("camera")} />
              {errors.camera && <p className="text-sm text-red-500 mt-1">{errors.camera.message}</p>}
            </div>
            <div>
              <Label>Display *</Label>
              <Input className="mt-1" placeholder='6.8" Dynamic AMOLED' {...register("display")} />
              {errors.display && <p className="text-sm text-red-500 mt-1">{errors.display.message}</p>}
            </div>
            <div>
              <Label>Processor *</Label>
              <Input className="mt-1" placeholder="Snapdragon 8 Gen 3" {...register("processor")} />
              {errors.processor && <p className="text-sm text-red-500 mt-1">{errors.processor.message}</p>}
            </div>
            <div>
              <Label>Operating System *</Label>
              <Input className="mt-1" placeholder="Android 14" {...register("os")} />
              {errors.os && <p className="text-sm text-red-500 mt-1">{errors.os.message}</p>}
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="font-semibold mb-4">Images</h2>
          <div className="flex flex-wrap gap-4 mb-4">
            {imageFiles.map((file, i) => (
              <div key={i} className="relative w-24 h-24 border rounded-lg overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Upload ${i}`}
                  className="w-full h-full object-contain"
                />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-foreground">
              <Upload className="w-5 h-5 text-gray-400 mb-1" />
              <span className="text-xs text-gray-400">Upload</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto bg-foreground hover:bg-gray-800 text-white"
        >
          {loading ? "Creating..." : "Create Product"}
        </Button>
      </form>
    </div>
  );
}
