# Hybrid Styling Guide: Material-UI + Tailwind CSS

This guide establishes the recommended patterns for combining Material-UI and Tailwind CSS in our Next.js application, based on real-world usage patterns from our codebase.

## 🎯 When to Use Each Approach

### Use **Pure Tailwind CSS** for:
- **Simple content pages** (homepage, about, documentation)
- **Basic forms** with standard inputs
- **Data display pages** (lists, cards, simple tables)
- **Landing pages** and marketing content
- **Static layouts** with minimal interaction

### Use **Pure Material-UI** for:
- **Complex form-heavy pages** (multi-step forms, validation-heavy forms)
- **Admin interfaces** with rich data manipulation
- **Pages requiring consistent MUI theming** throughout

### Use **Hybrid Approach** for:
- **Developer tools** and testing interfaces
- **Dashboard pages** with mixed content and interactions
- **Pages with simple layout but complex interactive components**
- **API explorers**, data browsers, and debugging tools

---

## 🏗️ Hybrid Architecture Pattern

### Core Principle: **Tailwind for Structure, MUI for Interaction**

```tsx
// ✅ RECOMMENDED HYBRID PATTERN
<div className="min-h-screen bg-gray-50"> {/* Tailwind: Layout & Background */}
  <div className="max-w-6xl mx-auto p-6 space-y-6"> {/* Tailwind: Container & Spacing */}
    
    {/* Tailwind: Page Header */}
    <div className="flex items-center gap-3">
      <span className="text-2xl">🚀</span>
      <h1 className="text-2xl font-bold text-gray-900">Page Title</h1>
      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
        Status Badge
      </span>
    </div>

    {/* Tailwind: Content Sections */}
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Section Title</h2>
      
      {/* MUI: Complex Interactive Components */}
      <FormControl fullWidth margin="normal">
        <InputLabel>Environment</InputLabel>
        <Select value={environment} onChange={handleChange}>
          <MenuItem value="dev">Development</MenuItem>
          <MenuItem value="prod">Production</MenuItem>
        </Select>
      </FormControl>

      <Dialog open={isDialogOpen} onClose={handleClose}>
        <DialogTitle>Advanced Settings</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Configuration" multiline rows={4} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>
    </div>
  </div>
</div>
```

---

## 📋 Component Usage Matrix

| Component Type | Tailwind | Material-UI | When to Use |
|----------------|----------|-------------|-------------|
| **Layout** | ✅ Primary | ❌ Avoid | `min-h-screen`, `max-w-*`, `mx-auto`, `p-*`, `space-y-*` |
| **Typography** | ✅ Primary | ⚠️ Sparingly | Use Tailwind for most text. MUI `Typography` for complex hierarchies |
| **Buttons (Simple)** | ✅ Primary | ❌ Avoid | Basic actions: `bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded` |
| **Buttons (Complex)** | ❌ Avoid | ✅ Primary | With icons, loading states, variants: `<Button variant="contained">` |
| **Forms (Basic)** | ✅ Primary | ❌ Avoid | Simple inputs: `border border-gray-300 rounded-md px-3 py-2` |
| **Forms (Advanced)** | ❌ Avoid | ✅ Primary | Validation, autocomplete, date pickers: `<TextField>`, `<Autocomplete>` |
| **Cards** | ✅ Primary | ❌ Avoid | Content containers: `bg-white border border-gray-200 rounded-lg p-6` |
| **Modals/Dialogs** | ❌ Avoid | ✅ Primary | Always use MUI: `<Dialog>`, `<DialogTitle>`, etc. |
| **Navigation** | ✅ Primary | ⚠️ Mixed | Simple nav with Tailwind, complex nav with MUI `<Tabs>` |
| **Data Display** | ✅ Primary | ⚠️ Mixed | Lists with Tailwind, complex tables with MUI |
| **Feedback** | ⚠️ Mixed | ✅ Primary | Toasts, alerts, progress: MUI components preferred |

---

## 🎨 Design Token Consistency

### Color Palette (Shared Between Systems)

```tsx
// Tailwind Classes ↔ MUI Theme Equivalents
const colorMapping = {
  // Primary Colors
  'bg-blue-600': 'bgcolor: primary.main',
  'text-blue-600': 'color: primary.main',
  'border-blue-300': 'borderColor: primary.light',
  
  // Gray Scale  
  'bg-gray-50': 'bgcolor: grey[50]',
  'bg-gray-100': 'bgcolor: grey[100]',
  'text-gray-600': 'color: grey[600]',
  'text-gray-900': 'color: grey[900]',
  
  // Status Colors
  'bg-green-100': 'bgcolor: success.light',
  'bg-red-100': 'bgcolor: error.light',
  'bg-orange-100': 'bgcolor: warning.light',
};
```

### Spacing System

```tsx
// Use consistent spacing between Tailwind and MUI
const spacing = {
  'p-2': 'p: 1',      // 8px
  'p-4': 'p: 2',      // 16px  
  'p-6': 'p: 3',      // 24px
  'gap-4': 'gap: 2',  // 16px
  'space-y-6': 'spacing between elements: 24px'
};
```

---

