/**
 * Random GraphQL Query Generator
 * Generates valid GraphQL queries from introspected schema
 */

// GraphQL Schema Types
interface GraphQLInputField {
  name: string;
  description?: string;
  type: GraphQLFieldType;
  defaultValue?: string;
}

interface GraphQLType {
  kind: string;
  name?: string;
  description?: string;
  fields?: GraphQLField[];
  inputFields?: GraphQLInputField[];
  interfaces?: GraphQLType[];
  enumValues?: GraphQLEnumValue[];
  possibleTypes?: GraphQLType[];
}

interface GraphQLField {
  name: string;
  description?: string;
  type: GraphQLFieldType;
  args?: GraphQLArgument[];
  isDeprecated?: boolean;
  deprecationReason?: string;
}

interface GraphQLFieldType {
  kind: string;
  name?: string;
  ofType?: GraphQLFieldType;
}

interface GraphQLArgument {
  name: string;
  description?: string;
  type: GraphQLFieldType;
  defaultValue?: string;
}

interface GraphQLEnumValue {
  name: string;
  description?: string;
  isDeprecated?: boolean;
}

interface GraphQLSchema {
  queryType?: { name: string };
  mutationType?: { name: string };
  subscriptionType?: { name: string };
  types: GraphQLType[];
}

export interface IntrospectionResult {
  data: {
    __schema: GraphQLSchema;
  };
}

export class RandomQueryGenerator {
  private schema: GraphQLSchema;
  private typeMap: Map<string, GraphQLType>;
  private maxDepth: number;
  private maxFields: number;

  constructor(introspectionResult: IntrospectionResult, maxDepth = 3, maxFields = 5) {
    this.schema = introspectionResult.data.__schema;
    this.maxDepth = maxDepth;
    this.maxFields = maxFields;
    this.typeMap = new Map();
    
    // Build type map for quick lookups
    this.schema.types.forEach(type => {
      if (type.name) {
        this.typeMap.set(type.name, type);
      }
    });
  }

  /**
   * Generate a random query
   */
  generateRandomQuery(): string {
    const queryType = this.getQueryType();
    if (!queryType?.fields) {
      throw new Error('No query type found in schema');
    }

    // Filter out introspection fields and deprecated fields
    const availableFields = queryType.fields.filter(field => 
      !field.name.startsWith('__') && 
      !field.isDeprecated
    );

    if (availableFields.length === 0) {
      throw new Error('No available query fields found');
    }

    // Pick 1-3 random root fields
    const numRootFields = Math.min(Math.floor(Math.random() * 3) + 1, availableFields.length);
    const selectedFields = this.getRandomFields(availableFields, numRootFields);

    const queryName = this.generateQueryName(selectedFields);
    const variables = new Map<string, { type: string; defaultValue: string | null }>();
    const queryBody = selectedFields.map(field => 
      this.generateFieldQuery(field, 0, variables)
    ).join('\n  ');

    let query = `query ${queryName}`;
    
    // Add variables if any were collected
    if (variables.size > 0) {
      const variableDefinitions = Array.from(variables.entries())
        .map(([name, info]) => `$${name}: ${info.type}${info.defaultValue ? ` = ${info.defaultValue}` : ''}`)
        .join(', ');
      query += `(${variableDefinitions})`;
    }

    query += ` {\n  ${queryBody}\n}`;

    return query;
  }

  /**
   * Generate a random mutation
   */
  generateRandomMutation(): string {
    const mutationType = this.getMutationType();
    if (!mutationType?.fields) {
      throw new Error('No mutation type found in schema');
    }

    const availableFields = mutationType.fields.filter(field => 
      !field.name.startsWith('__') && 
      !field.isDeprecated
    );

    if (availableFields.length === 0) {
      throw new Error('No available mutation fields found');
    }

    // Pick one random mutation field
    const selectedField = availableFields[Math.floor(Math.random() * availableFields.length)];
    const variables = new Map<string, { type: string; defaultValue: string | null }>();
    const mutationBody = this.generateFieldQuery(selectedField, 0, variables);

    let mutation = `mutation ${this.generateMutationName(selectedField)}`;
    
    if (variables.size > 0) {
      const variableDefinitions = Array.from(variables.entries())
        .map(([name, info]) => `$${name}: ${info.type}${info.defaultValue ? ` = ${info.defaultValue}` : ''}`)
        .join(', ');
      mutation += `(${variableDefinitions})`;
    }

    mutation += ` {\n  ${mutationBody}\n}`;

    return mutation;
  }

  private getQueryType(): GraphQLType | undefined {
    const queryTypeName = this.schema.queryType?.name;
    return queryTypeName ? this.typeMap.get(queryTypeName) : undefined;
  }

  private getMutationType(): GraphQLType | undefined {
    const mutationTypeName = this.schema.mutationType?.name;
    return mutationTypeName ? this.typeMap.get(mutationTypeName) : undefined;
  }

  private generateFieldQuery(field: GraphQLField, depth: number, variables: Map<string, { type: string; defaultValue: string | null }>): string {
    let query = field.name;

    // Add arguments if the field has any
    if (field.args && field.args.length > 0) {
      const args = this.generateArguments(field.args, variables);
      if (args.length > 0) {
        query += `(${args.join(', ')})`;
      }
    }

    // Add subfields if this is an object type
    const fieldType = this.unwrapType(field.type);
    const subfields = this.generateSubfields(fieldType, depth);
    if (subfields) {
      query += ` {\n${this.indent(subfields, depth + 1)}\n${this.indent('', depth)}}`;
    }

    return query;
  }

