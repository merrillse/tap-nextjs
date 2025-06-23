# Material UI Pattern Reference

**⚠️ This document is deprecated. Please refer to [HYBRID_STYLING_GUIDE.md](./HYBRID_STYLING_GUIDE.md) for the comprehensive styling guide.**

## Quick Reference

This project uses a **dual styling architecture**:
- **Material-UI**: For complex form-heavy pages (assignment-location, active-assignment)
- **Tailwind CSS**: For simple data display pages (mogs-curriculum, district, homepage)
- **Hybrid approach**: For developer tools and complex interactive pages (api-testing)

## Migration Path

When refactoring existing pages:

1. **Check [HYBRID_STYLING_GUIDE.md](./HYBRID_STYLING_GUIDE.md)** for the decision tree
2. **Follow the implementation patterns** provided in the guide
3. **Use the component usage matrix** to determine Tailwind vs MUI for each element
4. **Reference the code examples** for your specific page type

## Existing Page Examples

- **Pure Tailwind**: `/mogs-curriculum/page.tsx`, `/district/page.tsx`
- **Pure Material-UI**: `/assignment-location/page.tsx`, `/active-assignment/page.tsx`  
- **Hybrid**: `/api-testing/page.tsx`

## 📁 Page Structure Template

```typescript
'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  TextField, 
  Alert, 
  CircularProgress, 
  Chip, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem 
} from '@mui/material';
import { 
  Search, 
  Clear, 
  History, 
  [PageSpecificIcon] 
} from '@mui/icons-material';
import { ApiClient } from '@/lib/api-client';
import { ENVIRONMENTS, getEnvironmentKeysByService } from '@/lib/environments';

// TypeScript interfaces for your data structures
interface YourDataType {
  // Define your data structure
}

interface SearchHistory {
  id: string;
  searchedAt: string;
}

const SEARCH_HISTORY_KEY = 'your-page-search-history';
const MAX_HISTORY_ITEMS = 10;

export default function YourPage() {
  // State management following the established pattern
  const [searchInput, setSearchInput] = useState('');
  const [data, setData] = useState<YourDataType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  const [selectedEnvironment, setSelectedEnvironment] = useState('mis-gql-dev');
  const [apiClient, setApiClient] = useState<ApiClient | null>(null);

  // Get only MGQL/MIS environments (no MOGS)
  const mgqlEnvironments = Object.entries(ENVIRONMENTS).filter(([key]) => 
    key.startsWith('mis-gql-')
  );

  // Standard useEffect hooks for environment and history management
  // ... (copy from existing pages)

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', p: 3 }}>
      <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
        {/* Header Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
            <YourPageIcon color="primary" />
            Your Page Title
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Description of what this page does
          </Typography>
        </Box>

        {/* Environment Selection */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <FormControl fullWidth>
              <InputLabel>Environment</InputLabel>
              <Select
                value={selectedEnvironment}
                label="Environment"
                onChange={(e) => setSelectedEnvironment(e.target.value)}
              >
                {mgqlEnvironments.map(([key, env]) => (
                  <MenuItem key={key} value={key}>
                    {env.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </CardContent>
        </Card>

        {/* Search Form */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
              <TextField
                fullWidth
                label="Search Input Label"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Enter search criteria"
                required
                variant="outlined"
              />
              <Button
                type="submit"
                variant="contained"
                disabled={loading || !searchInput.trim()}
                startIcon={loading ? <CircularProgress size={20} /> : <Search />}
                sx={{ minWidth: 120 }}
              >
                {loading ? 'Searching...' : 'Search'}
              </Button>
              <Button
                variant="outlined"
                onClick={handleClear}
                startIcon={<Clear />}
                disabled={loading}
              >
                Clear
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Search History */}
        {searchHistory.length > 0 && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <History color="action" />
                  Recent Searches
                </Typography>
                <Button
                  onClick={clearSearchHistory}
                  color="error"
                  size="small"
                  startIcon={<Clear />}
                >
                  Clear History
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {searchHistory.map((item, index) => (
                  <Chip
                    key={index}
                    label={`${item.id}`}
                    onClick={() => useHistorySearch(item)}
                    onDelete={() => removeFromHistory(item.id)}
                    variant="outlined"
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <strong>Search Error:</strong> {error}
          </Alert>
        )}

        {/* Results Section */}
        {data && (
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ bgcolor: 'primary.50', borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h5" color="primary.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <YourPageIcon />
                Results Title
              </Typography>
              <Typography color="primary.dark">ID: {data.id}</Typography>
            </CardContent>

            <CardContent sx={{ p: 3 }}>
              {/* Data sections organized with clear headers and color coding */}
            </CardContent>
          </Card>
        )}

        {/* Help Section */}
        <Card sx={{ bgcolor: 'info.50', border: 1, borderColor: 'info.200' }}>
          <CardContent>
            <Typography variant="h6" color="info.main" gutterBottom>
              💡 How to Use This Page
            </Typography>
            <Box sx={{ '& > *': { mb: 1 } }}>
              <Typography variant="body2" color="info.dark">
                • Instruction 1
              </Typography>
              <Typography variant="body2" color="info.dark">
                • Instruction 2
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
```

