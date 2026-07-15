import { type ArraySubProps, Property } from '@activepieces/pieces-framework';

type SchemaType =
  | 'number'
  | 'boolean'
  | 'date'
  | 'json'
  | 'string'
  | 'relation';

interface SchemaProperty {
  id: string;
  type: SchemaType;
  target?: string;
  isMany?: boolean;
}

export interface DataSource {
  id: string;
  schema?: Record<string, SchemaProperty>;
  isRoot?: boolean;
}

const MAX_DEPTH = 1;

const isObject = (test: unknown): test is Record<string, unknown> =>
  typeof test === 'object' && test !== null;

const isEmpty = (test: unknown): boolean => {
  if (test === undefined || test === null) return true;
  if (isObject(test)) return Object.keys(test).length === 0;
  if (Array.isArray(test)) return test.length === 0;
  return false;
};

function createPrimitiveApProperty(
  schemaType: SchemaType,
  displayName: string
): unknown {
  switch (schemaType) {
    case 'number':
      return Property.Number({ displayName, required: false });
    case 'boolean':
      return Property.Checkbox({ displayName, required: false });
    case 'date':
      return Property.DateTime({ displayName, required: false });
    case 'json':
      return Property.Json({ displayName, required: false, defaultValue: {} });
    case 'string':
    case 'relation':
    default:
      return Property.ShortText({ displayName, required: false });
  }
}

function parseCollectionToApProperties(
  currentSource: DataSource,
  allSources: DataSource[],
  prefix = '',
  prefixLabel = '',
  visited = new Set<string>(),
  depth = 0
) {
  if (
    !currentSource ||
    !currentSource.schema ||
    isEmpty(currentSource.schema)
  ) {
    return {};
  }

  if (visited.has(currentSource.id)) return {};
  visited.add(currentSource.id);

  const properties: Record<string, unknown> = {};

  for (const [key, property] of Object.entries(currentSource.schema)) {
    if (key === 'id') continue;

    const fieldKey = prefix ? `${prefix}_${property.id}` : property.id;
    const fieldLabel = prefixLabel ? `${prefixLabel}.${key}` : key;

    if (property.type === 'relation') {
      if (depth >= MAX_DEPTH) {
        properties[fieldKey] = Property.Json({
          displayName: `${fieldLabel} (Nested Data)`,
          description: `Enter JSON object for field: ${fieldLabel} (Max depth reached)`,
          required: false,
          defaultValue: {},
        });
        continue;
      }

      const targetSource = allSources.find((src) => src.id === property.target);

      if (targetSource) {
        const childProperties = parseCollectionToApProperties(
          targetSource,
          allSources,
          fieldKey,
          property.isMany ? '' : fieldLabel,
          new Set(visited),
          depth + 1
        );

        if (Object.keys(childProperties).length > 0) {
          if (property.isMany) {
            properties[fieldKey] = Property.Array({
              displayName: fieldLabel,
              description: `Add items for ${fieldLabel}`,
              required: false,
              properties: childProperties as ArraySubProps<true>,
            });
          } else {
            Object.assign(properties, childProperties);
          }
        }
      }
    } else {
      properties[fieldKey] = createPrimitiveApProperty(
        property.type,
        fieldLabel
      );
    }
  }

  return properties;
}

export const parseDatasourcesToActivepieces = (
  dataSources: DataSource[]
): Record<string, unknown> => {
  if (!Array.isArray(dataSources) || dataSources.length === 0) {
    return {};
  }

  const rootSource =
    dataSources.find((source) => source.isRoot === true) || dataSources[0];
  return parseCollectionToApProperties(rootSource, dataSources);
};
