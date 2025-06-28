# Active Assignment Page Environment Update

## Summary of Changes

The active-assignment page has been updated to show all 4 MIS/MGQL environments in the Environment dropdown, maintaining its focus on Missionary Information System data.

## Changes Made

### 1. Updated Environment Filtering Logic
- ✅ **Updated**: `misEnvironments = Object.entries(ENVIRONMENTS).filter(([key]) => key.startsWith('mis-gql-'))`
- ✅ Now captures all 4 MIS lanes: local, dev, stage, prod

### 2. Enhanced Comments
- ✅ Updated comments to reflect "4 lanes: local, dev, stage, prod"
- ✅ Clarified that this excludes MOGS environments appropriately

### 3. Maintained MIS-only Logic
- ✅ **Initialization**: Still validates `savedEnvironment.startsWith('mis-gql-')`
- ✅ **Default**: Remains `mis-gql-dev` for MIS data
- ✅ **Scope**: Only MIS environments shown (no MOGS)

## Available MIS Environments Now Shown

The dropdown now displays all 4 MIS/MGQL environments:

### MIS (MGQL) Environments - 4 Lanes
- **MIS GraphQL Local** (`mis-gql-local`) - localhost:8080
- **MIS GraphQL Development** (`mis-gql-dev`) - mis-gql-dev.aws.churchofjesuschrist.org
- **MIS GraphQL Staging** (`mis-gql-stage`) - mis-gql-stage.aws.churchofjesuschrist.org  
- **MIS GraphQL Production** (`mis-gql-prod`) - mis-gql.aws.churchofjesuschrist.org

## Benefits

1. **Appropriate Scope**: Only shows MIS environments for MIS-specific functionality
2. **Complete MIS Coverage**: All 4 MIS lanes now available (previously only dev was accessible)
3. **Consistency**: Uses the same environment structure as the main environments.ts
4. **Security**: Maintains environment-specific client secret handling

## Backward Compatibility

- ✅ Default environment remains `mis-gql-dev`
- ✅ Saved environment preferences preserved (if they're MIS environments)
- ✅ All existing MIS functionality continues to work unchanged
- ✅ Non-MIS environments in localStorage are ignored (fallback to default)

## Design Decision

**Why MIS-only?** The active-assignment page is specifically designed for querying Missionary Information System data. Including MOGS environments would be misleading since:
- Active assignments are MIS domain concepts
- MOGS environments serve different data models  
- Users expect environment options to be relevant to the page's functionality

This maintains clear separation of concerns between MIS and MOGS functionality.
