# DataDisplaySection Component

A reusable, flexible component for displaying collections of data in three different view modes: **Cards**, **List**, and **Carousel**.

## Features

- 🎨 **Three View Modes**: Cards (grid), List (detailed), and Carousel (coverflow)
- 🔧 **Fully Customizable**: Field mappings, actions, and custom renderers
- 🎯 **Type-Safe**: Full TypeScript support with generics
- 📱 **Responsive**: Adapts to different screen sizes
- ⚡ **Animation Support**: Optional staggered animations
- 🎭 **Flexible Rendering**: Custom content renderers for each mode

## Installation

The component is located at `src/components/ui/DataDisplaySection.tsx`

## Basic Usage

```tsx
import DataDisplaySection from "@/components/ui/DataDisplaySection";

const MyComponent = () => {
  const data = [
    { code: '1', title: 'Item 1', description: 'Description 1', image: '/img1.jpg' },
    { code: '2', title: 'Item 2', description: 'Description 2', image: '/img2.jpg' },
  ];

  return (
    <DataDisplaySection
      data={data}
      fieldMapping={{
        code: 'code',
        title: 'title',
        description: 'description',
        image: 'image',
      }}
      defaultViewMode="card"
      title="My Items"
      subtitle="A collection of items"
    />
  );
};
```

## Props

### Core Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `T[]` | Required | Array of items to display |
| `fieldMapping` | `FieldMapping<T>` | Required | Maps data fields to display fields |
| `defaultViewMode` | `'card' \| 'list' \| 'carousel'` | `'carousel'` | Initial view mode |
| `enabledModes` | `ViewMode[]` | `['card', 'list', 'carousel']` | Available view modes |

### Header Props

| Prop | Type | Description |
|------|------|-------------|
| `title` | `string` | Section title |
| `subtitle` | `string` | Section subtitle |
| `badge` | `string` | Badge text above title |

### Customization Props

| Prop | Type | Description |
|------|------|-------------|
| `renderCardContent` | `(item: T) => ReactNode` | Custom card renderer |
| `renderListContent` | `(item: T) => ReactNode` | Custom list renderer |
| `renderCarouselContent` | `(item: T) => ReactNode` | Custom carousel renderer |

### Carousel Settings

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `carouselHeight` | `string` | `'500px'` | Carousel container height |
| `carouselCardWidth` | `string` | `'36rem'` | Carousel card width |
| `carouselCardHeight` | `string` | `'28rem'` | Carousel card height |

### Grid Settings

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `gridCols` | `object` | `{ sm: 1, md: 2, lg: 3, xl: 4 }` | Grid columns per breakpoint |

### State Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isLoading` | `boolean` | `false` | Show loading state |
| `loadingMessage` | `string` | `'Loading...'` | Loading message |
| `emptyMessage` | `string` | `'No items to display'` | Empty state message |
| `enableAnimation` | `boolean` | `true` | Enable staggered animations |

### Callbacks

| Prop | Type | Description |
|------|------|-------------|
| `onItemClick` | `(item: T) => void` | Called when item is clicked |

### Additional Content

| Prop | Type | Description |
|------|------|-------------|
| `footer` | `ReactNode` | Content to display below items |

## Field Mapping

The `fieldMapping` prop defines how your data fields map to display fields:

```tsx
interface FieldMapping<T> {
  // Core fields (required)
  code: string | ((item: T) => string);          // Unique identifier
  title: string | ((item: T) => string);         // Main title
  description: string | ((item: T) => string);   // Description/content
  
  // Optional fields
  subtitle?: string | ((item: T) => string);     // Subtitle
  image?: string | ((item: T) => string);        // Image URL
  badge?: string | ((item: T) => string);        // Badge text
  date?: string | ((item: T) => string);         // Date/time
  
  // Actions (buttons)
  actions?: Array<{
    label: string | ((item: T) => string);
    icon?: React.ComponentType<{ className?: string }>;
    onClick: (item: T, event: React.MouseEvent) => void;
    variant?: 'default' | 'outline' | 'ghost';
  }>;
}
```

### Field Mapping Examples

**Simple string field mapping:**
```tsx
fieldMapping={{
  code: 'id',
  title: 'name',
  description: 'bio',
}}
```

**Function-based mapping:**
```tsx
fieldMapping={{
  code: 'id',
  title: (item) => `${item.firstName} ${item.lastName}`,
  subtitle: (item) => `${item.position} at ${item.company}`,
  description: (item) => item.bio || 'No description available',
  image: (item) => item.photoUrl || '/default-avatar.png',
}}
```

**With actions:**
```tsx
fieldMapping={{
  code: 'id',
  title: 'name',
  description: 'bio',
  actions: [
    {
      label: 'Contact',
      icon: Mail,
      onClick: (item) => window.open(`mailto:${item.email}`),
      variant: 'outline',
    },
    {
      label: 'View Profile',
      icon: ExternalLink,
      onClick: (item) => navigate(`/profile/${item.id}`),
      variant: 'default',
    },
  ],
}}
```

## Advanced Usage

### Custom Renderers

Override the default rendering for any view mode:

