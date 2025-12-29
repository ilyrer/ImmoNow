# ImmoNow Frontend

## 📋 Übersicht

Das ImmoNow Frontend ist eine moderne **React 18 Single Page Application (SPA)** mit **TypeScript**, die eine intuitive Benutzeroberfläche für die Immobilienverwaltung bietet.

### Kernfeatures

- 🎨 **Modern UI**: Glassmorphism Design mit Tailwind CSS
- ⚡ **React 18**: Concurrent Features, Suspense, Automatic Batching
- 🔷 **TypeScript**: Vollständige Type Safety
- 🔄 **TanStack Query**: Server State Management ohne Redux
- 📱 **Responsive**: Mobile-first Design für alle Bildschirmgrößen
- 🌓 **Dark/Light Mode**: Theme-Switching mit System-Präferenz
- 🗺️ **Google Maps**: Integrierte Kartenansichten
- 💬 **AI Chat**: Lokale AI mit RAG (Retrieval Augmented Generation)
- 📊 **Kanban Boards**: Drag & Drop Task Management
- 📈 **Charts & Analytics**: Visualisierungen mit Recharts
- 🔔 **Toast Notifications**: Feedback mit react-hot-toast
- 🎭 **Icons**: Lucide React Icon Library

---

## 🏗️ Architektur

### Tech Stack

| Komponente | Technologie | Version |
|------------|------------|---------|
| **Framework** | React | 18.3.1 |
| **Language** | TypeScript | 5.0+ |
| **State Management** | TanStack Query | 4.36+ |
| **Routing** | React Router DOM | 6.20+ |
| **Styling** | Tailwind CSS | 3.3+ |
| **HTTP Client** | Axios | 1.6+ |
| **Forms** | React Hook Form | 7.48+ |
| **Charts** | Recharts | 2.10+ |
| **Icons** | Lucide React | Latest |
| **Maps** | @react-google-maps/api | 2.19+ |

### State Management Pattern

**TanStack Query Only - Kein Redux!**

```typescript
// ✅ Richtig: TanStack Query
const { data: properties } = useProperties();
const createMutation = useCreateProperty();

// ❌ Falsch: Redux
const properties = useSelector(state => state.properties);
const dispatch = useDispatch();
```

### Projektstruktur

```
frontend/
├── public/
│   ├── index.html
│   ├── manifest.json
│   └── robots.txt
├── src/
│   ├── App.jsx                 # Main App Component (Routing)
│   ├── index.tsx               # Entry Point
│   ├── api/                    # API Layer
│   │   ├── config.ts           # Axios Instance, Base URL
│   │   ├── services.ts         # Generic API Utilities
│   │   ├── hooks.ts            # Shared Query Hooks
│   │   └── [domain]/           # Domain-spezifische APIs
│   │       ├── types.ts        # TypeScript Interfaces
│   │       └── index.ts        # API Functions
│   ├── components/             # React Components
│   │   ├── common/             # Wiederverwendbare Komponenten
│   │   │   ├── GlobalSidebar.tsx
│   │   │   ├── GlassButton.tsx
│   │   │   ├── GlassCard.tsx
│   │   │   └── ...
│   │   ├── dashboard/          # Dashboard-spezifisch
│   │   │   ├── Kanban/
│   │   │   ├── Statistics/
│   │   │   └── ...
│   │   ├── properties/         # Property Management
│   │   ├── contacts/           # Contact Management
│   │   ├── tasks/              # Task Management
│   │   ├── profile/            # User Profile
│   │   │   └── tabs/           # Profile Tabs
│   │   ├── admin/              # Admin Console
│   │   │   ├── AIKnowledgeBase.tsx
│   │   │   └── ...
│   │   ├── AI/                 # AI Components
│   │   │   ├── AIChat.tsx
│   │   │   └── ...
│   │   └── Layout/             # Layout Components
│   │       └── Layout.jsx
│   ├── hooks/                  # Custom React Hooks
│   │   ├── useAIChat.ts        # AI Chat with RAG
│   │   ├── useProfile.ts       # Profile Management
│   │   ├── useTasks.ts         # Task Management
│   │   ├── useProperties.ts    # Property Management
│   │   └── ...
│   ├── pages/                  # Page Components
│   │   ├── Dashboard.jsx
│   │   ├── PropertiesPage.jsx
│   │   ├── ContactsPage.jsx
│   │   └── ...
│   ├── contexts/               # React Context Providers
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   ├── types/                  # Shared TypeScript Types
│   │   ├── index.ts
│   │   └── ...
│   ├── utils/                  # Utility Functions
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── ...
│   ├── styles/                 # Global Styles
│   │   └── globals.css
│   └── config/                 # Configuration
│       └── constants.ts
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

---

## 🚀 Installation & Setup

### Voraussetzungen

- **Node.js 18+** installiert
- **npm 9+** oder **yarn 1.22+**
- Backend läuft auf http://localhost:8000

### 1. Dependencies Installieren

```bash
cd frontend
npm install
```

### 2. Environment Variables

Erstelle `.env` im `frontend/` Verzeichnis:

```env
# API Backend URL
REACT_APP_API_URL=http://localhost:8000/api/v1

