export const STORAGE_KEY = "sot_save";
export const BACKUP_STORAGE_KEY = "sot_save_backup";

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

function formatDateForFilename(value = Date.now()) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }

  return date.toISOString().slice(0, 10);
}

export function getSaveFilename(save = {}, prefix = "sea-of-treasure-save") {
  const timestamp = save?.saveMeta?.updatedAt ?? save?.saveMeta?.createdAt ?? Date.now();

  return `${prefix}-${formatDateForFilename(timestamp)}.json`;
}

export function downloadJsonFile(json, filename = getSaveFilename()) {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportGameSave(gameState, filename = getSaveFilename(gameState)) {
  const json = JSON.stringify(gameState, null, 2);
  downloadJsonFile(json, filename);
  return json;
}

export function getStoredSave(key = STORAGE_KEY) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getStoredBackupSave() {
  return getStoredSave(BACKUP_STORAGE_KEY);
}

export function backupLocalSave() {
  const currentSave = localStorage.getItem(STORAGE_KEY);

  if (!currentSave) {
    return null;
  }

  localStorage.setItem(BACKUP_STORAGE_KEY, currentSave);
  return currentSave;
}

export function writeLocalSave(save) {
  backupLocalSave();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
}

export function restoreBackupSave() {
  const backupSave = localStorage.getItem(BACKUP_STORAGE_KEY);

  if (!backupSave) {
    return false;
  }

  backupLocalSave();
  localStorage.setItem(STORAGE_KEY, backupSave);
  return true;
}

export function deleteBackupSave() {
  localStorage.removeItem(BACKUP_STORAGE_KEY);
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
  writeLocalSave(save);
}