  private generateSubfields(typeName: string, depth: number): string | null {
    if (depth >= this.maxDepth) return null;

    const type = this.typeMap.get(typeName);
    if (!type || !type.fields || this.isScalarType(typeName)) {
      return null;
    }

    // Filter available fields
    const availableFields = type.fields.filter(field => 
      !field.name.startsWith('__') && 
      !field.isDeprecated
    );

    if (availableFields.length === 0) return null;

    // Select random subset of fields
    const numFields = Math.min(
      Math.floor(Math.random() * this.maxFields) + 1,
      availableFields.length
    );
    const selectedFields = this.getRandomFields(availableFields, numFields);

    const variables = new Map<string, { type: string; defaultValue: string | null }>(); // Local variables for subfields
    return selectedFields.map(field => 
      this.generateFieldQuery(field, depth, variables)
    ).join('\n');
  }

  private generateArguments(args: GraphQLArgument[], variables: Map<string, { type: string; defaultValue: string | null }>): string[] {
    const result: string[] = [];

    // Only generate arguments for required fields or randomly for optional ones
    for (const arg of args) {
      const isRequired = this.isNonNullType(arg.type);
      const shouldInclude = isRequired || Math.random() > 0.5;

      if (shouldInclude) {
        const argValue = this.generateArgumentValue(arg, variables);
        if (argValue) {
          result.push(`${arg.name}: ${argValue}`);
        }
      }
    }

    return result;
  }

  private generateArgumentValue(arg: GraphQLArgument, variables: Map<string, { type: string; defaultValue: string | null }>): string | null {
    const baseType = this.unwrapType(arg.type);
    
    // Use variable for complex types or when we want to make the query more realistic
    if (!this.isScalarType(baseType) || Math.random() > 0.3) {
      const variableName = this.generateVariableName(arg.name);
      const typeString = this.typeToString(arg.type);
      const defaultValue = this.generateDefaultValue(baseType);
      
      variables.set(variableName, {
        type: typeString,
        defaultValue: defaultValue
      });
      
      return `$${variableName}`;
    }

    // Generate inline scalar values
    return this.generateScalarValue(baseType);
  }

  private generateDefaultValue(typeName: string): string | null {
    if (this.isScalarType(typeName)) {
      switch (typeName) {
        case 'String':
        case 'ID':
          return '"example"';
        case 'Int':
          return '42';
        case 'Float':
          return '3.14';
        case 'Boolean':
          return 'true';
        default:
          return null;
      }
    }

    // For enum types, pick a random enum value
    const type = this.typeMap.get(typeName);
    if (type && type.enumValues && type.enumValues.length > 0) {
      const enumValue = type.enumValues[Math.floor(Math.random() * type.enumValues.length)];
      return enumValue.name;
    }

    return null;
  }

  private generateScalarValue(typeName: string): string {
    switch (typeName) {
      case 'String':
      case 'ID':
        return '"example"';
      case 'Int':
        return Math.floor(Math.random() * 1000).toString();
      case 'Float':
        return (Math.random() * 100).toFixed(2);
      case 'Boolean':
        return Math.random() > 0.5 ? 'true' : 'false';
      default:
        // For enum types
        const type = this.typeMap.get(typeName);
        if (type && type.enumValues && type.enumValues.length > 0) {
          const enumValue = type.enumValues[Math.floor(Math.random() * type.enumValues.length)];
          return enumValue.name;
        }
        return '"unknown"';
    }
  }

  private generateVariableName(argName: string): string {
    // Convert camelCase to more readable variable names
    return argName.replace(/([A-Z])/g, '_$1').toLowerCase();
  }

  private generateQueryName(fields: GraphQLField[]): string {
    if (fields.length === 1) {
      return `Get${this.capitalize(fields[0].name)}`;
    }
    return `GetMultiple${fields.length}Fields`;
  }

  private generateMutationName(field: GraphQLField): string {
    return `Execute${this.capitalize(field.name)}`;
  }

  private getRandomFields<T>(fields: T[], count: number): T[] {
    const shuffled = [...fields].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  private unwrapType(type: GraphQLFieldType): string {
    if (type.ofType) {
      return this.unwrapType(type.ofType);
    }
    return type.name || 'Unknown';
  }

  private isNonNullType(type: GraphQLFieldType): boolean {
    return type.kind === 'NON_NULL';
  }

  private isScalarType(typeName: string): boolean {
    return ['String', 'Int', 'Float', 'Boolean', 'ID'].includes(typeName);
  }

  private typeToString(type: GraphQLFieldType): string {
    if (type.kind === 'NON_NULL' && type.ofType) {
      return `${this.typeToString(type.ofType)}!`;
    }
    if (type.kind === 'LIST' && type.ofType) {
      return `[${this.typeToString(type.ofType)}]`;
    }
    return type.name || 'Unknown';
  }

  private indent(text: string, level: number): string {
    const indentation = '  '.repeat(level);
    return text.split('\n').map(line => line ? indentation + line : line).join('\n');
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

// Introspection query for getting schema
export const INTROSPECTION_QUERY = `
query IntrospectionQuery {
  __schema {
    queryType {
      name
    }
    mutationType {
      name
    }
    subscriptionType {
      name
    }
    types {
      kind
      name
      description
      fields(includeDeprecated: true) {
        name
        description
        args {
          name
          description
          type {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
                ofType {
                  kind
                  name
                }
              }
            }
          }
          defaultValue
        }
        type {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
              }
            }
          }
        }
        isDeprecated
        deprecationReason
      }
      inputFields {
        name
        description
        type {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
              }
            }
          }
        }
        defaultValue
      }
      interfaces {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
            }
          }
        }
      }
      enumValues(includeDeprecated: true) {
        name
        description
        isDeprecated
        deprecationReason
      }
      possibleTypes {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
            }
          }
        }
      }
    }
  }
}`;
