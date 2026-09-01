/**
 * OP AI Structured Fashion Taxonomy
 * References DeepFashion2 categories while providing rich user-friendly fashion style discovery.
 */

export interface TaxonomyCategory {
  id: string;
  name: string;
  keywords: string[];
  styles: TaxonomyStyle[];
  defaultOccasions: string[];
  defaultSeasons: string[];
}

export interface TaxonomyStyle {
  id: string;
  name: string;
  category: string;
  keywords: string[];
  occasion?: string;
  season?: string;
  searchModifier: string;
  description?: string;
}

export const OP_FASHION_TAXONOMY: Record<string, TaxonomyCategory> = {
  DRESSES: {
    id: "dresses",
    name: "Dresses",
    keywords: ["dress", "dresses", "gown", "frock", "one-piece", "maxi", "midi", "mini"],
    defaultOccasions: ["Casual", "Party", "Formal Event", "Weddings / Functions", "Date"],
    defaultSeasons: ["Summer", "Spring", "All-Season"],
    styles: [
      { id: "casual-dress", name: "Casual Dress", category: "Dresses", keywords: ["casual", "day dress", "daily"], occasion: "Casual Outings", searchModifier: "casual dress" },
      { id: "formal-dress", name: "Formal Dress", category: "Dresses", keywords: ["formal", "office", "business", "work"], occasion: "Office", searchModifier: "formal dress" },
      { id: "party-dress", name: "Party Dress", category: "Dresses", keywords: ["party", "cocktail", "club", "celebration"], occasion: "Party", searchModifier: "party dress" },
      { id: "maxi-dress", name: "Maxi Dress", category: "Dresses", keywords: ["maxi", "floor length", "long dress"], searchModifier: "maxi dress" },
      { id: "midi-dress", name: "Midi Dress", category: "Dresses", keywords: ["midi", "calf length", "medium dress"], searchModifier: "midi dress" },
      { id: "mini-dress", name: "Mini Dress", category: "Dresses", keywords: ["mini", "short dress"], searchModifier: "mini dress" },
      { id: "bodycon-dress", name: "Bodycon Dress", category: "Dresses", keywords: ["bodycon", "tight", "fitted", "silhouette"], searchModifier: "bodycon dress" },
      { id: "a-line-dress", name: "A-Line Dress", category: "Dresses", keywords: ["a-line", "flared", "skater"], searchModifier: "a-line dress" },
      { id: "wrap-dress", name: "Wrap Dress", category: "Dresses", keywords: ["wrap", "v-neck wrap", "tie waist"], searchModifier: "wrap dress" },
      { id: "shirt-dress", name: "Shirt Dress", category: "Dresses", keywords: ["shirt dress", "collared dress", "button dress"], searchModifier: "shirt dress" },
      { id: "floral-dress", name: "Floral Dress", category: "Dresses", keywords: ["floral", "flower print", "botanical"], season: "Summer", searchModifier: "floral print dress" },
      { id: "ethnic-dress", name: "Ethnic Dress", category: "Dresses", keywords: ["ethnic", "indowestern", "traditional dress", "fusion"], occasion: "Festivals", searchModifier: "ethnic fusion dress" },
      { id: "summer-dress", name: "Summer Dress", category: "Dresses", keywords: ["summer", "sundress", "breezy", "beach"], season: "Summer", searchModifier: "summer sundress" },
      { id: "evening-dress", name: "Evening Dress", category: "Dresses", keywords: ["evening", "ballgown", "black tie", "gala"], occasion: "Formal Event", searchModifier: "evening gown dress" },
      { id: "wedding-dress", name: "Wedding/Occasion Dress", category: "Dresses", keywords: ["wedding", "reception", "ceremony", "occasion"], occasion: "Weddings / Functions", searchModifier: "wedding guest occasion dress" },
    ],
  },
  TOPS: {
    id: "tops",
    name: "Tops",
    keywords: ["top", "tops", "shirt", "t-shirt", "tee", "blouse", "polo", "tank"],
    defaultOccasions: ["Everyday", "Office", "Casual Outings"],
    defaultSeasons: ["All-Season", "Summer"],
    styles: [
      { id: "t-shirt", name: "T-Shirt", category: "Tops", keywords: ["t-shirt", "tee", "crewneck tee"], searchModifier: "t-shirt" },
      { id: "shirt", name: "Shirt", category: "Tops", keywords: ["button down", "button up", "formal shirt"], searchModifier: "button down shirt" },
      { id: "polo-shirt", name: "Polo Shirt", category: "Tops", keywords: ["polo", "collared tee"], searchModifier: "polo shirt" },
      { id: "blouse", name: "Blouse", category: "Tops", keywords: ["blouse", "chiffon", "silk blouse"], searchModifier: "elegant blouse" },
      { id: "crop-top", name: "Crop Top", category: "Tops", keywords: ["crop", "cropped"], searchModifier: "crop top" },
      { id: "tank-top", name: "Tank Top", category: "Tops", keywords: ["tank", "sleeveless", "vest"], searchModifier: "tank top" },
      { id: "oversized-top", name: "Oversized Top", category: "Tops", keywords: ["oversized", "baggy", "loose fit"], searchModifier: "oversized relaxed top" },
      { id: "casual-top", name: "Casual Top", category: "Tops", keywords: ["casual top", "daily top"], searchModifier: "casual top" },
      { id: "formal-top", name: "Formal Top", category: "Tops", keywords: ["formal top", "work top", "office top"], searchModifier: "formal office top" },
    ],
  },
  ETHNIC_WEAR: {
    id: "ethnic_wear",
    name: "Ethnic Wear",
    keywords: ["ethnic", "kurta", "kurti", "saree", "sari", "lehenga", "salwar", "churidar", "sherwani", "dhoti"],
    defaultOccasions: ["Festivals", "Weddings / Functions", "Traditional"],
    defaultSeasons: ["All-Season"],
    styles: [
      { id: "kurta", name: "Kurta", category: "Ethnic Wear", keywords: ["kurta", "mens kurta", "long kurta"], searchModifier: "kurta" },
      { id: "kurti", name: "Kurti", category: "Ethnic Wear", keywords: ["kurti", "womens kurti", "short kurti"], searchModifier: "kurti" },
      { id: "saree", name: "Saree", category: "Ethnic Wear", keywords: ["saree", "sari", "silk saree"], searchModifier: "saree" },
      { id: "lehenga", name: "Lehenga", category: "Ethnic Wear", keywords: ["lehenga", "choli", "ghagra"], searchModifier: "lehenga choli" },
      { id: "salwar", name: "Salwar", category: "Ethnic Wear", keywords: ["salwar suit", "salwar kameez"], searchModifier: "salwar suit set" },
      { id: "churidar", name: "Churidar", category: "Ethnic Wear", keywords: ["churidar", "legging suit"], searchModifier: "churidar suit" },
      { id: "dhoti", name: "Dhoti", category: "Ethnic Wear", keywords: ["dhoti", "veshti"], searchModifier: "traditional dhoti" },
      { id: "pyjama", name: "Pyjama", category: "Ethnic Wear", keywords: ["pyjama", "kurta pyjama"], searchModifier: "kurta pyjama set" },
      { id: "sherwani", name: "Sherwani", category: "Ethnic Wear", keywords: ["sherwani", "groom sherwani", "indo-western"], searchModifier: "royal sherwani" },
    ],
  },
  BOTTOMS: {
    id: "bottoms",
    name: "Bottoms",
    keywords: ["bottoms", "pants", "trousers", "jeans", "shorts", "skirt", "joggers", "cargo", "leggings"],
    defaultOccasions: ["Everyday", "Casual Outings", "Office"],
    defaultSeasons: ["All-Season"],
    styles: [
      { id: "jeans", name: "Jeans", category: "Bottoms", keywords: ["jeans", "denim", "skinny", "straight leg", "baggy jeans"], searchModifier: "denim jeans" },
      { id: "trousers", name: "Trousers", category: "Bottoms", keywords: ["trousers", "chinos", "formal pants", "slacks"], searchModifier: "tailored trousers" },
      { id: "shorts", name: "Shorts", category: "Bottoms", keywords: ["shorts", "bermuda", "denim shorts"], searchModifier: "casual shorts" },
      { id: "skirt", name: "Skirt", category: "Bottoms", keywords: ["skirt", "pleated", "midi skirt", "pencil skirt"], searchModifier: "skirt" },
      { id: "joggers", name: "Joggers", category: "Bottoms", keywords: ["joggers", "sweatpants", "track pants"], searchModifier: "cotton joggers" },
      { id: "cargo-pants", name: "Cargo Pants", category: "Bottoms", keywords: ["cargo", "tactical", "utility pants"], searchModifier: "cargo pants" },
      { id: "leggings", name: "Leggings", category: "Bottoms", keywords: ["leggings", "tights", "yoga pants"], searchModifier: "stretch leggings" },
    ],
  },
  OUTERWEAR: {
    id: "outerwear",
    name: "Outerwear",
    keywords: ["outerwear", "jacket", "blazer", "coat", "hoodie", "sweater", "cardigan", "shrug"],
    defaultOccasions: ["Casual Outings", "Travel", "Office"],
    defaultSeasons: ["Autumn", "Winter", "All-Season"],
    styles: [
      { id: "jacket", name: "Jacket", category: "Outerwear", keywords: ["jacket", "denim jacket", "leather jacket", "bomber"], searchModifier: "jacket" },
      { id: "blazer", name: "Blazer", category: "Outerwear", keywords: ["blazer", "structured blazer", "suit jacket"], searchModifier: "structured blazer" },
      { id: "coat", name: "Coat", category: "Outerwear", keywords: ["coat", "overcoat", "trench coat"], searchModifier: "overcoat trench coat" },
      { id: "hoodie", name: "Hoodie", category: "Outerwear", keywords: ["hoodie", "pullover", "sweatshirt"], searchModifier: "fleece hoodie" },
      { id: "sweater", name: "Sweater", category: "Outerwear", keywords: ["sweater", "knit", "pullover sweater"], searchModifier: "knit sweater" },
      { id: "cardigan", name: "Cardigan", category: "Outerwear", keywords: ["cardigan", "button cardigan", "open front"], searchModifier: "cardigan sweater" },
    ],
  },
  FOOTWEAR: {
    id: "footwear",
    name: "Footwear",
    keywords: ["footwear", "shoes", "sneakers", "sandals", "boots", "flats", "heels", "loafers"],
    defaultOccasions: ["Everyday", "Casual Outings", "Office", "Party"],
    defaultSeasons: ["All-Season"],
    styles: [
      { id: "sneakers", name: "Sneakers", category: "Footwear", keywords: ["sneakers", "trainers", "running shoes", "white sneakers"], searchModifier: "sneakers" },
      { id: "formal-shoes", name: "Formal Shoes", category: "Footwear", keywords: ["formal shoes", "oxfords", "derbies", "monks", "loafers"], searchModifier: "leather formal shoes" },
      { id: "sandals", name: "Sandals", category: "Footwear", keywords: ["sandals", "slides", "strap sandals"], searchModifier: "sandals" },
      { id: "boots", name: "Boots", category: "Footwear", keywords: ["boots", "chelsea boots", "ankle boots"], searchModifier: "ankle boots" },
      { id: "flats", name: "Flats", category: "Footwear", keywords: ["flats", "ballerinas", "mules"], searchModifier: "flat shoes" },
      { id: "heels", name: "Heels", category: "Footwear", keywords: ["heels", "pumps", "stilettos", "block heels"], searchModifier: "heels" },
    ],
  },
  ACCESSORIES: {
    id: "accessories",
    name: "Accessories",
    keywords: ["accessories", "bag", "bags", "watch", "watches", "belt", "belts", "jewellery", "jewelry", "sunglasses", "shades"],
    defaultOccasions: ["Everyday", "Party", "Travel"],
    defaultSeasons: ["All-Season"],
    styles: [
      { id: "bags", name: "Bags", category: "Accessories", keywords: ["bag", "handbag", "tote", "backpack", "crossbody"], searchModifier: "handbag tote bag" },
      { id: "watches", name: "Watches", category: "Accessories", keywords: ["watch", "wrist watch", "chronograph"], searchModifier: "analog wristwatch" },
      { id: "belts", name: "Belts", category: "Accessories", keywords: ["belt", "leather belt"], searchModifier: "leather belt" },
      { id: "jewellery", name: "Jewellery", category: "Accessories", keywords: ["jewellery", "jewelry", "necklace", "earrings", "bracelet"], searchModifier: "fashion jewellery" },
      { id: "sunglasses", name: "Sunglasses", category: "Accessories", keywords: ["sunglasses", "shades", "aviators", "wayfarers"], searchModifier: "UV protection sunglasses" },
    ],
  },
};

/**
 * Returns available styles for any matched category
 */
export function getStylesForCategory(categoryName: string): TaxonomyStyle[] {
  const normalized = categoryName.toUpperCase().replace(/\s+/g, "_");
  if (OP_FASHION_TAXONOMY[normalized]) {
    return OP_FASHION_TAXONOMY[normalized].styles;
  }
  for (const key of Object.keys(OP_FASHION_TAXONOMY)) {
    const cat = OP_FASHION_TAXONOMY[key];
    if (
      cat.name.toLowerCase() === categoryName.toLowerCase() ||
      cat.keywords.some((k) => categoryName.toLowerCase().includes(k))
    ) {
      return cat.styles;
    }
  }
  return OP_FASHION_TAXONOMY.DRESSES.styles;
}
