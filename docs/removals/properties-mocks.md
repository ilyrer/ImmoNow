# Property Mock-Daten Entfernung - Detaillierte Dokumentation

**Datum:** 13. Oktober 2025  
**Status:** 🔄 In Bearbeitung  
**Ziel:** Alle Mock-Daten im Property-Bereich identifizieren und durch Backend-Anbindung ersetzen

---

## 📋 Übersicht: Mock-Daten nach Kategorie

### 1. Performance & Metrics (PropertyDetail.tsx)
**Status:** ❌ MOCK  
**Datei:** `src/components/properties/PropertyDetail.tsx:324`

```typescript
// ❌ MOCK - TODO: Backend-Endpunkt implementieren
const performanceData: Array<{ date: string; views: number; inquiries: number; visits: number }> = [];

// ❌ MOCK - Hardcoded Metrics
metrics: {
  views: 0,          // ← Sollte von Analytics-API kommen
  inquiries: 0,      // ← Sollte von CRM-API kommen
  visits: 0,         // ← Sollte von Appointment-API kommen
  daysOnMarket: 0,   // ← Sollte berechnet werden (created_at vs today)
}
```

**Lösung:**
```typescript
// ✅ Backend-Endpunkt
GET /properties/{id}/metrics
Response: {
  views: number;
  inquiries: number;
  visits: number;
  daysOnMarket: number;
  chartData: Array<{
    date: string;
    views: number;
    inquiries: number;
    visits: number;
  }>;
}

// ✅ Hook
export const usePropertyMetrics = (propertyId: string) => {
  return useQuery({
    queryKey: ['properties', propertyId, 'metrics'],
    queryFn: () => propertiesService.getMetrics(propertyId),
  });
};
```

---

### 2. Exposé-Generation (ExposeTab.tsx)
**Status:** ❌ VOLLSTÄNDIG MOCK  
**Datei:** `src/components/properties/ExposeTab.tsx:40-50`

```typescript
// ❌ MOCK - Alles TODO!
const generateExpose = (request: GenerateExposeRequest) => Promise.resolve();
const isGenerating = false;
const generateError = null;
const versions: any[] = [];
const isLoadingVersions = false;
const saveVersion = (version: any) => Promise.resolve();
const removeVersion = (versionId: string) => Promise.resolve();
const publishVersion = (versionId: string) => Promise.resolve();
```

**Lösung:**
```typescript
// ✅ Backend-Endpunkte
POST /properties/{id}/expose/generate
Request: {
  audience: 'kauf' | 'miete' | 'investor';
  tone: 'neutral' | 'elegant' | 'kurz';
  lang: 'de' | 'en';
  length: 'kurz' | 'standard' | 'ausfuehrlich';
  keywords: string[];
}
Response: ExposeVersion

GET /properties/{id}/expose/versions
Response: ExposeVersion[]

DELETE /properties/{id}/expose/versions/{versionId}

POST /properties/{id}/expose/versions/{versionId}/publish

// ✅ Service
class ExposeService {
  async generate(propertyId: string, config: ExposeConfig): Promise<ExposeVersion> {
    return await apiClient.post(`/properties/${propertyId}/expose/generate`, config);
  }
  
  async getVersions(propertyId: string): Promise<ExposeVersion[]> {
    return await apiClient.get(`/properties/${propertyId}/expose/versions`);
  }
}

// ✅ Hooks
export const useGenerateExpose = (propertyId: string) => {
  return useMutation({
    mutationFn: (config: ExposeConfig) => exposeService.generate(propertyId, config),
    onSuccess: () => {
      queryClient.invalidateQueries(['properties', propertyId, 'expose']);
    },
  });
};

export const useExposeVersions = (propertyId: string) => {
  return useQuery({
    queryKey: ['properties', propertyId, 'expose', 'versions'],
    queryFn: () => exposeService.getVersions(propertyId),
  });
};
```