# Google Maps (optional)
REACT_APP_GOOGLE_MAPS_API_KEY=dein-google-maps-key

# Environment
REACT_APP_ENV=development
```

**Hinweis:** `package.json` enthält bereits einen Proxy zu `http://localhost:8000`, daher können auch relative URLs verwendet werden.

### 3. Development Server Starten

```bash
npm start
```

**Oder mit Windows Batch Script:**
```bash
start-app.bat
```

**URLs:**
- Frontend: http://localhost:3000
- Backend Proxy: http://localhost:3000/api/v1

### 4. Production Build

```bash
npm run build
```

Build-Artefakte landen in `build/` Verzeichnis.

---

## 📚 Entwicklung

### TanStack Query Patterns

#### Query Hook Pattern

```typescript
// hooks/useProperties.ts
import { useQuery } from '@tanstack/react-query';

export const propertyKeys = {
  all: ['properties'] as const,
  lists: () => [...propertyKeys.all, 'list'] as const,
  list: (params: PropertyListParams) => [...propertyKeys.lists(), params] as const,
  details: () => [...propertyKeys.all, 'detail'] as const,
  detail: (id: string) => [...propertyKeys.details(), id] as const,
};

export const useProperties = (params: PropertyListParams) => {
  return useQuery({
    queryKey: propertyKeys.list(params),
    queryFn: () => propertyService.listProperties(params),
    staleTime: 5 * 60 * 1000, // 5 Minuten
  });
};

export const useProperty = (id: string) => {
  return useQuery({
    queryKey: propertyKeys.detail(id),
    queryFn: () => propertyService.getProperty(id),
    enabled: !!id,
  });
};
```

#### Mutation Hook Pattern

```typescript
export const useCreateProperty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PropertyCreate) => propertyService.createProperty(data),
    onSuccess: () => {
      // Invalidate und refetch
      queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
      toast.success('Immobilie erstellt');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Fehler beim Erstellen');
    },
  });
};
```

#### Optimistic Updates

```typescript
export const useUpdateProperty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PropertyUpdate }) =>
      propertyService.updateProperty(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: propertyKeys.detail(id) });

      // Snapshot previous value
      const previousProperty = queryClient.getQueryData(propertyKeys.detail(id));

      // Optimistically update
      queryClient.setQueryData(propertyKeys.detail(id), (old: any) => ({
        ...old,
        ...data,
      }));

      return { previousProperty };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousProperty) {
        queryClient.setQueryData(
          propertyKeys.detail(variables.id),
          context.previousProperty
        );
      }
      toast.error('Fehler beim Aktualisieren');
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.detail(variables.id) });
    },
  });
};
```

### Component Pattern

```tsx
// components/properties/PropertyCard.tsx
import { Property } from '@/types';

interface PropertyCardProps {
  property: Property;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onEdit,
  onDelete,
}) => {
  const deleteMutation = useDeleteProperty();

  const handleDelete = () => {
    if (window.confirm('Wirklich löschen?')) {
      deleteMutation.mutate(property.id);
    }
  };

  return (
    <div className="glass-card p-4 rounded-lg">
      <h3 className="text-lg font-semibold">{property.title}</h3>
      <p className="text-gray-600">{property.address}</p>
      <div className="flex gap-2 mt-4">
        <button onClick={() => onEdit?.(property.id)}>Bearbeiten</button>
        <button onClick={handleDelete} disabled={deleteMutation.isPending}>
          {deleteMutation.isPending ? 'Wird gelöscht...' : 'Löschen'}
        </button>
      </div>
    </div>
  );
};
```

---

## 🎨 UI Components

### Glassmorphism Design System

