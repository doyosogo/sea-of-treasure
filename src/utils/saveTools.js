const STORAGE_KEY = "sot_save";

export function isValidSaveShape(save) {
  return (
    save &&
    typeof save === "object" &&
    Number.isFinite(save.playerLevel) &&
    Number.isFinite(save.gold)
  );
}

export function createImportedSave(parsedSave) {
  return {
    ...parsedSave,
    activityLog: [
      { message: "Save imported.", type: "info" },
      ...(Array.isArray(parsedSave.activityLog) ? parsedSave.activityLog : [])
    ].slice(0, 8),
    lastSeen: Date.now()
  };
}

export function downloadJsonFile(json, filename = "sea-of-treasure-save.json") {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportGameSave(gameState, filename = "sea-of-treasure-save.json") {
  const json = JSON.stringify(gameState, null, 2);
  downloadJsonFile(json, filename);
  return json;
}

export function parseImportedSave(jsonText) {
  let parsedSave;

  try {
    parsedSave = JSON.parse(jsonText);
  } catch {
    return {
      ok: false,
      error: "Import failed: save JSON is not valid."
    };
  }

  if (!isValidSaveShape(parsedSave)) {
    return {
      ok: false,
      error: "Import failed: save is missing required fields."
    };
  }

  return {
    ok: true,
    save: createImportedSave(parsedSave)
  };
}

export function replaceLocalSave(save) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
}