---

### 3. Publishing (PublishTab.tsx)
**Status:** ❌ VOLLSTÄNDIG MOCK  
**Datei:** `src/components/properties/PublishTab.tsx:20-30`

```typescript
// ❌ MOCK - Alles TODO!
const jobs: any[] = [];
const createJob = (request: CreatePublishJobRequest) => Promise.resolve();
const updateJob = (jobId: string, updates: any) => Promise.resolve();
const retryJob = (jobId: string) => Promise.resolve();
const removeJob = (jobId: string) => Promise.resolve();
const validate = (portals: Portal[], property: any) => Promise.resolve([]);
const profiles: any[] = [];
const configs: any[] = [];
```

**Lösung:**
```typescript
// ✅ Backend-Endpunkte
POST /properties/{id}/publish
Request: {
  portals: Portal[];
  runAt: string | null;
  contactProfileId: string;
  mediaIds: string[];
}
Response: PublishJob

GET /properties/{id}/publish/jobs
Response: PublishJob[]

POST /properties/{id}/publish/validate
Request: { portals: Portal[] }
Response: ValidationResult[]

GET /publish/profiles
Response: ContactProfile[]

GET /publish/configs
Response: PortalConfig[]

// ✅ Service
class PublishService {
  async createJob(propertyId: string, request: CreatePublishJobRequest): Promise<PublishJob> {
    return await apiClient.post(`/properties/${propertyId}/publish`, request);
  }
  
  async getJobs(propertyId: string): Promise<PublishJob[]> {
    return await apiClient.get(`/properties/${propertyId}/publish/jobs`);
  }
  
  async validate(propertyId: string, portals: Portal[]): Promise<ValidationResult[]> {
    return await apiClient.post(`/properties/${propertyId}/publish/validate`, { portals });
  }
}

// ✅ Hooks
export const usePublishJobs = (propertyId: string) => {
  return useQuery({
    queryKey: ['properties', propertyId, 'publish', 'jobs'],
    queryFn: () => publishService.getJobs(propertyId),
  });
};

export const useCreatePublishJob = (propertyId: string) => {
  return useMutation({
    mutationFn: (request: CreatePublishJobRequest) => publishService.createJob(propertyId, request),
    onSuccess: () => {
      queryClient.invalidateQueries(['properties', propertyId, 'publish']);
    },
  });
};
```

---

### 4. Energy Efficiency (EnergyEfficiencyTab.tsx)
**Status:** ⚠️ TEILWEISE MOCK  
**Datei:** `src/components/properties/EnergyEfficiencyTab.tsx`

```typescript
// ⚠️ Energie-Daten kommen teilweise vom Backend, aber Charts sind Mock
const energyData = property.energyClass; // ✅ Backend
const chartData = [...]; // ❌ Mock für historische Daten
```

**Lösung:**
```typescript
// ✅ Backend-Endpunkt für historische Daten
GET /properties/{id}/energy/history
Response: {
  current: EnergyData;
  history: Array<{
    date: string;
    energyValue: number;
    co2Emissions: number;
  }>;
  benchmark: {
    regional: number;
    national: number;
  };
}

// ✅ Hook
export const usePropertyEnergy = (propertyId: string) => {
  return useQuery({
    queryKey: ['properties', propertyId, 'energy'],
    queryFn: () => propertiesService.getEnergyData(propertyId),
  });
};
```

---

### 5. Property Interface (Properties.tsx)
**Status:** ⚠️ ÜBERFLÜSSIGE FELDER  
**Datei:** `src/components/properties/Properties.tsx:8-250`