#### GlassCard

```tsx
<GlassCard className="p-6">
  <h2>Card Title</h2>
  <p>Content...</p>
</GlassCard>
```

#### GlassButton

```tsx
<GlassButton
  variant="primary"
  icon={Save}
  onClick={handleSave}
  disabled={isPending}
>
  Speichern
</GlassButton>
```

**Variants:**
- `primary` - Blau (Hauptaktionen)
- `secondary` - Grau (Sekundäraktionen)
- `success` - Grün (Erfolg)
- `danger` - Rot (Löschen, Abbrechen)

#### GlobalSidebar

Collapsible Sidebar mit Glassmorphism:

```tsx
<GlobalSidebar
  items={navItems}
  collapsed={isCollapsed}
  onCollapsedChange={setIsCollapsed}
/>
```

**States:**
- Expanded: 300px Breite
- Collapsed: 90px Breite
- Smooth Transition: 300ms ease-in-out

### Tailwind Utilities

```tsx
// Flex mit min-width Prevent Overflow
<div className="flex-1 min-w-0">...</div>

// Glassmorphism
<div className="bg-white/10 backdrop-blur-md">...</div>

// Dark Mode Support
<div className="bg-white dark:bg-gray-800">...</div>

// Responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">...</div>
```

---

## 🤖 AI Integration

### AI Chat Component

```tsx
import { AIChat } from '@/components/AI/AIChat';

<AIChat
  onNavigate={(path) => navigate(path)}
  onToast={(message, type) => toast[type](message)}
  onOpenModal={(modalType) => setModal(modalType)}
/>
```

**Features:**
- ✅ Chat mit lokalem Ollama Model
- ✅ RAG Context Retrieval (Qdrant)
- ✅ Tool Calling mit Confirmation Dialog
- ✅ UI Commands (Navigate, Toast, Modal)
- ✅ Source Display (RAG Chunks)

### useAIChat Hook

```typescript
const {
  messages,
  isLoading,
  error,
  sendMessage,
  pendingToolCall,
  confirmToolCall,
  cancelToolCall,
} = useAIChat();

// Send message
await sendMessage('Zeige mir alle offenen Tasks', {
  useRAG: true,
  context: { projectId: '123' },
});

// Confirm tool call
if (pendingToolCall) {
  await confirmToolCall();
}
```

### AI Knowledge Base (Admin)

```tsx
<AIKnowledgeBase />
```

**Features:**
- Health Check (Ollama, Qdrant)
- Document Upload (.txt, .md, .pdf, .doc, .docx)
- Text Ingestion (Manual Paste)
- Source Management (List, Delete)

---

## 📊 Dashboard Components

### Kanban Board

```tsx
import { ProfessionalKanbanBoard } from '@/components/dashboard/Kanban/ProfessionalKanbanBoard';

<ProfessionalKanbanBoard
  columns={['todo', 'in_progress', 'review', 'done']}
  onTaskClick={handleTaskClick}
  onTaskMove={handleTaskMove}
/>
```

**Wichtig:**
- Columns: `flex-1 min-w-0` für gleiche Breite
- Container: `overflow-hidden` (kein horizontales Scrollen)
- Nur vertikales Scrollen in Columns

### Statistics Cards

```tsx
import { StatCard } from '@/components/dashboard/Statistics/StatCard';

<StatCard
  title="Immobilien"
  value={125}
  change={+12}
  icon={Home}
  color="blue"
/>
```

---

## 🗺️ Google Maps Integration

```tsx
import { GoogleMap, Marker } from '@react-google-maps/api';

const { isLoaded } = useLoadScript({
  googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
});

if (!isLoaded) return <div>Loading maps...</div>;

<GoogleMap
  zoom={13}
  center={{ lat: 52.52, lng: 13.405 }}
  mapContainerClassName="w-full h-96"
>
  <Marker position={{ lat: 52.52, lng: 13.405 }} />
</GoogleMap>
```

---

## 🔐 Authentication

### AuthContext

```tsx
import { useAuth } from '@/contexts/AuthContext';

const { user, login, logout, isAuthenticated } = useAuth();

// Login
await login({ email: 'user@example.com', password: 'pass' });

// Logout
logout();
```

### Protected Routes

