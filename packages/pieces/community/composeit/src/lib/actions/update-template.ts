import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { composeitAuth } from '../auth';
import { composeitProps } from '../common/props';
import { COMPOSEIT_API_URL } from '../common/constants';

interface UpdatedTemplate {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  thumbnailUrl: string | null;
  templateType: string;
  isActive: boolean;
  isFavorite: boolean;
  isTrashed: boolean;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export const updateTemplateAction = createAction({
  auth: composeitAuth,
  name: 'composeit_update_template',
  displayName: 'Update Template',
  description:
    "Update a Composeit template's name, description, or published status.",
  props: {
    id: composeitProps.templateDropdown({
      displayName: 'Template',
      description: 'The template to update.',
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'New name for the template.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'New description for the template.',
      required: false,
    }),
    isActive: Property.Checkbox({
      displayName: 'Is Published',
      description: 'Published templates generate without a watermark.',
      required: false,
    }),
  },
  async run(context) {
    const { id, name, description, isActive } = context.propsValue;

    const body: Record<string, unknown> = {};
    if (name !== undefined && name !== null) body['name'] = name;
    if (description !== undefined && description !== null)
      body['description'] = description;
    if (isActive !== undefined && isActive !== null)
      body['isActive'] = isActive;

    const response = await httpClient.sendRequest<UpdatedTemplate>({
      method: HttpMethod.PATCH,
      url: `${COMPOSEIT_API_URL}/templates/${id}`,
      headers: {
        'X-API-KEY': context.auth.secret_text,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body,
    });

    return response.body;
  },
});
