type SchemaType = 'number' | 'boolean' | 'date' | 'json' | 'string' | 'relation';

interface SchemaProperty {
  type: SchemaType;
  target?: string;
  isMany?: boolean;
}

export interface DataSource {
  id: string;
  schema?: Record<string, SchemaProperty>;
  isRoot?: boolean;
}

interface JsonSchemaType {
  type: string;
  format?: string;
  additionalProperties?: boolean;
}

interface JsonSchemaObject {
  type: 'object';
  properties: Record<string, JsonSchemaType | JsonSchemaArray | JsonSchemaObject>;
}

interface JsonSchemaArray {
  type: 'array';
  items: JsonSchemaObject;
}

const MAX_DEPTH = 4;

function mapSchemaTypeToJsonSchemaType(schemaType?: SchemaType): JsonSchemaType {
  if (!schemaType) return { type: 'string' };

  switch (schemaType) {
    case 'number':
      return { type: 'number' };
    case 'boolean':
      return { type: 'boolean' };
    case 'date':
      return { type: 'string', format: 'date-time' };
    case 'json':
      return { type: 'object', additionalProperties: true };
    case 'string':
    case 'relation':
    default:
      return { type: 'string' };
  }
}

function isEmpty(test: unknown): boolean {
  if (test === undefined || test === null) return true;
  if (typeof test === 'object' && !Array.isArray(test))
    return Object.keys(test as object).length === 0;
  if (Array.isArray(test)) return test.length === 0;
  return false;
}

function parseCollectionToFields(
  currentSource: DataSource,
  allSources: DataSource[],
  visited = new Set<string>(),
  depth = 0,
): JsonSchemaObject | null {
  if (!currentSource || !currentSource.schema || isEmpty(currentSource.schema)) {
    return null;
  }

  if (visited.has(currentSource.id)) return null;
  visited.add(currentSource.id);

  const properties: Record<
    string,
    JsonSchemaType | JsonSchemaArray | JsonSchemaObject
  > = {};

  for (const [key, property] of Object.entries(currentSource.schema)) {
    if (key === 'id') continue;

    if (property.type === 'relation') {
      if (depth >= MAX_DEPTH) continue;

      const targetSource = allSources.find((src) => src.id === property.target);

      if (targetSource) {
        const childSchema = parseCollectionToFields(
          targetSource,
          allSources,
          new Set(visited),
          depth + 1,
        );

        if (childSchema && Object.keys(childSchema.properties).length > 0) {
          if (property.isMany) {
            properties[key] = { type: 'array', items: childSchema };
          } else {
            properties[key] = childSchema;
          }
        }
      }
    } else {
      properties[key] = mapSchemaTypeToJsonSchemaType(property.type);
    }
  }

  return { type: 'object', properties };
}

export function parseDatasourcesToJsonSchema(dataSources: DataSource[]): object {
  if (!Array.isArray(dataSources) || dataSources.length === 0) {
    return {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {},
    };
  }

  const rootSource =
    dataSources.find((source) => source.isRoot === true) ?? dataSources[0];

  const rootSchema = parseCollectionToFields(rootSource, dataSources);

  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    properties: rootSchema ? rootSchema.properties : {},
  };
}
