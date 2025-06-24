# Schema Browser Auto-Scroll Enhancement

## Overview
Added comprehensive auto-scroll functionality to the GraphQL Schema Browser to improve navigation between the type list (left pane) and schema content (right pane).

## ✨ New Features

### 1. **Type List Auto-Scroll**
When a type is selected (via click, keyboard navigation, or type reference click), the left pane automatically scrolls to show the selected type centered in the viewport.

### 2. **Bidirectional Navigation**
- **Left → Right**: Clicking a type in the type list scrolls to that type's definition in the schema content
- **Right → Left**: Clicking an underlined type reference in the schema content scrolls to that type in the type list

### 3. **Enhanced Keyboard Navigation**
- Arrow keys (↑/↓) and J/K keys now automatically scroll the type list to keep the selected type visible
- Enter key jumps to the selected type with auto-scroll in both panes

## 🔧 Implementation Details

### New Functions Added

#### `scrollToTypeInList(typeName: string)`
```typescript
const scrollToTypeInList = useCallback((typeName: string) => {
  if (typeListRef.current) {
    const typeElement = typeListRef.current.querySelector(`[data-type-name="${typeName}"]`) as HTMLElement;
    if (typeElement) {
      const container = typeListRef.current;
      const containerRect = container.getBoundingClientRect();
      const elementRect = typeElement.getBoundingClientRect();
      
      // Calculate scroll position to center the element
      const scrollTop = container.scrollTop + elementRect.top - containerRect.top - (containerRect.height / 2) + (elementRect.height / 2);
      
      container.scrollTo({
        top: Math.max(0, scrollTop),
        behavior: 'smooth'
      });
    }
  }
}, []);
```

#### `jumpToTypeWithAutoScroll(typeName: string)`
```typescript
const jumpToTypeWithAutoScroll = useCallback((typeName: string) => {
  jumpToType(typeName);           // Scroll schema content to type definition
  scrollToTypeInList(typeName);   // Scroll type list to selected type
}, [jumpToType, scrollToTypeInList]);
```

### Enhanced Elements

#### Type List Items
- Added `data-type-name` attributes for precise targeting
- Updated click handlers to use `jumpToTypeWithAutoScroll`

#### Schema Content Type References
- Existing underlined type references now trigger auto-scroll in both panes
- Updated click handlers to use `jumpToTypeWithAutoScroll`

#### Keyboard Navigation
- Auto-scroll triggers when using J/K navigation
- Enter key uses enhanced jump function

### Auto-Scroll Behavior

#### Selection Triggered Auto-Scroll
```typescript
useEffect(() => {
  if (selectedType) {
    scrollToTypeInList(selectedType);
  }
}, [selectedType, scrollToTypeInList]);
```

## 🎯 User Experience Improvements

### Before
- Clicking a type in the left pane only showed it in the right pane
- Clicking type references in schema content didn't scroll the type list
- Keyboard navigation could select types outside the visible area

### After
- **Seamless Navigation**: All interactions maintain visual context in both panes
- **Centered Positioning**: Selected types are centered in the type list viewport
- **Smooth Animations**: All scrolling uses smooth behavior for better UX
- **Keyboard Friendly**: Arrow key navigation keeps selection visible

## 🔍 Technical Features

- **Precise Calculations**: Scroll positioning accounts for container dimensions and element positioning
- **Smooth Scrolling**: Uses native `scrollTo()` with `behavior: 'smooth'`
- **Error Prevention**: Scroll calculations include bounds checking
- **Performance Optimized**: Functions are memoized with `useCallback`
- **Accessibility**: Maintains focus and keyboard navigation support

## 🚀 Usage Examples

1. **Click a type in the left pane** → Schema content scrolls to definition, type stays visible in list
2. **Click an underlined type in schema content** → Both panes scroll to show the clicked type
3. **Use J/K keyboard navigation** → Type list auto-scrolls to keep selection centered
4. **Use search then arrow keys** → Filtered results stay visible during navigation

The schema browser now provides a fluid, intuitive navigation experience that maintains context across both panes, making it much easier to explore complex GraphQL schemas.
