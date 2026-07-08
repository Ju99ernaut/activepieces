import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { composeitAuth } from './lib/auth';
import { generateDocumentAction } from './lib/actions/generate-document';
import { updateTemplateAction } from './lib/actions/update-template';

export const composeit = createPiece({
  displayName: 'Composeit',
  description:
    'Merge templates with data to generate PDF, HTML, Image, and MJML documents using Composeit.',
  auth: composeitAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/composeit.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: [],
  actions: [generateDocumentAction, updateTemplateAction],
  triggers: [],
});
