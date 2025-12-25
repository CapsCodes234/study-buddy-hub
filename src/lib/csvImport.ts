export interface SyllabusRow {
  mainTopic: string;
  subtopic: string;
  bulletText: string;
  level?: string;
  topicNumber?: string;
  outcomeNumber?: string;
  componentName?: string;
}

export interface ComponentRow {
  componentName: string;
  paperCode: string;
  durationMin: number;
  totalMarks: number;
  weightingPercent: number;
}

export interface CSVImportResult {
  syllabus: SyllabusRow[];
  components: ComponentRow[];
  errors: string[];
  warnings: string[];
}

const normalizeHeader = (value: string): string => {
  return value
    .replace(/^"|"$/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
};

const parseCSVLine = (line: string): string[] => {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  cells.push(current.trim());
  return cells;
};

const buildHeaderIndex = (headers: string[]): Record<string, number> => {
  const index: Record<string, number> = {};
  headers.forEach((h, i) => {
    const normalized = normalizeHeader(h);
    if (normalized) index[normalized] = i;
  });
  return index;
};

const getCellByHeader = (
  cells: string[],
  headerIndex: Record<string, number>,
  possibleHeaders: string[]
): string => {
  for (const header of possibleHeaders) {
    const idx = headerIndex[normalizeHeader(header)];
    if (idx !== undefined && idx < cells.length) {
      return (cells[idx] ?? '').trim();
    }
  }
  return '';
};

const parseIntSafe = (value: string): number => {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : 0;
};

const parseFloatSafe = (value: string): number => {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
};

/**
 * Parse CSV and detect type based on headers.
 * Filters A2-level rows if level column present.
 */
export function parseCSV(csvText: string, subjectId: string): CSVImportResult {
  void subjectId;

  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { syllabus: [], components: [], errors: ['CSV is empty'], warnings: [] };
  }

  const headerCells = parseCSVLine(lines[0]);
  const headers = headerCells.map((h) => normalizeHeader(h));
  const headerIndex = buildHeaderIndex(headerCells);

  const result: CSVImportResult = {
    syllabus: [],
    components: [],
    errors: [],
    warnings: [],
  };

  const isSyllabus = headers.some((h) =>
    h.includes('main_topic') || h === 'maintopic' || h.includes('subtopic')
  );
  const isComponents = headers.some((h) =>
    h.includes('component_name') || h === 'componentname' || h.includes('total_marks')
  );

  if (!isSyllabus && !isComponents) {
    result.errors.push(
      'CSV format not recognized. Must include either syllabus headers (Main Topic, Subtopic) or component headers (Component Name, Total Marks)'
    );
    return result;
  }

  if (isSyllabus) {
    const levelKeyPresent = headers.includes('level');

    for (let i = 1; i < lines.length; i++) {
      const cells = parseCSVLine(lines[i]);
      if (cells.length === 0) continue;

      const level = getCellByHeader(cells, headerIndex, ['level']);
      if (levelKeyPresent && level) {
        const lc = level.toLowerCase();
        if (!lc.includes('a2') && !lc.includes('a_level') && !lc.includes('a level')) {
          continue;
        }
      }

      const mainTopic = getCellByHeader(cells, headerIndex, ['main_topic', 'main topic', 'maintopic']);
      const subtopic = getCellByHeader(cells, headerIndex, ['subtopic', 'sub topic', 'sub_topic']);
      const bulletText = getCellByHeader(cells, headerIndex, [
        'bullet',
        'bullet_point',
        'bullet point text',
        'learning_outcome',
        'learning outcome',
        'outcome',
      ]);

      if (!mainTopic || !bulletText) {
        result.warnings.push(`Row ${i + 1}: Missing main topic or bullet text, skipped`);
        continue;
      }

      result.syllabus.push({
        mainTopic,
        subtopic,
        bulletText,
        level: level || undefined,
        topicNumber: getCellByHeader(cells, headerIndex, ['topic_number', 'topic number', 'topicnumber']) || undefined,
        outcomeNumber: getCellByHeader(cells, headerIndex, ['outcome_number', 'outcome number', 'outcomenumber']) || undefined,
        componentName: getCellByHeader(cells, headerIndex, ['component', 'component_mapping', 'component mapping']) || undefined,
      });
    }
  }

  if (isComponents) {
    for (let i = 1; i < lines.length; i++) {
      const cells = parseCSVLine(lines[i]);
      if (cells.length === 0) continue;

      const componentName = getCellByHeader(cells, headerIndex, ['component_name', 'component name', 'componentname']);
      const totalMarks = parseIntSafe(
        getCellByHeader(cells, headerIndex, ['total_marks', 'total marks', 'totalmarks'])
      );

      if (!componentName || totalMarks <= 0) {
        result.warnings.push(`Row ${i + 1}: Missing component name or zero marks, skipped`);
        continue;
      }

      result.components.push({
        componentName,
        paperCode: getCellByHeader(cells, headerIndex, ['paper_code', 'paper code', 'papercode']),
        durationMin: parseIntSafe(getCellByHeader(cells, headerIndex, ['duration', 'duration_min', 'duration (min)', 'duration min'])),
        totalMarks,
        weightingPercent: parseFloatSafe(getCellByHeader(cells, headerIndex, ['weighting', 'weighting_percent', 'weighting (%)', 'weight'])),
      });
    }
  }

  return result;
}

export function generatePreview(result: CSVImportResult): {
  bulletCount: number;
  componentCount: number;
  sampleRows: Array<SyllabusRow | ComponentRow>;
} {
  return {
    bulletCount: result.syllabus.length,
    componentCount: result.components.length,
    sampleRows: [...result.syllabus.slice(0, 2), ...result.components.slice(0, 1)],
  };
}
