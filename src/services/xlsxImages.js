import { unzipSync } from 'fflate';

const XML_NS = 'http://schemas.openxmlformats.org/drawingml/2006/main';
const REL_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';

function textContent(element, tagName) {
  return element?.getElementsByTagNameNS('*', tagName)[0]?.textContent || '';
}

function readXml(files, path) {
  const bytes = files[path];
  return bytes ? new DOMParser().parseFromString(new TextDecoder().decode(bytes), 'application/xml') : null;
}

function resolvePath(basePath, target) {
  if (target.startsWith('/')) return target.slice(1);
  const parts = `${basePath}/${target}`.split('/');
  const resolved = [];
  parts.forEach((part) => {
    if (!part || part === '.') return;
    if (part === '..') resolved.pop();
    else resolved.push(part);
  });
  return resolved.join('/');
}

function dataUrl(path, bytes) {
  const extension = path.split('.').pop().toLowerCase();
  const mime = extension === 'jpg' || extension === 'jpeg' ? 'jpeg' : extension;
  let binary = '';
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return `data:image/${mime};base64,${btoa(binary)}`;
}

function relationships(files, path) {
  const relsPath = `${path.substring(0, path.lastIndexOf('/'))}/_rels/${path.split('/').pop()}.rels`;
  const document = readXml(files, relsPath);
  return Object.fromEntries([...document?.getElementsByTagNameNS('*', 'Relationship') || []].map((rel) => [
    rel.getAttribute('Id'),
    resolvePath(path.substring(0, path.lastIndexOf('/')), rel.getAttribute('Target')),
  ]));
}

export function extractEmbeddedImages(buffer, sheetPath = 'xl/worksheets/sheet1.xml') {
  const files = unzipSync(new Uint8Array(buffer));
  const sheet = readXml(files, sheetPath);
  const drawingId = sheet?.getElementsByTagNameNS(REL_NS, 'id')[0]?.value
    || sheet?.getElementsByTagNameNS('*', 'drawing')[0]?.getAttributeNS(REL_NS, 'id');
  if (!drawingId) return [];

  const sheetRels = relationships(files, sheetPath);
  const drawingPath = sheetRels[drawingId];
  if (!drawingPath) return [];
  const drawing = readXml(files, drawingPath);
  const drawingRels = relationships(files, drawingPath);
  const images = [];

  [...drawing?.documentElement.children || []].forEach((anchor) => {
    const from = anchor.getElementsByTagNameNS('*', 'from')[0];
    const embed = anchor.getElementsByTagNameNS(XML_NS, 'blip')[0]?.getAttributeNS(REL_NS, 'embed');
    const mediaPath = drawingRels[embed];
    if (!from || !mediaPath || !files[mediaPath]) return;
    images.push({
      row: Number(textContent(from, 'row')),
      col: Number(textContent(from, 'col')),
      src: dataUrl(mediaPath, files[mediaPath]),
    });
  });

  return images;
}
