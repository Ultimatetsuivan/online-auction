// app/lib/categories.ts
export type Category = {
  id: string;
  name: string;
  icon?: string;     // Ionicons name
  image?: any;       // require("...") optional
  children?: Category[];
};

export const CATEGORIES: Category[] = [
  { id: "electronics", name: "Electronics", icon: "phone-portrait" },
  { id: "fashion",     name: "Fashion",     icon: "shirt" },
  { id: "home",        name: "Home & Garden", icon: "home" },
  { id: "beauty",      name: "Health & Beauty", icon: "bandage" },
  { id: "sports",      name: "Sports",      icon: "bicycle" },
  { id: "cars",        name: "Cars & Vehicles", icon: "car-sport" },
  {
    id: "motors",
    name: "Motors",
    icon: "car",
    children: [
      { id: "sedans", name: "Sedans" },
      { id: "suvs", name: "SUVs" },
      { id: "motorcycles", name: "Motorcycles" },
      { id: "trucks", name: "Trucks" },
      { id: "parts", name: "Parts & Accessories" },
    ],
  },
];