```tsx
import { ProtectedRoute } from '@/components/common/ProtectedRoute';

<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

---

## 📝 Forms mit React Hook Form

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(1, 'Titel erforderlich'),
  price: z.number().positive('Preis muss positiv sein'),
});

type FormData = z.infer<typeof schema>;

const PropertyForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const createMutation = useCreateProperty();

  const onSubmit = async (data: FormData) => {
    await createMutation.mutateAsync(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('title')} />
      {errors.title && <span>{errors.title.message}</span>}

      <input type="number" {...register('price', { valueAsNumber: true })} />
      {errors.price && <span>{errors.price.message}</span>}

      <button type="submit" disabled={isSubmitting}>
        Speichern
      </button>
    </form>
  );
};
```

---

## 🧪 Testing

### Unit Tests (Jest + React Testing Library)

```bash
npm test
```

### Test Example

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PropertyCard } from './PropertyCard';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

test('renders property card', async () => {
  const queryClient = createTestQueryClient();
  const property = {
    id: '1',
    title: 'Test Property',
    address: '123 Main St',
  };

  render(
    <QueryClientProvider client={queryClient}>
      <PropertyCard property={property} />
    </QueryClientProvider>
  );

  expect(screen.getByText('Test Property')).toBeInTheDocument();
  expect(screen.getByText('123 Main St')).toBeInTheDocument();
});
```

---

## 🐳 Docker Deployment

### Dockerfile

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Build & Run

```bash
# Build Image
docker build -f deployment/Dockerfile.frontend -t immonow-frontend .

# Run Container
docker run -d -p 3000:80 immonow-frontend
```

---

## 🔧 Troubleshooting

### Häufige Probleme

#### 1. Node-Modul-Fehler (Windows)

**Error:** `NODE_OPTIONS is not recognized`

**Lösung:** Verwende `start-app.bat`:
```bash
start-app.bat
```

#### 2. Proxy-Fehler (Backend nicht erreichbar)

**Error:** `Proxy error: Could not proxy request`

**Lösung:** Backend muss auf Port 8000 laufen:
```bash
cd backend
uvicorn app.main:app --reload
```

#### 3. TypeScript Errors

```bash
# Clear Cache
rm -rf node_modules
npm install

# Check tsconfig.json
```

#### 4. TanStack Query Devtools

Development-Modus zeigt Devtools automatisch:
```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

---

## 📊 Performance Optimization

### Code Splitting

```tsx
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));

<Suspense fallback={<LoadingSpinner />}>
  <Dashboard />
</Suspense>
```

### Image Optimization

```tsx
// Lazy Load Images
import { LazyLoadImage } from 'react-lazy-load-image-component';

<LazyLoadImage
  src={property.image}
  alt={property.title}
  effect="blur"
/>
```

### Bundle Analyzer

```bash
npm install --save-dev webpack-bundle-analyzer
npm run build
npx webpack-bundle-analyzer build/stats.json
```

---

## 🚀 Production Checklist

- [ ] Environment Variables für Production gesetzt
- [ ] API Base URL auf Production Backend
- [ ] Source Maps deaktiviert (`GENERATE_SOURCEMAP=false`)
- [ ] Analytics integriert (Google Analytics, etc.)
- [ ] Error Tracking (Sentry)
- [ ] PWA Features aktiviert (Service Worker)
- [ ] SEO Meta Tags konfiguriert
- [ ] Performance Audit (Lighthouse)
- [ ] Accessibility Audit (WAVE, axe)
- [ ] Security Headers (CSP, etc.)

---

## 📞 Support & Contributing

### Bugs Melden

GitHub Issues: [Link zum Repository]

### Contributing

1. Fork das Repository
2. Feature Branch erstellen: `git checkout -b feature/neue-funktion`
3. Commit: `git commit -m 'feat: Neue Funktion'`
4. Push: `git push origin feature/neue-funktion`
5. Pull Request erstellen

---

## 📄 Lizenz

[Deine Lizenz hier]

---

## 🎯 Roadmap

- [ ] PWA Support (Offline-Modus)
- [ ] Mobile App (React Native)
- [ ] WebSocket Real-time Updates
- [ ] Advanced Charts & Analytics
- [ ] Multi-Language Support (i18n)
- [ ] Accessibility Improvements (WCAG 2.1 Level AA)

---

## 🔗 Nützliche Links

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [React Router Docs](https://reactrouter.com/)

---

**Version:** 1.0.0  
**Letztes Update:** Dezember 2025  
**React:** 18.3.1  
**TypeScript:** 5.0+  
**Node:** 18+