## 🎨 Color Coding System

Use Material-UI's color system consistently across pages:

- **Primary (Blue)**: Main page elements, search buttons, primary data
- **Success (Green)**: Positive states, found results, active statuses
- **Error (Red)**: Error states, not found results, inactive statuses
- **Warning (Orange)**: Warning states, dates, temporal information
- **Info (Light Blue)**: Help sections, informational content
- **Secondary (Purple)**: Secondary data, training information, companions
- **Grey**: Neutral information, system IDs, less important data

## 📱 Component Usage Patterns

### Cards
```typescript
// Main content cards
<Card sx={{ mb: 3 }}>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>

// Colored info cards
<Card sx={{ bgcolor: 'primary.50', p: 2 }}>
  <Typography variant="caption" color="primary.main">Label:</Typography>
  <Typography variant="body2" fontWeight="medium" color="primary.dark">
    Value
  </Typography>
</Card>
```

### Typography
```typescript
// Page title
<Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
  <Icon color="primary" />
  Page Title
</Typography>

// Section headers
<Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
  <Icon color="primary" />
  Section Title
</Typography>

// Labels and values
<Typography variant="caption" color="text.secondary">Field Label:</Typography>
<Typography variant="body2" fontWeight="medium">Field Value</Typography>
```

### Grid Layouts
```typescript
// Responsive grid
<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 2 }}>
  {/* Grid items */}
</Box>
```

### Chips for Tags/Status
```typescript
<Chip
  label="Status Text"
  color="success" // or primary, error, warning, etc.
  variant="outlined"
  size="small"
/>
```

## 🔧 Required Functions

Every search page should implement these standard functions:

```typescript
// Search handling
const handleSearch = (e: React.FormEvent) => {
  e.preventDefault();
  performSearch();
};

// Clear form
const handleClear = () => {
  setSearchInput('');
  setData(null);
  setError(null);
};

// History management
const addToHistory = (id: string) => { /* ... */ };
const removeFromHistory = (id: string) => { /* ... */ };
const clearHistory = () => { /* ... */ };
const useHistorySearch = (historyItem: SearchHistory) => { /* ... */ };

// Date formatting
const formatDate = (dateString: string) => { /* ... */ };
```

## 📊 Data Display Patterns

1. **Primary Information**: Use `primary.50` background with `primary.main` labels
2. **Secondary Details**: Use `grey.50` background with standard text colors  
3. **Status Information**: Use appropriate color (success, error, warning) with matching backgrounds
4. **Lists/Arrays**: Use Chips for tags, or grid layouts for detailed items
5. **Hierarchical Data**: Use nested Cards with proper spacing and color differentiation

## ✅ Checklist for New Pages

- [ ] Uses Material-UI components exclusively (no Tailwind CSS classes)
- [ ] Implements consistent color coding system
- [ ] Includes environment selection dropdown (MGQL/MIS only)
- [ ] Has proper search form with loading states
- [ ] Implements search history with local storage
- [ ] Shows clear error messages using Alert component
- [ ] Uses responsive grid layouts
- [ ] Includes help section with usage instructions
- [ ] Has proper TypeScript interfaces
- [ ] Follows the established naming conventions
- [ ] Includes proper icons from Material-UI icon set
- [ ] Has consistent spacing and typography scales

## 🎯 Examples

Reference these pages as examples of the established Material-UI pattern for MIS/MGQL pages:
- `/assignment-location` - Complex nested data with grouping
- `/active-assignment` - Multiple data sections with different content types
- `/mission` - Clean implementation of the base pattern

**Note**: The `/district` page now uses Tailwind CSS to match the project's architecture where MIS/MGQL pages can use either Material-UI or Tailwind depending on their specific needs.

For MOGS pages, refer to existing Tailwind CSS implementations like `/mogs-curriculum` and `/mogs-ws-missionary`.

This pattern ensures all MIS/MGQL pages have a consistent look, feel, and behavior while maintaining the flexibility to display different types of data appropriately.