```typescript
// ❌ PROBLEM: 300+ Felder die nie genutzt werden!
interface Property extends Omit<APIProperty, 'images' | 'type' | 'features'> {
  // Absurde Felder:
  carbon_fiber_concrete?: boolean;
  flax_fiber_concrete?: boolean;
  hemp_fiber_concrete?: boolean;
  jute_fiber_concrete?: boolean;
  sisal_fiber_concrete?: boolean;
  // ... 200+ weitere concrete-Typen!
  
  // Und dann nochmal:
  spruce_cone_ash_fiber_concrete?: boolean;
  fir_cone_ash_fiber_concrete?: boolean;
  cedar_cone_ash_fiber_concrete?: boolean;
  // ... 100+ Baum-Zapfen-Concrete-Typen!
}
```

**Lösung:**
```typescript
// ✅ VEREINFACHEN: Nur tatsächlich genutzte Felder
interface Property {
  // Core Fields (von Backend)
  id: string;
  title: string;
  description: string;
  status: PropertyStatus;
  property_type: PropertyType;
  price?: number;
  location: string;
  
  // Details
  living_area?: number;
  rooms?: number;
  bathrooms?: number;
  year_built?: number;
  
  // Relations
  address?: Address;
  contact_person?: ContactPerson;
  features?: PropertyFeatures;
  images: PropertyImage[];
  
  // Timestamps
  created_at: string;
  updated_at: string;
  created_by: string;
  
  // UI-only (nicht von Backend)
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
}
```

---

### 6. Client-Side Filtering (PropertyList.tsx)
**Status:** ⚠️ INEFFIZIENT  
**Datei:** `src/components/properties/PropertyList.tsx:75-95`

```typescript
// ❌ PROBLEM: Client-side filtering statt Backend-Queries
const filteredProperties = properties.filter(property => {
  if (searchTerm && !property.title.toLowerCase().includes(searchTerm.toLowerCase())) {
    return false;
  }
  if (filters.type && property.type !== filters.type) {
    return false;
  }
  if (filters.status && property.status !== filters.status) {
    return false;
  }
  // ... mehr Client-side Logic
});
```

**Lösung:**
```typescript
// ✅ Backend-Filter nutzen
const { data: properties, isLoading } = useProperties({
  search: searchTerm,
  property_type: filters.type || undefined,
  status: filters.status || undefined,
  price_min: filters.priceMin ? parseInt(filters.priceMin) : undefined,
  price_max: filters.priceMax ? parseInt(filters.priceMax) : undefined,
  sort_by: sortBy,
  sort_order: 'desc',
  page: 1,
  size: 20,
});

// Backend macht das Filtering, nicht der Client!
```

---

## 🎯 Aktionsplan: Mock-Entfernung

### Phase 1: Critical (Diese Woche)
**Ziel:** Core-Properties ohne Client-side Logic

1. ✅ **Property Interface vereinfachen**
   - [ ] 300+ Felder auf 20-30 reduzieren
   - [ ] Nur tatsächlich genutzte Felder behalten
   - [ ] Datei: `src/components/properties/Properties.tsx`

2. ✅ **Backend-Filtering implementieren**
   - [ ] Client-side Filter entfernen
   - [ ] Backend-Query-Params nutzen
   - [ ] Datei: `src/components/properties/PropertyList.tsx`

3. ✅ **Metrics-Endpunkt implementieren**
   - [ ] Backend: `GET /properties/{id}/metrics`
   - [ ] Service: `propertiesService.getMetrics()`
   - [ ] Hook: `usePropertyMetrics()`
   - [ ] Datei: `src/components/properties/PropertyDetail.tsx`

### Phase 2: Important (Nächste Woche)
**Ziel:** Spezial-Features Backend-anbinden

4. ❌ **Exposé-System**
   - [ ] Backend: `/properties/{id}/expose/*` Endpunkte
   - [ ] Service: `src/services/expose.service.ts`
   - [ ] Hooks: `src/hooks/useExpose.ts`
   - [ ] Integration: `src/components/properties/ExposeTab.tsx`