## 📝 Code Examples by Page Type

### 1. **Simple Data Display Page** (Pure Tailwind)

```tsx
'use client';

export default function SimpleDisplayPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-2xl">📊</span>
        <h1 className="text-2xl font-bold">Data Display</h1>
      </div>

      {/* Content Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Metric 1</h3>
          <div className="text-2xl font-bold text-blue-600">1,234</div>
          <div className="text-sm text-gray-500">+5% from last month</div>
        </div>
      </div>

      {/* Simple Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Search</h2>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Enter search term"
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Search
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 2. **Complex Interactive Page** (Hybrid)

```tsx
'use client';

import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Select, MenuItem, FormControl, InputLabel,
  Tabs, Tab, Box, Snackbar, Alert
} from '@mui/material';

export default function HybridInteractivePage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50"> {/* Tailwind: Layout */}
      <div className="max-w-6xl mx-auto p-6 space-y-6"> {/* Tailwind: Container */}
        
        {/* Tailwind: Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🛠️</span>
            <h1 className="text-2xl font-bold">Interactive Tool</h1>
          </div>
          <Button variant="contained" onClick={() => setDialogOpen(true)}>
            Open Settings
          </Button>
        </div>

        {/* Tailwind: Main Content Area */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          
          {/* MUI: Complex Navigation */}
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label="Configuration" />
            <Tab label="Results" />
            <Tab label="History" />
          </Tabs>

          {/* Tailwind: Tab Content Container */}
          <div className="p-6">
            {tabValue === 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Configuration</h3>
                
                {/* MUI: Advanced Form Controls */}
                <FormControl fullWidth>
                  <InputLabel>Environment</InputLabel>
                  <Select defaultValue="dev">
                    <MenuItem value="dev">Development</MenuItem>
                    <MenuItem value="stage">Staging</MenuItem>
                    <MenuItem value="prod">Production</MenuItem>
                  </Select>
                </FormControl>
              </div>
            )}
          </div>
        </div>

        {/* MUI: Complex Modal */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Advanced Settings</DialogTitle>
          <DialogContent>
            <div className="space-y-4 pt-4"> {/* Tailwind: Internal spacing */}
              <TextField fullWidth label="API Endpoint" />
              <TextField fullWidth label="Timeout (seconds)" type="number" />
              <TextField fullWidth label="Description" multiline rows={3} />
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={() => {
              setDialogOpen(false);
              setSnackbarOpen(true);
            }}>
              Save Settings
            </Button>
          </DialogActions>
        </Dialog>

        {/* MUI: Feedback */}
        <Snackbar 
          open={snackbarOpen} 
          autoHideDuration={3000} 
          onClose={() => setSnackbarOpen(false)}
        >
          <Alert severity="success">Settings saved successfully!</Alert>
        </Snackbar>
      </div>
    </div>
  );
}
```

---

## ⚠️ Common Pitfalls to Avoid

### ❌ DON'T: Mix styling approaches on the same element
```tsx
// BAD: Conflicting styles
<Button 
  variant="contained" 
  className="bg-red-500 p-8"  // Conflicts with MUI styling
>
  Save
</Button>
```

### ❌ DON'T: Override MUI components heavily with Tailwind
```tsx
// BAD: Fighting the component library
<TextField 
  className="border-4 border-red-500 rounded-xl bg-yellow-100" // Don't do this
/>
```

### ❌ DON'T: Use inconsistent color systems
```tsx
// BAD: Mixed color systems
<div className="bg-blue-600">
  <Button sx={{ bgcolor: 'green' }}>Save</Button> {/* Different color system */}
</div>
```

### ✅ DO: Use complementary approaches
```tsx
// GOOD: Clean separation
<div className="bg-gray-50 p-6"> {/* Tailwind for layout */}
  <Button variant="contained" color="primary"> {/* MUI for interaction */}
    Save Changes
  </Button>
</div>
```

---

## 🚀 Implementation Checklist

When creating a new page, ask:

- [ ] **Layout Complexity**: Simple grid/flex layout? → Use Tailwind
- [ ] **Form Complexity**: Basic inputs only? → Use Tailwind  
- [ ] **Interactive Elements**: Need dialogs, advanced controls? → Use MUI
- [ ] **Data Display**: Simple lists/cards? → Use Tailwind
- [ ] **Feedback**: Need toasts, progress indicators? → Use MUI
- [ ] **Navigation**: Simple links? → Tailwind. Tabs/complex? → MUI

### Quick Decision Tree:
```
Is this page primarily for data display or simple forms?
├─ Yes → Start with Pure Tailwind
└─ No → Does it need complex interactions?
   ├─ Yes → Use Hybrid (Tailwind layout + MUI components)
   └─ No → Consider Pure Material-UI if it's form-heavy
```

---

## 📚 Reference Examples in Codebase

- **Pure Tailwind**: `/mogs-curriculum/page.tsx`, `/district/page.tsx`
- **Pure Material-UI**: `/assignment-location/page.tsx`, `/active-assignment/page.tsx`  
- **Hybrid**: `/api-testing/page.tsx`

---

*This guide will evolve as we discover new patterns. Update it when you find better approaches!*
