import { Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { composeitAuth } from '../auth';
import { COMPOSEIT_API_URL } from './constants';

interface Template {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  templateType: string;
}

interface TemplatesResponse {
  data: Template[];
}

function templateDropdown({
  displayName,
  description,
}: {
  displayName: string;
  description: string;
}) {
  return Property.Dropdown({
    auth: composeitAuth,
    displayName,
    required: true,
    description,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your Composeit account first',
          options: [],
        };
      }
      try {
        const response = await httpClient.sendRequest<TemplatesResponse>({
          method: HttpMethod.GET,
          url: `${COMPOSEIT_API_URL}/templates`,
          headers: {
            'X-API-KEY': auth.secret_text,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        });
        const templates = response.body.data ?? [];
        return {
          disabled: false,
          options: templates.map((t) => ({
            label: t.name || t.id,
            value: t.id,
          })),
        };
      } catch {
        return {
          disabled: false,
          placeholder: 'Error loading templates',
          options: [],
        };
      }
    },
  });
}

export const composeitProps = {
  templateDropdown,
};
