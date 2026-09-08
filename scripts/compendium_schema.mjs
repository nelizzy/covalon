import data from "./v.json" with { type: "json" };
const { SCHEMA_VERSION, folders } = data;

const MODULE_ID = "covalon";

Hooks.on("init", () => {
  game.settings.register(MODULE_ID, "packSchemaVersion", {
    name: "Pack Schema",
    scope: "world",
    config: false,
    type: Number,
    default: -1,
  });
});

Hooks.on("ready", async () => {
  const mod = game.modules.get(MODULE_ID);
  if (mod) mod.api = { rebuildFolders };

  if (!game.user.isGM) return;

  await rebuildFolders();
});

function buildPlan(folders, rootKey, rootOverride = {}) {
  const plan = [];

  function walk(key, parentId, sort) {
    const node = folders[key];
    const id = foundry.utils.randomID();

    plan.push({
      key,
      id,
      packs: node.packs ?? [],
      data: {
        _id: id,
        name: node.name,
        type: "Compendium",
        sorting: node.sorting,
        color: node.color,
        folder: parentId ?? null,
        ...(sort !== undefined ? { sort } : {}),
        flags: { [MODULE_ID]: { folderKey: key } },
      },
    });

    for (const childKey of node.folders ?? []) {
      walk(childKey, id);
    }
  }

  walk(rootKey, rootOverride.parentId ?? null, rootOverride.sort);
  return plan;
}


function recursiveFilter(folder) {
  if (folder.getFlag(MODULE_ID, "folderKey") !== undefined) return true;
  if (folder.folder === null) return false;
  if (folder.folder.name === "Covalon") return true;

  return recursiveFilter(folder.folder);
}


async function rebuildFolders({ force = false } = {}) {
  if (!game.user.isGM) {
    return;
  }

  const currentVersion = game.settings.get(MODULE_ID, "packSchemaVersion");
  if (!force && currentVersion >= SCHEMA_VERSION) return;

  const staleFolders = game.folders.filter(recursiveFilter);
  let existingRoot = staleFolders.find((f) => f.getFlag(MODULE_ID, "folderKey") === "Covalon");

  // In case somebody DID move the Covalon folder
  if (!existingRoot) {
    const legacyRoot = game.folders.find(
      (f) => f.type === "Compendium" && f.folder === null && f.name === "Covalon"
    );
    if (legacyRoot) {
      console.log(`Covalon | adopting unflagged legacy root folder ${legacyRoot.id}`);
      existingRoot = legacyRoot;
      staleFolders.push(legacyRoot);
    }
  }

  let rootParentId = existingRoot?._source.folder ?? null;
  const rootSort = existingRoot?._source.sort;

  if (rootParentId && !game.folders.get(rootParentId)) {
    rootParentId = null;
  }

  const plan = buildPlan(folders, "Covalon", { parentId: rootParentId, sort: rootSort });

  const operations = [];
  const staleIds = staleFolders.map((f) => f.id);

  if (staleIds.length) {
    operations.push({ action: "delete", documentName: "Folder", ids: staleIds });
  }
  operations.push({
    action: "create",
    documentName: "Folder",
    data: plan.map((p) => p.data),
    keepId: true,
  });

  await foundry.documents.modifyBatch(operations);

  // One read-modify-write against the shared world setting, instead of one
  // setFolder() call per pack — concurrent setFolder() calls race against
  // each other on this setting and silently drop updates.
  const compendiumConfig = foundry.utils.deepClone(
    game.settings.get("core", "compendiumConfiguration") ?? {}
  );

  for (const p of plan) {
    p.packs.forEach((packName, index) => {
      const pack = game.packs.get(`${MODULE_ID}.${packName}`);
      if (!pack) {
        console.warn(`Covalon | pack "${packName}" not found, skipping folder assignment`);
        return;
      }
      const existing = compendiumConfig[pack.collection] ?? {};
      compendiumConfig[pack.collection] = {
        ...existing,
        folder: p.id,
        sort: (index + 1) * 100,
      };
    });
  }

  await game.settings.set("core", "compendiumConfiguration", compendiumConfig);
  await game.settings.set(MODULE_ID, "packSchemaVersion", SCHEMA_VERSION);
}