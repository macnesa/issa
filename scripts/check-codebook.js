const fs = require('fs');
const path = require('path');

const repositoryRoot = path.resolve(__dirname, '..');
const codebookPath = path.join(repositoryRoot, 'CODEBOOK.json');
const indexPath = path.join(repositoryRoot, 'CODEBOOK_INDEX.md');
const excludedDirectories = new Set(['node_modules', 'dist', 'build', 'coverage', '.git', 'migrations', 'seeders']);
const sourceRoots = [
  { directory: 'client/src', layer: 'CLIENT' },
  { directory: 'cms-side/src', layer: 'CMS' },
  { directory: 'server', layer: 'SERVER' },
];
const markerPattern = /^ISSA:(CLIENT|CMS|SERVER)\.[A-Z][A-Z0-9_]*\.[A-Z][A-Z0-9_]*$/;
const markerStatementPattern = /\bvoid\s+(['"])(ISSA:[^'"]+)\1\s*;/g;
const requiredEntryFields = ['purpose', 'receives', 'returns', 'sideEffects', 'rules'];

function collectSourceFiles(directoryPath) {
  return fs.readdirSync(directoryPath, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directoryPath, entry.name);
    if (entry.isDirectory()) return excludedDirectories.has(entry.name) ? [] : collectSourceFiles(entryPath);
    return /\.(js|jsx)$/.test(entry.name) ? [entryPath] : [];
  });
}

function getLineNumber(sourceText, characterIndex) {
  return sourceText.slice(0, characterIndex).split('\n').length;
}

function formatSourceLocation(sourceFile, lineNumber) {
  return `${path.relative(repositoryRoot, sourceFile)}:${lineNumber}`;
}

function readCodebook() {
  try {
    return JSON.parse(fs.readFileSync(codebookPath, 'utf8'));
  } catch (error) {
    return { error };
  }
}

function collectMarkers() {
  return sourceRoots.flatMap(({ directory, layer }) => {
    const rootDirectory = path.join(repositoryRoot, directory);
    return collectSourceFiles(rootDirectory).flatMap((sourceFile) => {
      const sourceText = fs.readFileSync(sourceFile, 'utf8');
      const markers = [];
      markerStatementPattern.lastIndex = 0;
      let match;
      while ((match = markerStatementPattern.exec(sourceText)) !== null) {
        markers.push({ id: match[2], layer, sourceFile, lineNumber: getLineNumber(sourceText, match.index) });
      }
      return markers;
    });
  });
}

function validateCodebook(codebook, markers) {
  const errors = [];
  if (codebook.error) return [`Invalid CODEBOOK.json: ${codebook.error.message}`];
  if (!codebook.entries || typeof codebook.entries !== 'object' || Array.isArray(codebook.entries)) {
    return ['Invalid CODEBOOK.json: entries must be an object.'];
  }

  const markersById = new Map();
  markers.forEach((marker) => {
    const markerLocations = markersById.get(marker.id) || [];
    markerLocations.push(marker);
    markersById.set(marker.id, markerLocations);
    if (!markerPattern.test(marker.id)) errors.push(`Invalid marker ID: ${marker.id}\n→ ${formatSourceLocation(marker.sourceFile, marker.lineNumber)}`);
    if (marker.id.split(':')[1]?.split('.')[0] !== marker.layer) {
      errors.push(`Marker layer does not match source location: ${marker.id}\n→ ${formatSourceLocation(marker.sourceFile, marker.lineNumber)}`);
    }
  });

  markersById.forEach((markerLocations, markerId) => {
    if (markerLocations.length > 1) {
      errors.push(`Duplicate marker: ${markerId}\n${markerLocations.map((marker) => `→ ${formatSourceLocation(marker.sourceFile, marker.lineNumber)}`).join('\n')}`);
    }
  });
  markers.forEach((marker) => {
    if (!codebook.entries[marker.id]) errors.push(`Missing dictionary entry:\n${marker.id}\n→ ${formatSourceLocation(marker.sourceFile, marker.lineNumber)}`);
  });

  Object.entries(codebook.entries).forEach(([markerId, entry]) => {
    if (!markersById.has(markerId)) errors.push(`Orphan dictionary entry: ${markerId}`);
    if (!markerPattern.test(markerId)) errors.push(`Invalid dictionary ID: ${markerId}`);
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      errors.push(`Invalid dictionary entry: ${markerId} must be an object.`);
      return;
    }
    requiredEntryFields.forEach((field) => {
      if (!(field in entry)) errors.push(`Missing ${field} in dictionary entry: ${markerId}`);
    });
    if (typeof entry.purpose !== 'string' || !entry.purpose.trim()) errors.push(`purpose must be a non-empty string: ${markerId}`);
    if (typeof entry.returns !== 'string' || !entry.returns.trim()) errors.push(`returns must be a non-empty string: ${markerId}`);
    ['receives', 'sideEffects', 'rules'].forEach((field) => {
      if (!Array.isArray(entry[field])) errors.push(`${field} must be an array: ${markerId}`);
    });
  });
  return errors;
}

function writeIndex(markers) {
  const headings = { CLIENT: 'Client', CMS: 'CMS', SERVER: 'Server' };
  const indexLines = ['# ISSA Codebook Index', ''];
  sourceRoots.forEach(({ layer }) => {
    indexLines.push(`## ${headings[layer]}`, '');
    markers.filter((marker) => marker.layer === layer).sort((leftMarker, rightMarker) => leftMarker.id.localeCompare(rightMarker.id)).forEach((marker) => {
      indexLines.push(`- \`${marker.id}\``, `  - \`${formatSourceLocation(marker.sourceFile, marker.lineNumber)}\``);
    });
    indexLines.push('');
  });
  fs.writeFileSync(indexPath, `${indexLines.join('\n').trimEnd()}\n`);
  console.log(`Wrote ${path.relative(repositoryRoot, indexPath)}.`);
}

const codebook = readCodebook();
const markers = collectMarkers();
const validationErrors = validateCodebook(codebook, markers);
if (validationErrors.length) {
  console.error(`Codebook check failed with ${validationErrors.length} issue(s):`);
  validationErrors.forEach((error) => console.error(`\n${error}`));
  process.exitCode = 1;
} else {
  if (process.argv.includes('--write-index')) writeIndex(markers);
  console.log(`Codebook check passed: ${markers.length} markers validated.`);
}
