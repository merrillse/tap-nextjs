# GraphQL Schema Documentation

This directory contains the GraphQL schema definitions for the services used by this application.

## Schema Files

### `mogs-schema.txt`
- **Service**: Missionary Oracle Graph Service (MOGS)
- **Description**: Combined GraphQL schema for the MOGS service, including all type definitions for missionary management, assignments, and organizational data
- **Generated**: June 19, 2025
- **Source**: `/Users/merrillse/projects/missionary-graph/missionary-oracle-graph-service/src/main/resources/graphql/`

### `mis-schema.txt`
- **Service**: Missionary Information System (MIS) GraphQL API
- **Description**: GraphQL schema for the MIS service, providing access to missionary data and organizational information
- **Generated**: [Date to be updated]
- **Source**: MIS GraphQL service endpoints

## Usage

These schema files are used for:

1. **Development Reference**: Understanding available queries, mutations, and types
2. **Type Generation**: Creating TypeScript interfaces that match the GraphQL schema
3. **API Testing**: Validating queries against the actual schema structure
4. **Documentation**: Providing developers with comprehensive API documentation

## Integration

The application automatically validates GraphQL queries against these schemas during development. The schema browser and GraphQL testing tools in the application use these definitions to provide:

- Auto-completion for query building
- Field validation and error checking
- Interactive schema exploration
- Type-safe query construction

## Maintenance

These schema files should be updated whenever the underlying GraphQL services are modified to ensure the application remains in sync with the latest API definitions.