```tsx
<DataDisplaySection
  data={data}
  fieldMapping={fieldMapping}
  renderCardContent={(item) => (
    <CardContent className="p-4">
      <h3>{item.title}</h3>
      <p>{item.description}</p>
      {/* Custom content */}
    </CardContent>
  )}
/>
```

### Dynamic Actions

Create actions based on item data:

```tsx
fieldMapping={{
  code: 'id',
  title: 'name',
  description: 'bio',
  actions: data[0]?.contacts?.map(contact => ({
    label: (item) => {
      const c = item.contacts.find(ct => ct.code === contact.code);
      return c ? getContactLabel(c.code, c.value) : contact.code;
    },
    icon: getContactIcon(contact.code),
    onClick: (item) => {
      const c = item.contacts.find(ct => ct.code === contact.code);
      if (c) handleContact(c);
    },
  })) || [],
}}
```

### Custom Grid Layout

```tsx
<DataDisplaySection
  data={data}
  fieldMapping={fieldMapping}
  gridCols={{
    sm: 1,   // 1 column on mobile
    md: 2,   // 2 columns on tablet
    lg: 4,   // 4 columns on desktop
    xl: 6,   // 6 columns on large screens
  }}
/>
```

### Limited View Modes

```tsx
<DataDisplaySection
  data={data}
  fieldMapping={fieldMapping}
  enabledModes={['card', 'list']}  // No carousel
  defaultViewMode="list"
/>
```

## Examples

### References Section

```tsx
<DataDisplaySection<ReferenceWithPhoto>
  data={references}
  defaultViewMode="carousel"
  title="What Colleagues Say"
  subtitle="Professional testimonials"
  badge="References"
  fieldMapping={{
    code: 'code',
    title: 'title',
    subtitle: (ref) => `${ref.position} at ${ref.company}`,
    description: (ref) => `"${ref.testimonial}"`,
    image: 'photo',
    date: 'date',
    actions: [
      {
        label: 'Email',
        icon: Mail,
        onClick: (ref) => window.open(`mailto:${ref.email}`),
      },
    ],
  }}
/>
```

### Projects Section

```tsx
<DataDisplaySection<ProjectEntry>
  data={projects}
  defaultViewMode="card"
  title="Portfolio"
  subtitle="Featured projects"
  gridCols={{ sm: 1, md: 2, lg: 3, xl: 4 }}
  fieldMapping={{
    code: 'code',
    title: 'title',
    subtitle: (project) => project.companyCode || '',
    description: (project) => project.summary || '',
    image: (project) => project.photoUrl || '',
    badge: (project) => project.group || '',
    date: (project) => formatDatePeriod(project.datePeriod),
  }}
  onItemClick={(project) => setSelectedProject(project)}
/>
```

### Skills Section

```tsx
<DataDisplaySection<Skill>
  data={skills}
  defaultViewMode="card"
  title="Technical Skills"
  enabledModes={['card']}  // Only card view
  gridCols={{ sm: 2, md: 3, lg: 4, xl: 6 }}
  fieldMapping={{
    code: 'code',
    title: 'title',
    description: (skill) => skill.type || '',
    image: (skill) => skill.photoUrl || '',
  }}
/>
```

## Styling

The component uses Tailwind CSS and shadcn/ui components. All views are responsive and follow the design system.

### Customizing Carousel

```tsx
<DataDisplaySection
  carouselHeight="600px"
  carouselCardWidth="40rem"
  carouselCardHeight="32rem"
  // ...
/>
```

### Disabling Animations

```tsx
<DataDisplaySection
  enableAnimation={false}
  // ...
/>
```

## TypeScript

The component is fully typed with generics:

```tsx
interface MyDataType {
  id: string;
  name: string;
  description: string;
}

<DataDisplaySection<MyDataType>
  data={myData}
  fieldMapping={{
    code: 'id',
    title: 'name',
    description: 'description',
  }}
/>
```

## Migration Guide

### From Custom Section to DataDisplaySection

**Before:**
```tsx
const MySection = () => {
  const [viewMode, setViewMode] = useState('carousel');
  const [data, setData] = useState([]);
  
  // Load data...
  
  return (
    <section>
      {/* View mode toggle */}
      {/* Card view */}
      {/* List view */}
      {/* Carousel view */}
    </section>
  );
};
```

**After:**
```tsx
const MySection = () => {
  const [data, setData] = useState([]);
  
  // Load data...
  
  return (
    <DataDisplaySection
      data={data}
      defaultViewMode="carousel"
      fieldMapping={{
        code: 'id',
        title: 'name',
        description: 'bio',
      }}
      title="My Section"
    />
  );
};
```

## Best Practices

1. **Use function mappings for complex fields:**
   ```tsx
   subtitle: (item) => `${item.role} at ${item.company}`
   ```

2. **Provide fallbacks for optional fields:**
   ```tsx
   image: (item) => item.photo || '/default-avatar.png'
   ```

3. **Handle HTML content safely:**
   ```tsx
   description: (item) => sanitize(item.html)
   ```

4. **Optimize actions for carousel:**
   - Limit to 3 actions in carousel mode
   - Use `actions.slice(0, 3)` in field mapping

5. **Use custom renderers for complex layouts:**
   - When default layout doesn't fit your needs
   - For special formatting or interactive elements

## License

Part of the tursoft-hub project.
