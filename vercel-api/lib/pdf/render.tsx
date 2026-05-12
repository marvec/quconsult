import { renderToBuffer } from '@react-pdf/renderer';
import { ReadinessDocument, type ReadinessDocumentProps } from './components/ReadinessDocument';

export async function renderPdf(props: ReadinessDocumentProps): Promise<Buffer> {
  return renderToBuffer(<ReadinessDocument {...props} />);
}
