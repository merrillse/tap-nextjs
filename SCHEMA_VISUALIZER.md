# GraphQL Schema Visualizer

## Overview

The GraphQL Schema Visualizer is an interactive graph-based tool that provides a visual representation of GraphQL schemas, similar to GraphQL Voyager. It helps developers understand complex GraphQL schemas by showing types, relationships, and structure in an intuitive visual format.

## Features

### 🎯 Core Functionality
- **Interactive Graph Visualization**: Visual representation of GraphQL schema with nodes and edges
- **Multiple View Modes**: Filter by Queries, Mutations, Types, Scalars, Enums, Interfaces, Unions, and Inputs
- **Relationship Mapping**: Shows connections between types through fields, interfaces, unions, and more
- **Real-time Schema Loading**: Connects to any GraphQL endpoint to load and visualize live schemas

### 🎨 Visual Elements
- **Color-coded Node Types**:
  - 🟢 **Queries** (Green): Root query operations
  - 🟠 **Mutations** (Orange): Root mutation operations  
  - 🔵 **Types** (Blue): Object types
  - ⚫ **Scalars** (Gray): Scalar types
  - 🟣 **Enums** (Purple): Enumeration types
  - 🟡 **Interfaces** (Yellow): Interface types
  - 🩷 **Unions** (Pink): Union types
  - 🔷 **Inputs** (Teal): Input object types

### 🔍 Interactive Features
- **Expandable Nodes**: Click on Query/Mutation/Type nodes to see field details
- **Search & Filter**: Real-time search across type names and descriptions
- **Node Selection**: Click nodes to view detailed information in the settings panel
- **Zoom & Pan**: Full control over graph navigation
- **Relationship Edges**: Visual connections showing field relationships

### ⚙️ Configuration Options
- **Environment Selection**: Dev, Staging, Production
- **Proxy Client Selection**: Choose from available OAuth clients
- **Layout Settings**: Top-to-bottom or left-to-right layout
- **Deprecated Fields**: Toggle visibility of deprecated schema elements

## Usage

### Getting Started
1. **Select Environment**: Choose Dev, Staging, or Production from the dropdown
2. **Select Proxy Client**: Pick the appropriate OAuth client for your use case
3. **Load Schema**: Click "Load Schema" to fetch and visualize the GraphQL schema
4. **Explore**: Use tabs to filter by type, search for specific elements, or click nodes for details

### Navigation Tips
- **Zoom**: Use mouse wheel or zoom controls
- **Pan**: Click and drag to move around the graph
- **Fit View**: Use the fit-to-view control to see the entire graph
- **Search**: Type in the search box to filter visible nodes
- **Node Details**: Click any node to see detailed information in the settings drawer

### Tab Filtering
- **All**: Shows complete schema overview
- **Queries**: Focus on available query operations
- **Mutations**: Focus on available mutation operations  
- **Types**: Show object types (excluding Query/Mutation roots)
- **Scalars**: Custom scalar types (excludes built-in String, Int, etc.)
- **Enums**: Enumeration types
- **Interfaces**: Interface definitions
- **Unions**: Union type definitions
- **Inputs**: Input object types

## Technical Details

### Dependencies
- **React Flow**: Powers the interactive graph visualization
- **Material-UI**: Provides the user interface components
- **GraphQL Introspection**: Uses standard GraphQL introspection queries

### Performance
- **Efficient Rendering**: Only renders visible nodes and connections
- **Lazy Loading**: Schema loaded on-demand when requested
- **Smart Filtering**: Real-time filtering without re-rendering entire graph

### Integration
- **API Client**: Uses existing TAP API client for authentication and requests
- **Environment Support**: Full support for Dev/Stage/Prod environments
- **OAuth Integration**: Seamless integration with existing proxy client system

## Comparison to GraphQL Voyager

This implementation provides similar functionality to GraphQL Voyager with some key advantages:

✅ **Integrated Authentication**: Works seamlessly with existing OAuth proxy clients  
✅ **Environment Switching**: Easy switching between Dev/Stage/Prod  
✅ **Custom Styling**: Matches TAP platform design system  
✅ **Enhanced Filtering**: More granular filtering options  
✅ **Real-time Search**: Dynamic search and filtering  
✅ **Expandable Nodes**: Inline field details without navigation  

## Future Enhancements

Potential improvements that could be added:

- 🔄 **Auto Layout Algorithms**: Hierarchical and force-directed layouts
- 📊 **Schema Statistics**: Type count, complexity metrics, etc.
- 🔗 **Deep Linking**: Share specific schema views via URL
- 📱 **Export Options**: PNG/SVG export of graph visualizations
- 🎯 **Focus Mode**: Highlight paths between selected types
- 📋 **Schema Comparison**: Side-by-side comparison of different schema versions
- 🔍 **Advanced Search**: Search by field types, arguments, directives
- 📝 **Documentation Integration**: Show documentation alongside visual elements

## Benefits

The Schema Visualizer provides significant value for:

- **Schema Understanding**: Quickly grasp complex GraphQL schema structures
- **API Documentation**: Visual documentation for API consumers
- **Development Planning**: See type relationships before building queries
- **Schema Validation**: Identify missing connections or unused types
- **Team Collaboration**: Share visual schema understanding across teams
- **Debugging**: Visualize data flow and relationships for troubleshooting
