import { renderToBuffer } from '@react-pdf/renderer';
import { ReadinessDocument, type ReadinessDocumentProps } from './components/ReadinessDocument.js';

export async function renderPdf(props: ReadinessDocumentProps): Promise<Buffer> {
  return renderToBuffer(<ReadinessDocument {...props} />);
}