5. ❌ **Publishing-System**
   - [ ] Backend: `/properties/{id}/publish/*` Endpunkte
   - [ ] Service: `src/services/publish.service.ts`
   - [ ] Hooks: `src/hooks/usePublish.ts`
   - [ ] Integration: `src/components/properties/PublishTab.tsx`

6. ⚠️ **Energy-Daten**
   - [ ] Backend: `/properties/{id}/energy/history`
   - [ ] Service: `propertiesService.getEnergyData()`
   - [ ] Hook: `usePropertyEnergy()`
   - [ ] Integration: `src/components/properties/EnergyEfficiencyTab.tsx`

### Phase 3: Nice-to-Have (Später)
**Ziel:** Advanced Features

7. ❌ **Media-Management**
   - [ ] Backend: `/properties/{id}/media/*`
   - [ ] Batch-Upload mit Progress
   - [ ] Image-Cropping
   - [ ] Video-Upload

8. ❌ **Virtual Tour**
   - [ ] Backend: `/properties/{id}/virtual-tour`
   - [ ] 360°-Viewer Integration
   - [ ] Hotspot-System

9. ❌ **Social Media**
   - [ ] Backend: `/properties/{id}/social/*`
   - [ ] Auto-Posting
   - [ ] Analytics

---

## 📊 Zusammenfassung: Mock-Daten Inventory

### Komponenten mit Mock-Daten:

| Komponente | Mock-Level | LOC Mock | Backend-Endpunkte fehlen |
|------------|-----------|----------|-------------------------|
| PropertyDetail.tsx | ⚠️ 20% | ~50 | `/properties/{id}/metrics` |
| ExposeTab.tsx | ❌ 100% | ~200 | `/properties/{id}/expose/*` |
| PublishTab.tsx | ❌ 100% | ~250 | `/properties/{id}/publish/*` |
| EnergyEfficiencyTab.tsx | ⚠️ 30% | ~100 | `/properties/{id}/energy/history` |
| PropertyList.tsx | ⚠️ 40% | ~80 | - (Backend-Filter nutzen) |
| Properties.tsx | ⚠️ 10% | ~300 | - (Interface vereinfachen) |
| ExposePreview.tsx | ❌ 100% | ~150 | - (hängt von Exposé-API ab) |
| ExposeVersionList.tsx | ❌ 100% | ~120 | - (hängt von Exposé-API ab) |
| PortalChecklist.tsx | ❌ 100% | ~180 | `/publish/configs` |
| PublishStatusTable.tsx | ❌ 100% | ~200 | `/properties/{id}/publish/jobs` |
| SocialMediaMarketing.tsx | ❌ 100% | ~300 | `/properties/{id}/social/*` |
| EmailMarketing.tsx | ❌ 100% | ~250 | `/properties/{id}/email/*` |
| VirtualTourViewer.tsx | ❌ 100% | ~220 | `/properties/{id}/virtual-tour` |
| MappingBadges.tsx | ❌ 100% | ~80 | - (UI-only) |
| PortalIntegration.tsx | ❌ 100% | ~200 | `/publish/portals/*` |

**Gesamt Mock-LOC:** ~2,680 Zeilen  
**Gesamt Komponenten mit Mock:** 15/17 (88%)  
**Backend-Endpunkte fehlen:** ~12

---

## 🚀 Nächste Schritte

### Heute:
1. ✅ Property Interface vereinfachen (Properties.tsx)
2. ✅ Backend-Filtering (PropertyList.tsx)
3. ✅ Metrics-Backend-Endpunkt spezifizieren

### Diese Woche:
4. ⚠️ Services erweitern (Metrics, Energy)
5. ⚠️ Hooks optimieren
6. ⚠️ PropertyDetail.tsx Backend-anbinden

### Nächste Woche:
7. ❌ Exposé-Backend implementieren
8. ❌ Publishing-Backend implementieren
9. ❌ Alle Spezial-Tabs migrieren

---

**Status:** 🔄 Analyse abgeschlossen, Implementation startet jetzt!
