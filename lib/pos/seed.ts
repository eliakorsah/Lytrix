// Deterministic seed data for the pharmacy POS demo.
//
// A fixed PRNG keeps figures stable between reloads, so the client sees the
// same charts every time and screenshots stay reproducible.

import type {
  Branch,
  Customer,
  Invoice,
  InvoiceLine,
  InvoicePayment,
  PosData,
  Product,
  Sale,
  SaleLine,
  Settings,
  Staff,
  StockBatch,
  Supplier,
  Transfer,
  PaymentMethod,
} from "./types";

/** Mulberry32 — small, fast, deterministic. */
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = rng(20260721);
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
const between = (min: number, max: number) => min + rand() * (max - min);
const intBetween = (min: number, max: number) => Math.floor(between(min, max + 1));

const addDays = (date: Date, days: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

export const SETTINGS: Settings = {
  businessName: "MediPlus Pharmacy",
  currencyCode: "GHS",
  currencySymbol: "₵",
  taxRate: 0.15,
  lowStockAlerts: true,
  expiryWarningDays: 90,
  receiptFooter: "Thank you for choosing MediPlus. Get well soon!",
};

export const BRANCHES: Branch[] = [
  {
    id: "br-main",
    name: "Main Branch — Accra Central",
    code: "ACC-01",
    isMain: true,
    address: "12 Kwame Nkrumah Avenue",
    city: "Accra",
    phone: "+233 30 123 4567",
    manager: "Ama Boateng",
    openedAt: "2016-03-14",
    active: true,
  },
  {
    id: "br-east-legon",
    name: "East Legon",
    code: "ACC-02",
    isMain: false,
    address: "8 Lagos Avenue, East Legon",
    city: "Accra",
    phone: "+233 30 224 8890",
    manager: "Kwesi Mensah",
    openedAt: "2018-07-02",
    active: true,
  },
  {
    id: "br-tema",
    name: "Tema Community 1",
    code: "TEM-01",
    isMain: false,
    address: "Site 4, Community 1",
    city: "Tema",
    phone: "+233 30 331 2204",
    manager: "Efua Danso",
    openedAt: "2019-11-18",
    active: true,
  },
  {
    id: "br-kumasi",
    name: "Kumasi Adum",
    code: "KMA-01",
    isMain: false,
    address: "24 Prempeh II Street, Adum",
    city: "Kumasi",
    phone: "+233 32 202 7781",
    manager: "Yaw Osei",
    openedAt: "2021-01-25",
    active: true,
  },
  {
    id: "br-takoradi",
    name: "Takoradi Market Circle",
    code: "TKD-01",
    isMain: false,
    address: "5 Market Circle",
    city: "Takoradi",
    phone: "+233 31 202 4419",
    manager: "Abena Quartey",
    openedAt: "2022-09-09",
    active: true,
  },
  {
    id: "br-tamale",
    name: "Tamale Central",
    code: "TML-01",
    isMain: false,
    address: "18 Hospital Road",
    city: "Tamale",
    phone: "+233 37 202 6653",
    manager: "Iddrisu Fuseini",
    openedAt: "2024-05-06",
    active: true,
  },
];

export const SUPPLIERS: Supplier[] = [
  { id: "sup-1", name: "Ernest Chemists Ltd", contact: "Daniel Owusu", phone: "+233 30 221 1180", email: "orders@ernestchem.com", leadTimeDays: 3 },
  { id: "sup-2", name: "Kinapharma Limited", contact: "Grace Adjei", phone: "+233 30 222 4416", email: "supply@kinapharma.com", leadTimeDays: 5 },
  { id: "sup-3", name: "Danadams Pharmaceutical", contact: "Samuel Tetteh", phone: "+233 30 251 7742", email: "sales@danadams.com", leadTimeDays: 4 },
  { id: "sup-4", name: "Tobinco Pharmaceuticals", contact: "Nana Yeboah", phone: "+233 30 268 9903", email: "distribution@tobinco.com", leadTimeDays: 7 },
  { id: "sup-5", name: "M&G Pharmaceuticals", contact: "Linda Asare", phone: "+233 30 277 3358", email: "hello@mgpharma.com", leadTimeDays: 6 },
];

type ProductSeed = Omit<Product, "id" | "barcode" | "supplierId">;

const PRODUCT_SEEDS: ProductSeed[] = [
  { name: "Amoxil", genericName: "Amoxicillin", brand: "GSK", category: "Antibiotics", form: "Capsule", strength: "500mg", packSize: "21 capsules", prescriptionOnly: true, controlled: false, costPrice: 18.4, sellPrice: 28.0, reorderLevel: 40 },
  { name: "Zithromax", genericName: "Azithromycin", brand: "Pfizer", category: "Antibiotics", form: "Tablet", strength: "500mg", packSize: "3 tablets", prescriptionOnly: true, controlled: false, costPrice: 32.0, sellPrice: 48.5, reorderLevel: 30 },
  { name: "Ciproxin", genericName: "Ciprofloxacin", brand: "Bayer", category: "Antibiotics", form: "Tablet", strength: "500mg", packSize: "10 tablets", prescriptionOnly: true, controlled: false, costPrice: 24.0, sellPrice: 37.0, reorderLevel: 35 },
  { name: "Flagyl", genericName: "Metronidazole", brand: "Sanofi", category: "Antibiotics", form: "Tablet", strength: "400mg", packSize: "21 tablets", prescriptionOnly: true, controlled: false, costPrice: 12.5, sellPrice: 19.5, reorderLevel: 45 },
  { name: "Panadol Extra", genericName: "Paracetamol + Caffeine", brand: "GSK", category: "Analgesics", form: "Tablet", strength: "500mg", packSize: "24 tablets", prescriptionOnly: false, controlled: false, costPrice: 6.2, sellPrice: 11.0, reorderLevel: 120 },
  { name: "Brufen", genericName: "Ibuprofen", brand: "Abbott", category: "Analgesics", form: "Tablet", strength: "400mg", packSize: "30 tablets", prescriptionOnly: false, controlled: false, costPrice: 9.0, sellPrice: 15.5, reorderLevel: 100 },
  { name: "Diclofenac Sodium", genericName: "Diclofenac", brand: "Kinapharma", category: "Analgesics", form: "Tablet", strength: "50mg", packSize: "20 tablets", prescriptionOnly: false, controlled: false, costPrice: 7.5, sellPrice: 13.0, reorderLevel: 80 },
  { name: "Tramadol", genericName: "Tramadol HCl", brand: "Danadams", category: "Analgesics", form: "Capsule", strength: "50mg", packSize: "10 capsules", prescriptionOnly: true, controlled: true, costPrice: 14.0, sellPrice: 24.0, reorderLevel: 25 },
  { name: "Coartem", genericName: "Artemether + Lumefantrine", brand: "Novartis", category: "Antimalarials", form: "Tablet", strength: "20/120mg", packSize: "24 tablets", prescriptionOnly: false, controlled: false, costPrice: 21.0, sellPrice: 34.0, reorderLevel: 90 },
  { name: "Lonart DS", genericName: "Artemether + Lumefantrine", brand: "Bliss GVS", category: "Antimalarials", form: "Tablet", strength: "80/480mg", packSize: "6 tablets", prescriptionOnly: false, controlled: false, costPrice: 26.5, sellPrice: 42.0, reorderLevel: 70 },
  { name: "Camosunate", genericName: "Artesunate + Amodiaquine", brand: "Geneith", category: "Antimalarials", form: "Tablet", strength: "100/270mg", packSize: "6 tablets", prescriptionOnly: false, controlled: false, costPrice: 19.0, sellPrice: 31.0, reorderLevel: 60 },
  { name: "Amatem Softgel", genericName: "Artemether + Lumefantrine", brand: "Ajanta", category: "Antimalarials", form: "Capsule", strength: "80/480mg", packSize: "6 capsules", prescriptionOnly: false, controlled: false, costPrice: 28.0, sellPrice: 45.0, reorderLevel: 50 },
  { name: "Amlodipine", genericName: "Amlodipine Besylate", brand: "Teva", category: "Cardiovascular", form: "Tablet", strength: "10mg", packSize: "30 tablets", prescriptionOnly: true, controlled: false, costPrice: 15.0, sellPrice: 25.0, reorderLevel: 55 },
  { name: "Lisinopril", genericName: "Lisinopril", brand: "Cipla", category: "Cardiovascular", form: "Tablet", strength: "10mg", packSize: "28 tablets", prescriptionOnly: true, controlled: false, costPrice: 17.5, sellPrice: 29.0, reorderLevel: 50 },
  { name: "Atorvastatin", genericName: "Atorvastatin Calcium", brand: "Ranbaxy", category: "Cardiovascular", form: "Tablet", strength: "20mg", packSize: "30 tablets", prescriptionOnly: true, controlled: false, costPrice: 22.0, sellPrice: 36.0, reorderLevel: 45 },
  { name: "Cardiprin", genericName: "Aspirin", brand: "Reckitt", category: "Cardiovascular", form: "Tablet", strength: "100mg", packSize: "30 tablets", prescriptionOnly: false, controlled: false, costPrice: 8.0, sellPrice: 14.0, reorderLevel: 70 },
  { name: "Glucophage", genericName: "Metformin HCl", brand: "Merck", category: "Diabetes", form: "Tablet", strength: "850mg", packSize: "30 tablets", prescriptionOnly: true, controlled: false, costPrice: 19.0, sellPrice: 31.5, reorderLevel: 60 },
  { name: "Daonil", genericName: "Glibenclamide", brand: "Sanofi", category: "Diabetes", form: "Tablet", strength: "5mg", packSize: "30 tablets", prescriptionOnly: true, controlled: false, costPrice: 13.0, sellPrice: 22.0, reorderLevel: 40 },
  { name: "Lantus SoloStar", genericName: "Insulin Glargine", brand: "Sanofi", category: "Diabetes", form: "Injection", strength: "100IU/ml", packSize: "1 pen", prescriptionOnly: true, controlled: false, costPrice: 148.0, sellPrice: 215.0, reorderLevel: 15 },
  { name: "Accu-Chek Test Strips", genericName: "Glucose Test Strips", brand: "Roche", category: "Medical Devices", form: "Device", strength: "—", packSize: "50 strips", prescriptionOnly: false, controlled: false, costPrice: 92.0, sellPrice: 135.0, reorderLevel: 20 },
  { name: "Vitamin C 1000", genericName: "Ascorbic Acid", brand: "Nature's Field", category: "Vitamins & Supplements", form: "Tablet", strength: "1000mg", packSize: "30 tablets", prescriptionOnly: false, controlled: false, costPrice: 16.0, sellPrice: 28.0, reorderLevel: 90 },
  { name: "Astymin Forte", genericName: "Multivitamin + Amino Acids", brand: "Tablets India", category: "Vitamins & Supplements", form: "Capsule", strength: "—", packSize: "30 capsules", prescriptionOnly: false, controlled: false, costPrice: 24.0, sellPrice: 39.0, reorderLevel: 65 },
  { name: "Ferrous Sulphate", genericName: "Ferrous Sulphate", brand: "Kinapharma", category: "Vitamins & Supplements", form: "Tablet", strength: "200mg", packSize: "30 tablets", prescriptionOnly: false, controlled: false, costPrice: 7.0, sellPrice: 12.5, reorderLevel: 75 },
  { name: "Folic Acid", genericName: "Folic Acid", brand: "Ernest Chemists", category: "Baby & Mother", form: "Tablet", strength: "5mg", packSize: "30 tablets", prescriptionOnly: false, controlled: false, costPrice: 5.0, sellPrice: 9.5, reorderLevel: 85 },
  { name: "Pregnacare", genericName: "Prenatal Multivitamin", brand: "Vitabiotics", category: "Baby & Mother", form: "Tablet", strength: "—", packSize: "30 tablets", prescriptionOnly: false, controlled: false, costPrice: 68.0, sellPrice: 98.0, reorderLevel: 25 },
  { name: "Calpol Syrup", genericName: "Paracetamol", brand: "GSK", category: "Baby & Mother", form: "Syrup", strength: "125mg/5ml", packSize: "100ml bottle", prescriptionOnly: false, controlled: false, costPrice: 14.0, sellPrice: 23.0, reorderLevel: 55 },
  { name: "Piriton", genericName: "Chlorpheniramine", brand: "GSK", category: "Cold & Flu", form: "Tablet", strength: "4mg", packSize: "30 tablets", prescriptionOnly: false, controlled: false, costPrice: 6.0, sellPrice: 11.0, reorderLevel: 80 },
  { name: "Actifed", genericName: "Triprolidine + Pseudoephedrine", brand: "GSK", category: "Cold & Flu", form: "Syrup", strength: "—", packSize: "100ml bottle", prescriptionOnly: false, controlled: false, costPrice: 18.0, sellPrice: 29.0, reorderLevel: 45 },
  { name: "Strepsils", genericName: "Amylmetacresol", brand: "Reckitt", category: "Cold & Flu", form: "Tablet", strength: "—", packSize: "24 lozenges", prescriptionOnly: false, controlled: false, costPrice: 11.0, sellPrice: 19.0, reorderLevel: 70 },
  { name: "Ventolin Inhaler", genericName: "Salbutamol", brand: "GSK", category: "Cold & Flu", form: "Inhaler", strength: "100mcg", packSize: "200 doses", prescriptionOnly: true, controlled: false, costPrice: 42.0, sellPrice: 65.0, reorderLevel: 30 },
  { name: "Betnovate-N", genericName: "Betamethasone + Neomycin", brand: "GSK", category: "Dermatology", form: "Cream", strength: "0.1%", packSize: "30g tube", prescriptionOnly: true, controlled: false, costPrice: 21.0, sellPrice: 34.0, reorderLevel: 40 },
  { name: "Canesten", genericName: "Clotrimazole", brand: "Bayer", category: "Dermatology", form: "Cream", strength: "1%", packSize: "20g tube", prescriptionOnly: false, controlled: false, costPrice: 19.0, sellPrice: 31.0, reorderLevel: 45 },
  { name: "Funbact-A", genericName: "Triple Action Cream", brand: "Aveiro", category: "Dermatology", form: "Cream", strength: "—", packSize: "30g tube", prescriptionOnly: false, controlled: false, costPrice: 13.0, sellPrice: 22.0, reorderLevel: 60 },
  { name: "Gaviscon", genericName: "Sodium Alginate", brand: "Reckitt", category: "Gastrointestinal", form: "Syrup", strength: "—", packSize: "200ml bottle", prescriptionOnly: false, controlled: false, costPrice: 26.0, sellPrice: 42.0, reorderLevel: 50 },
  { name: "Omeprazole", genericName: "Omeprazole", brand: "Cipla", category: "Gastrointestinal", form: "Capsule", strength: "20mg", packSize: "14 capsules", prescriptionOnly: false, controlled: false, costPrice: 15.0, sellPrice: 25.0, reorderLevel: 65 },
  { name: "Buscopan", genericName: "Hyoscine Butylbromide", brand: "Sanofi", category: "Gastrointestinal", form: "Tablet", strength: "10mg", packSize: "20 tablets", prescriptionOnly: false, controlled: false, costPrice: 17.0, sellPrice: 28.0, reorderLevel: 50 },
  { name: "ORS Sachets", genericName: "Oral Rehydration Salts", brand: "Kinapharma", category: "Gastrointestinal", form: "Drops", strength: "—", packSize: "10 sachets", prescriptionOnly: false, controlled: false, costPrice: 8.0, sellPrice: 14.0, reorderLevel: 90 },
  { name: "Elastoplast Wound Dressing", genericName: "Adhesive Dressing", brand: "Beiersdorf", category: "First Aid", form: "Device", strength: "—", packSize: "20 strips", prescriptionOnly: false, controlled: false, costPrice: 12.0, sellPrice: 21.0, reorderLevel: 60 },
  { name: "Savlon Antiseptic", genericName: "Cetrimide + Chlorhexidine", brand: "ABC", category: "First Aid", form: "Drops", strength: "—", packSize: "250ml bottle", prescriptionOnly: false, controlled: false, costPrice: 16.0, sellPrice: 27.0, reorderLevel: 55 },
  { name: "Omron Blood Pressure Monitor", genericName: "Digital BP Monitor", brand: "Omron", category: "Medical Devices", form: "Device", strength: "—", packSize: "1 unit", prescriptionOnly: false, controlled: false, costPrice: 285.0, sellPrice: 420.0, reorderLevel: 8 },
  { name: "Digital Thermometer", genericName: "Clinical Thermometer", brand: "Microlife", category: "Medical Devices", form: "Device", strength: "—", packSize: "1 unit", prescriptionOnly: false, controlled: false, costPrice: 32.0, sellPrice: 55.0, reorderLevel: 25 },
  { name: "Face Mask (Surgical)", genericName: "3-Ply Surgical Mask", brand: "Generic", category: "Medical Devices", form: "Device", strength: "—", packSize: "50 pieces", prescriptionOnly: false, controlled: false, costPrice: 18.0, sellPrice: 32.0, reorderLevel: 40 },
];

export const PRODUCTS: Product[] = PRODUCT_SEEDS.map((p, i) => ({
  ...p,
  id: `prd-${String(i + 1).padStart(3, "0")}`,
  barcode: `60${String(1000000 + i * 7919).padStart(9, "0")}`,
  supplierId: SUPPLIERS[i % SUPPLIERS.length].id,
}));

const FIRST_NAMES = ["Ama", "Kwesi", "Efua", "Yaw", "Abena", "Kofi", "Akosua", "Kojo", "Adwoa", "Kwabena", "Esi", "Fiifi", "Nana", "Akua", "Yaa"];
const LAST_NAMES = ["Boateng", "Mensah", "Danso", "Osei", "Quartey", "Asante", "Owusu", "Addo", "Frimpong", "Amoah", "Tetteh", "Sarpong"];

export const STAFF: Staff[] = (() => {
  const out: Staff[] = [];
  let n = 1;
  const push = (branchId: string, role: Staff["role"], name: string) => {
    out.push({
      id: `stf-${String(n).padStart(3, "0")}`,
      name,
      // Strip titles/punctuation so "Dr. Peter" doesn't become "dr..peter".
      email: `${name
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .trim()
        .replace(/\s+/g, ".")}@mediplus.com.gh`,
      phone: `+233 5${intBetween(10, 59)} ${intBetween(100, 999)} ${intBetween(1000, 9999)}`,
      role,
      branchId,
      active: rand() > 0.08,
      lastActive: new Date(Date.now() - intBetween(0, 96) * 3600_000).toISOString(),
    });
    n += 1;
  };

  push("br-main", "Administrator", "Dr. Peter");
  for (const b of BRANCHES) {
    push(b.id, "Branch Manager", b.manager);
    const pharmacists = b.isMain ? 3 : 2;
    for (let i = 0; i < pharmacists; i += 1) {
      push(b.id, "Pharmacist", `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`);
    }
    const cashiers = b.isMain ? 4 : intBetween(2, 3);
    for (let i = 0; i < cashiers; i += 1) {
      push(b.id, "Cashier", `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`);
    }
  }
  return out;
})();

/** Build per-branch, per-product batches with realistic expiry spread. */
function buildStock(now: Date): StockBatch[] {
  const batches: StockBatch[] = [];
  let n = 1;

  for (const branch of BRANCHES) {
    // Newer branches carry a narrower range and thinner stock.
    const branchAgeYears = (now.getTime() - new Date(branch.openedAt).getTime()) / (365 * 864e5);
    const depth = branch.isMain ? 1.8 : Math.min(1.2, 0.5 + branchAgeYears * 0.16);

    for (const product of PRODUCTS) {
      // Newer branches don't stock the full catalogue.
      if (!branch.isMain && rand() > 0.82 + branchAgeYears * 0.02) continue;

      const batchCount = rand() > 0.62 ? 2 : 1;
      for (let i = 0; i < batchCount; i += 1) {
        // ~7% of batches are near expiry so the alerts panel has real content.
        const nearExpiry = rand() < 0.07;
        const expiryOffset = nearExpiry ? intBetween(-20, 85) : intBetween(150, 900);
        const base = product.reorderLevel * depth;
        // ~10% of lines fall below reorder level to drive low-stock alerts.
        const low = rand() < 0.1;
        const quantity = low
          ? intBetween(0, Math.max(1, Math.floor(product.reorderLevel * 0.55)))
          : Math.round(between(base * 0.9, base * 2.4));

        batches.push({
          id: `btc-${String(n).padStart(5, "0")}`,
          productId: product.id,
          branchId: branch.id,
          batchNumber: `B${String(intBetween(10000, 99999))}`,
          quantity,
          expiryDate: addDays(now, expiryOffset).toISOString().slice(0, 10),
          receivedAt: addDays(now, -intBetween(10, 420)).toISOString().slice(0, 10),
        });
        n += 1;
      }
    }
  }
  return batches;
}

const PAYMENT_METHODS: PaymentMethod[] = ["Cash", "Card", "Mobile Money", "Insurance"];
const CUSTOMERS = ["Walk-in Customer", "Walk-in Customer", "Walk-in Customer", "Joseph Anane", "Mariam Sulemana", "Comfort Nyarko", "Daniel Appiah", "Gifty Ansah", "Ibrahim Mohammed", "Priscilla Boadu"];

/** 120 days of sales history, weighted so weekends and month-ends are busier. */
function buildSales(now: Date, stock: StockBatch[]): Sale[] {
  const sales: Sale[] = [];
  const DAYS = 120;
  let receipt = 100001;

  const cashiersByBranch = new Map<string, Staff[]>();
  for (const b of BRANCHES) {
    cashiersByBranch.set(
      b.id,
      STAFF.filter((s) => s.branchId === b.id && (s.role === "Cashier" || s.role === "Pharmacist")),
    );
  }

  for (let d = DAYS; d >= 0; d -= 1) {
    const day = addDays(now, -d);
    const dow = day.getDay();
    const dom = day.getDate();

    // Weekend lift, month-end payday lift, plus gentle growth toward today.
    const weekend = dow === 6 ? 1.25 : dow === 0 ? 0.7 : 1;
    const payday = dom >= 26 || dom <= 3 ? 1.3 : 1;
    const growth = 0.78 + (1 - d / DAYS) * 0.42;

    for (const branch of BRANCHES) {
      const branchAgeYears = (now.getTime() - new Date(branch.openedAt).getTime()) / (365 * 864e5);
      const branchScale = branch.isMain ? 2.4 : Math.min(1.5, 0.45 + branchAgeYears * 0.2);
      const txCount = Math.max(1, Math.round(between(9, 17) * weekend * payday * growth * branchScale));

      const branchStock = stock.filter((s) => s.branchId === branch.id && s.quantity > 0);
      if (branchStock.length === 0) continue;
      const cashiers = cashiersByBranch.get(branch.id) ?? [];
      if (cashiers.length === 0) continue;

      for (let t = 0; t < txCount; t += 1) {
        const lineCount = rand() < 0.45 ? 1 : rand() < 0.8 ? 2 : intBetween(3, 5);
        const lines: SaleLine[] = [];
        const used = new Set<string>();

        for (let l = 0; l < lineCount; l += 1) {
          const batch = pick(branchStock);
          if (used.has(batch.productId)) continue;
          used.add(batch.productId);
          const product = PRODUCTS.find((p) => p.id === batch.productId);
          if (!product) continue;
          const qty = product.sellPrice > 100 ? 1 : intBetween(1, 3);
          const discount = rand() < 0.12 ? Math.round(product.sellPrice * qty * 0.05 * 100) / 100 : 0;
          lines.push({
            productId: product.id,
            name: product.name,
            strength: product.strength,
            quantity: qty,
            unitPrice: product.sellPrice,
            discount,
            batchNumber: batch.batchNumber,
          });
        }
        if (lines.length === 0) continue;

        const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
        const discount = lines.reduce((s, l) => s + l.discount, 0);
        const tax = Math.round((subtotal - discount) * SETTINGS.taxRate * 100) / 100;
        const total = Math.round((subtotal - discount + tax) * 100) / 100;
        const method = rand() < 0.46 ? "Cash" : rand() < 0.72 ? "Mobile Money" : rand() < 0.9 ? "Card" : "Insurance";
        const tendered = method === "Cash" ? Math.ceil(total / 5) * 5 : total;
        const cashier = pick(cashiers);
        const hour = intBetween(8, 20);
        const at = new Date(day);
        at.setHours(hour, intBetween(0, 59), intBetween(0, 59), 0);

        const rx = lines.some((l) => PRODUCTS.find((p) => p.id === l.productId)?.prescriptionOnly);

        sales.push({
          id: `sal-${receipt}`,
          receiptNo: `${branch.code}-${receipt}`,
          branchId: branch.id,
          createdAt: at.toISOString(),
          lines,
          subtotal: Math.round(subtotal * 100) / 100,
          discount: Math.round(discount * 100) / 100,
          tax,
          total,
          paymentMethod: method as PaymentMethod,
          amountTendered: tendered,
          change: Math.round((tendered - total) * 100) / 100,
          cashierId: cashier.id,
          cashierName: cashier.name,
          customerName: pick(CUSTOMERS),
          prescriptionRef: rx ? `RX-${intBetween(10000, 99999)}` : undefined,
          status: rand() < 0.006 ? "refunded" : "completed",
        });
        receipt += 1;
      }
    }
  }

  return sales.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function buildTransfers(now: Date): Transfer[] {
  const out: Transfer[] = [];
  const statuses: Transfer["status"][] = ["pending", "in-transit", "received", "received", "received", "cancelled"];

  for (let i = 0; i < 24; i += 1) {
    const from = pick(BRANCHES);
    let to = pick(BRANCHES);
    while (to.id === from.id) to = pick(BRANCHES);

    const lineCount = intBetween(1, 4);
    const lines = Array.from({ length: lineCount }, () => {
      const p = pick(PRODUCTS);
      return {
        productId: p.id,
        name: p.name,
        quantity: intBetween(5, 60),
        batchNumber: `B${String(intBetween(10000, 99999))}`,
      };
    });

    out.push({
      id: `trf-${String(i + 1).padStart(3, "0")}`,
      reference: `TRF-${2026}${String(intBetween(100, 999))}`,
      fromBranchId: from.id,
      toBranchId: to.id,
      createdAt: addDays(now, -intBetween(0, 45)).toISOString(),
      status: pick(statuses),
      requestedBy: pick(STAFF.filter((s) => s.branchId === to.id))?.name ?? "Ama Boateng",
      note: rand() < 0.4 ? "Urgent — stock-out at counter" : undefined,
      lines,
    });
  }

  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export const CUSTOMERS_ACCOUNTS: Customer[] = [
  { id: "cus-1", name: "National Health Insurance Scheme", type: "Insurance", contact: "Claims Desk", phone: "+233 30 268 3400", email: "claims@nhis.gov.gh", creditLimit: 250000, paymentTermsDays: 60, active: true },
  { id: "cus-2", name: "Acacia Health Insurance", type: "Insurance", contact: "Doris Amankwah", phone: "+233 30 274 1180", email: "providers@acaciahealth.com", creditLimit: 120000, paymentTermsDays: 45, active: true },
  { id: "cus-3", name: "Nationwide Medical Insurance", type: "Insurance", contact: "Kofi Baidoo", phone: "+233 30 279 6620", email: "billing@nmi.com.gh", creditLimit: 90000, paymentTermsDays: 45, active: true },
  { id: "cus-4", name: "Ridge Hospital Pharmacy Unit", type: "Corporate", contact: "Dr. Selina Adu", phone: "+233 30 222 8900", email: "pharmacy@ridgehospital.gov.gh", creditLimit: 80000, paymentTermsDays: 30, active: true },
  { id: "cus-5", name: "Goldfields Ghana Ltd — Clinic", type: "Corporate", contact: "Emmanuel Kyei", phone: "+233 31 209 3311", email: "clinic@goldfields.com.gh", creditLimit: 150000, paymentTermsDays: 30, active: true },
  { id: "cus-6", name: "Unilever Ghana Staff Clinic", type: "Corporate", contact: "Vivian Otoo", phone: "+233 30 221 7745", email: "staffclinic@unilever.com.gh", creditLimit: 60000, paymentTermsDays: 30, active: true },
  { id: "cus-7", name: "St. Theresa's Clinic, Tema", type: "Corporate", contact: "Sr. Mary Agyeman", phone: "+233 30 330 2214", email: "admin@sttheresaclinic.org", creditLimit: 40000, paymentTermsDays: 21, active: true },
  { id: "cus-8", name: "Ashanti Gold Staff Welfare", type: "Corporate", contact: "Yaw Boakye", phone: "+233 32 208 4417", email: "welfare@ashantigold.com", creditLimit: 55000, paymentTermsDays: 30, active: true },
  { id: "cus-9", name: "Mr. Samuel Nkrumah", type: "Individual", contact: "Samuel Nkrumah", phone: "+233 24 411 9082", email: "s.nkrumah@gmail.com", creditLimit: 5000, paymentTermsDays: 14, active: true },
  { id: "cus-10", name: "Mrs. Beatrice Ofori", type: "Individual", contact: "Beatrice Ofori", phone: "+233 20 776 3341", email: "b.ofori@yahoo.com", creditLimit: 3000, paymentTermsDays: 14, active: true },
];

/**
 * A credit-invoice book with a realistic ageing profile — some paid, some part
 * paid, some overdue — so the receivables view has something to show.
 */
function buildInvoices(now: Date): Invoice[] {
  const out: Invoice[] = [];
  const issuers = STAFF.filter(
    (s) => s.role === "Branch Manager" || s.role === "Administrator" || s.role === "Pharmacist",
  );

  for (let i = 0; i < 64; i += 1) {
    const customer = pick(CUSTOMERS_ACCOUNTS);
    const branch = pick(BRANCHES);
    const issuer =
      pick(issuers.filter((s) => s.branchId === branch.id)) ?? issuers[0];

    const issuedAt = addDays(now, -intBetween(0, 110));
    const dueAt = addDays(issuedAt, customer.paymentTermsDays);

    const lineCount = intBetween(2, 7);
    const lines: InvoiceLine[] = [];
    const used = new Set<string>();
    for (let l = 0; l < lineCount; l += 1) {
      const product = pick(PRODUCTS);
      if (used.has(product.id)) continue;
      used.add(product.id);
      const qty = intBetween(5, 60);
      lines.push({
        productId: product.id,
        name: product.name,
        strength: product.strength,
        quantity: qty,
        unitPrice: product.sellPrice,
        discount: rand() < 0.3 ? Math.round(product.sellPrice * qty * 0.04 * 100) / 100 : 0,
      });
    }
    if (!lines.length) continue;

    const subtotal = Math.round(lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0) * 100) / 100;
    const discount = Math.round(lines.reduce((s, l) => s + l.discount, 0) * 100) / 100;
    const tax = Math.round((subtotal - discount) * SETTINGS.taxRate * 100) / 100;
    const total = Math.round((subtotal - discount + tax) * 100) / 100;

    const overdue = dueAt.getTime() < now.getTime();
    const roll = rand();
    const payments: InvoicePayment[] = [];
    let status: Invoice["status"];

    if (roll < 0.05) {
      status = "cancelled";
    } else if (roll < 0.52) {
      // Settled in full.
      payments.push({
        id: `pay-${i}-1`,
        amount: total,
        method: pick(["Card", "Mobile Money", "Insurance"] as PaymentMethod[]),
        reference: `PAY-${intBetween(100000, 999999)}`,
        paidAt: addDays(issuedAt, intBetween(3, customer.paymentTermsDays)).toISOString(),
        recordedBy: issuer.name,
      });
      status = "paid";
    } else if (roll < 0.72) {
      // Part payment against the balance.
      const part = Math.round(total * between(0.25, 0.7) * 100) / 100;
      payments.push({
        id: `pay-${i}-1`,
        amount: part,
        method: pick(["Card", "Mobile Money", "Insurance"] as PaymentMethod[]),
        reference: `PAY-${intBetween(100000, 999999)}`,
        paidAt: addDays(issuedAt, intBetween(5, 40)).toISOString(),
        recordedBy: issuer.name,
      });
      status = "part-paid";
    } else {
      status = overdue ? "overdue" : "issued";
    }

    out.push({
      id: `inv-${String(i + 1).padStart(4, "0")}`,
      invoiceNo: `INV-${branch.code}-${1000 + i}`,
      branchId: branch.id,
      customerId: customer.id,
      customerName: customer.name,
      issuedAt: issuedAt.toISOString().slice(0, 10),
      dueAt: dueAt.toISOString().slice(0, 10),
      lines,
      subtotal,
      discount,
      tax,
      total,
      payments,
      status,
      issuedById: issuer.id,
      issuedByName: issuer.name,
      note: rand() < 0.25 ? "Monthly supply order — deliver to stores." : undefined,
    });
  }

  return out.sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
}

/**
 * Build the full demo dataset.
 * `now` is injected so the caller controls it — the store only seeds on the
 * client, which keeps server and client renders from disagreeing on dates.
 */
export function buildSeedData(now: Date = new Date()): PosData {
  const stock = buildStock(now);
  return {
    branches: BRANCHES,
    products: PRODUCTS,
    stock,
    suppliers: SUPPLIERS,
    sales: buildSales(now, stock),
    transfers: buildTransfers(now),
    staff: STAFF,
    customers: CUSTOMERS_ACCOUNTS,
    invoices: buildInvoices(now),
    settings: SETTINGS,
  };
}
