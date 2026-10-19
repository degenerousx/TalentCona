/**
 * Laptops — mock inventory for the Laptops module (Figma section 293:29068).
 *
 * The portal has no API yet, so every module ships its screen data as typed
 * constants. Swap these for fetches when the backend lands.
 */

export type LaptopStatus = "Published" | "Pending" | "Draft";
export type StorageType = "SSD" | "HDD";

export type Laptop = {
  id: string;
  // Step 1 — Basic Details
  brand: string;
  model: string;
  deviceName: string;
  /** File name of the uploaded cover (no upload API yet). */
  cover?: string;
  program: string;
  /** Price in naira. */
  amount: number;
  // Step 2 — Specifications
  processor: string;
  ram: string;
  storage: string;
  storageType: StorageType;
  screenSize: string;
  resolution: string;
  os: string;
  status: LaptopStatus;
  /** ISO date (YYYY-MM-DD). */
  updated: string;
};

/** Everything the add/edit form collects. */
export type LaptopDraft = Omit<Laptop, "id" | "status" | "updated">;

export const brands = ["Apple", "Dell", "HP", "Lenovo", "Asus", "Acer", "Microsoft"];

export const processors = [
  "Intel Core i5-1335U",
  "Intel Core i7-1360P",
  "Intel Core i7-1365U",
  "AMD Ryzen 5 7530U",
  "AMD Ryzen 7 7735U",
  "Apple M2",
  "Apple M3",
];

export const programs = [
  "Front-End Development",
  "Back-End Development",
  "Full-Stack Development",
  "Mobile Dev & UI/UX",
  "Product Design",
  "Data Analysis",
];

export const emptyDraft: LaptopDraft = {
  brand: "",
  model: "",
  deviceName: "",
  program: "",
  amount: 0,
  processor: "",
  ram: "",
  storage: "",
  storageType: "SSD",
  screenSize: "",
  resolution: "",
  os: "",
};

export const toDraft = (l: Laptop): LaptopDraft => {
  const draft: Partial<Laptop> = { ...l };
  delete draft.id;
  delete draft.status;
  delete draft.updated;
  return draft as LaptopDraft;
};

/** Short spec chips for the table: "i7-1360P", "16GB", "512GB SSD". */
export const specChips = (l: Laptop) =>
  [l.processor.replace(/^(Intel Core|AMD Ryzen \d)\s+/, ""), l.ram, l.storage && `${l.storage} ${l.storageType}`].filter(
    Boolean,
  );

export const formatNaira = (amount: number) => `₦${amount.toLocaleString("en-NG")}`;

export const today = () => new Date().toISOString().slice(0, 10);

export const initialLaptops: Laptop[] = [
  {
    id: "dell-xps-13-plus",
    brand: "Dell",
    model: "XPS 13 Plus",
    deviceName: "XPS 13 Plus — Graphite",
    program: "Full-Stack Development",
    amount: 1_285_000,
    processor: "Intel Core i7-1360P",
    ram: "16GB",
    storage: "512GB",
    storageType: "SSD",
    screenSize: '13.4"',
    resolution: "1920 × 1200",
    os: "Windows 11 Pro",
    status: "Published",
    updated: "2024-02-16",
  },
  {
    id: "apple-macbook-air-m2",
    brand: "Apple",
    model: "MacBook Air M2",
    deviceName: "MacBook Air M2 — Midnight",
    program: "Mobile Dev & UI/UX",
    amount: 1_450_000,
    processor: "Intel Core i7-1360P",
    ram: "16GB",
    storage: "512GB",
    storageType: "SSD",
    screenSize: '13.6"',
    resolution: "2560 × 1664",
    os: "macOS Sonoma",
    status: "Published",
    updated: "2024-02-16",
  },
  {
    id: "hp-elitebook-840-g9",
    brand: "HP",
    model: "EliteBook 840 G9",
    deviceName: "EliteBook 840 G9 — Silver",
    program: "Data Analysis",
    amount: 980_000,
    processor: "Intel Core i7-1360P",
    ram: "16GB",
    storage: "512GB",
    storageType: "SSD",
    screenSize: '14"',
    resolution: "1920 × 1200",
    os: "Windows 11 Pro",
    status: "Pending",
    updated: "2024-02-16",
  },
];
