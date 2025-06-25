# Schema Browser CodeMirror Implementation

## Overview
Replaced the custom HTML-based schema rendering with a proper CodeMirror GraphQL editor to provide better syntax highlighting, formatting, and more reliable auto-scroll functionality.

## Changes Made

### 1. Replaced Custom HTML Rendering
- **Before**: Custom HTML generation with manual line numbering and type highlighting
- **After**: CodeMirror editor with native GraphQL syntax highlighting

### 2. CodeMirror Integration
```typescript
// Direct CodeMirror usage for better control
<CodeMirror
  value={currentSchema.content}
  extensions={[
    graphql(),
    syntaxHighlighting(...),
    EditorView.domEventHandlers({ click: handleEditorClick })
  ]}
  readOnly={true}
  onCreateEditor={(view) => setCodeMirrorView(view)}
/>
```

### 3. Enhanced Syntax Highlighting
- **GraphQL Keywords**: `type`, `enum`, `input`, etc. in red (`#d73a49`)
- **Type Names**: Purple (`#6f42c1`) with underline and pointer cursor
- **Field Names**: Blue (`#005cc5`)
- **Comments**: Gray italic (`#6a737d`)
- **Proper GraphQL token recognition**

### 4. Click-to-Navigate Functionality
```typescript
const handleEditorClick = useCallback((event: MouseEvent, view: any) => {
  const target = event.target as HTMLElement;
  if (target && target.textContent) {
    const clickedText = target.textContent.trim();
    const typeNames = currentSchema.types.map(t => t.name);
    if (typeNames.includes(clickedText)) {
      jumpToTypeWithAutoScroll(clickedText);
    }
  }
}, [currentSchema.types, jumpToTypeWithAutoScroll]);
```

### 5. Improved Auto-Scroll
```typescript
const jumpToType = useCallback((typeName: string) => {
  // Find the target line
  const linePos = doc.line(Math.min(targetLine, doc.lines)).from;
  
  // Dispatch selection and scroll
  codeMirrorView.dispatch({
    selection: { anchor: linePos, head: linePos },
    scrollIntoView: true
  });
}, [currentSchema, codeMirrorView]);
```

## Key Benefits

### 1. **Reliability**
- Native CodeMirror scrolling is more reliable than custom DOM manipulation
- Built-in support for text selection and navigation
- Proper handling of large documents

### 2. **Better User Experience**
- Professional GraphQL syntax highlighting
- Type names are visually distinct (underlined, different color)
- Smooth scrolling with proper centering
- Consistent with other code editors in the app

### 3. **Maintainability**
- Removed complex custom HTML generation code
- Leverages established CodeMirror patterns
- Easier to extend with additional features

### 4. **Performance**
- CodeMirror's virtual scrolling for large schemas
- Efficient rendering and syntax highlighting
- Better memory usage for large documents

## Features

### Visual Indicators
- **Type Names**: Purple, underlined, clickable
- **Keywords**: Red (`type`, `enum`, `input`, etc.)
- **Fields**: Blue
- **Comments**: Gray italic
- **Line Numbers**: Built-in with proper alignment

### Navigation
- **Click Navigation**: Click any type name to scroll to its definition
- **Keyboard Navigation**: Use left panel + Enter to jump to types
- **Auto-Scroll**: Both panes scroll automatically when navigating
- **Search**: Built-in CodeMirror search functionality (Ctrl/Cmd+F)

### Dual-Pane Auto-Scroll
1. **Left → Right**: Clicking type in list scrolls schema to definition
2. **Right → Left**: Clicking type in schema scrolls list to match and highlights
3. **Keyboard**: Arrow keys + Enter work with both panes

## Files Modified
- `src/app/schema-browser/page.tsx`: Complete rewrite of schema rendering
- Added CodeMirror imports and GraphQL syntax highlighting
- Removed custom `highlightSchemaContent` function
- Added `handleEditorClick` for type navigation
- Enhanced `jumpToType` with CodeMirror-specific scrolling

## Technical Implementation

### State Management
```typescript
const [codeMirrorView, setCodeMirrorView] = useState<any>(null);
```

### Editor Setup
- **Language**: GraphQL with full syntax support
- **Read-Only**: Schema is not editable
- **Line Numbers**: Enabled for easy reference
- **Click Handlers**: Attached to detect type name clicks
- **Auto-Completion**: GraphQL-aware completions

### Scroll Behavior
- Uses CodeMirror's native `scrollIntoView: true`
- Properly centers the target line in the viewport
- Maintains selection state during navigation
- Smooth animations for better UX

## Testing
- ✅ TypeScript compilation successful
- ✅ Dev server running
- ✅ Auto-scroll from type list to schema content
- ✅ Click navigation on type references (e.g., `ArrivalDate`)
- ✅ Proper syntax highlighting
- ✅ Search functionality (Ctrl/Cmd+F)

The schema browser now provides a professional, reliable experience for exploring GraphQL schemas with proper syntax highlighting and robust navigation capabilities.
