export type GeminiJsonParseResult =
  | { ok: true; value: unknown }
  | { ok: false; error: string; rawLength: number; preview: string };

function stripFences(text: string): string {
  return text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/, "")
    .replace(/```\s*$/, "")
    .trim();
}

/** Extract the first complete top-level JSON object when the model adds extra text. */
function extractJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  if (start < 0) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < text.length; i += 1) {
    const ch = text[i];
    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\") {
        escape = true;
        continue;
      }
      if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{") {
      depth += 1;
    }
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }

  return null;
}

export function tryParseGeminiJson(text: string): GeminiJsonParseResult {
  const cleaned = stripFences(text);
  const preview = cleaned.slice(0, 280).replace(/\s+/g, " ");

  try {
    return { ok: true, value: JSON.parse(cleaned) };
  } catch (firstError) {
    const extracted = extractJsonObject(cleaned);
    if (extracted && extracted !== cleaned) {
      try {
        return { ok: true, value: JSON.parse(extracted) };
      } catch {
        // fall through
      }
    }

    const message = firstError instanceof Error ? firstError.message : String(firstError);
    return { ok: false, error: message, rawLength: cleaned.length, preview };
  }
}

export function parseGeminiJson(text: string): unknown {
  const result = tryParseGeminiJson(text);
  if (!result.ok) {
    throw new Error(result.error);
  }
  return result.value;
}
