import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { composeitAuth } from '../auth';
import { composeitProps } from '../common/props';
import { COMPOSEIT_API_URL } from '../common/constants';

interface ExportResult {
  html?: {
    htmlDocument: string;
    checksum: string;
    mimeType: string;
    sizeBytes: number;
  };
  mjml?: {
    mjml: string;
    checksum: string;
    mimeType: string;
    sizeBytes: number;
  };
  pdf?: {
    checksum: string;
    mimeType: string;
    url: string;
    sizeBytes: number;
    filename: string;
    storageKey: string;
  };
  image?: {
    checksum: string;
    mimeType: string;
    url: string;
    sizeBytes: number;
    filename: string;
    storageKey: string;
  };
}

export const generateDocumentAction = createAction({
  auth: composeitAuth,
  name: 'composeit_generate_document',
  displayName: 'Generate Document',
  description:
    'Merge a Composeit template with data and generate the specified output formats (PDF, HTML, Image, MJML).',
  props: {
    templateId: composeitProps.templateDropdown({
      displayName: 'Template',
      description: 'The template to merge with data.',
    }),
    templateVersion: Property.ShortText({
      displayName: 'Template Version',
      description:
        'Specific version of the template to use. Leave blank to use the latest.',
      required: false,
    }),
    formats: Property.StaticMultiSelectDropdown({
      displayName: 'Formats',
      description: 'Output formats to generate after merging.',
      required: true,
      options: {
        options: [
          { label: 'PDF', value: 'pdf' },
          { label: 'Image', value: 'image' },
          { label: 'HTML', value: 'html' },
          { label: 'MJML', value: 'mjml' },
        ],
      },
    }),
    imageType: Property.StaticDropdown({
      displayName: 'Image Type',
      description:
        'Format of the image output. Only applies when "Image" format is selected.',
      required: false,
      options: {
        options: [
          { label: 'PNG', value: 'png' },
          { label: 'JPG', value: 'jpg' },
        ],
      },
    }),
    isTest: Property.Checkbox({
      displayName: 'Test Mode',
      description:
        'Generate with a watermark (test mode). Does not count against your quota.',
      required: false,
    }),
    data: Property.Json({
      displayName: 'Data',
      description:
        'JSON data to merge with the template. Keys must match template variables.',
      required: false,
    }),
  },
  async run(context) {
    const { templateId, templateVersion, formats, imageType, isTest, data } =
      context.propsValue;

    const body: Record<string, unknown> = {
      templateId,
      formats,
    };

    if (templateVersion) body['templateVersion'] = templateVersion;
    if (imageType) body['imageType'] = imageType;
    if (isTest !== undefined && isTest !== null) body['isTest'] = isTest;
    if (data) body['data'] = data;

    const response = await httpClient.sendRequest<ExportResult>({
      method: HttpMethod.POST,
      url: `${COMPOSEIT_API_URL}/export`,
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
