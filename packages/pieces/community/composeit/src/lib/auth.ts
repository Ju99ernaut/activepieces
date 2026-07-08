import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { COMPOSEIT_API_URL } from './common/constants';

export const composeitAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: `Enter your API key with at least \`templates.read\` and \`documents.write\` permissions for generation and \`templates.write\` for template updates.

You can find your API keys at [/dashboard/api-keys](https://app.composeit.app/dashboard/api-keys).`,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest<{ ok: boolean }>({
        method: HttpMethod.GET,
        url: `${COMPOSEIT_API_URL}/api-keys/test`,
        headers: {
          'X-API-KEY': auth,
        },
      });
      return { valid: true };
    } catch {
      return {
        valid: false,
        error: 'Invalid API key. Please check your key and its permissions.',
      };
    }
  },
});
