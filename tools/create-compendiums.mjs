
import { readFileSync, writeFileSync, existsSync, readFile } from "node:fs";

const PLANNER_FILE = "./COMPENDIUM_PLANNER.txt";
const MODULE_FILE = "./module.json";
const SCHEMA_FILE = "./scripts/v.json";

// ? create-compendiums.mjs
// ? takes COMPENDIUM_PLANNER.txt and convert it into compendium structure, then insert into module.json

// # helper functions
function slug(input) {
  if (!input) return "";

  // make lower case and trim
  var slug = input.toLowerCase().trim();

  // remove accents from charaters
  slug = slug.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // replace invalid chars with spaces
  slug = slug.replace(/[^a-z0-9\s-]/g, " ").trim();

  // replace multiple spaces or hyphens with a single hyphen
  slug = slug.replace(/[\s-]+/g, "-");

  return slug;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// * see https://gitlab.com/encounterlibrary/my-content-module/-/blob/main/module.json for other types
class Folder {
  constructor({ name = "Folder", path = [], depth } = {}) {
    this.name = name;
    this.sorting = name === "Covalon" ? "m" : "a";
    this.color = Folder.color[depth] ?? null;
    this.packs = [];
    this.folders = [];

    Folder.list[name] = this;
    Folder.list[path[path.length - 2]]?.folders.push(name);
  }

  static color = {
    0: "#362b21",
    1: "#3e3123",
    2: "#473624",
    3: "#4f3b26",
  }

  static list = {};
}

class Pack {
  constructor({ type = "actors", label = "Pack", playerObservable = false, path = [], banner = undefined } = {}) {
    this.label = label;
    this.name = slug(this.label);
    this.banner = banner ?? Pack.typeHandler[type].banner;
    this.path = `packs/${this.name}`;
    this.type = Pack.typeHandler[type].type;
    this.system = Pack.typeHandler[type].system;
    this.ownership = {
      PLAYER: playerObservable ? "OBSERVER" : "NONE",
      ASSISTANT: "OWNER",
    };

    Pack.list.push(this);
    Folder.list[path[path.length - 2]]?.packs.push(this.name)
  }

  static typeHandler = {
    actors: {
      type: "Actor",
      banner: `systems/pf2e/assets/compendium-banner/red.webp`,
      system: "pf2e",
    },
    items: {
      type: "Item",
      banner: `systems/pf2e/assets/compendium-banner/blue.webp`,
      system: "pf2e",
    },
    scenes: {
      type: "Scene",
      banner: `systems/pf2e/assets/compendium-banner/green.webp`,
    },
    journals: {
      type: "JournalEntry",
      banner: `systems/pf2e/assets/compendium-banner/orange.webp`,
    },
    macros: {
      type: "Macro",
      banner: `systems/pf2e/assets/compendium-banner/purple.webp`,
    },
    rolltables: {
      type: "RollTable",
      banner: `systems/pf2e/assets/compendium-banner/purple.webp`,
    },
    playlists: {
      type: "Playlist",
      banner: `systems/pf2e/assets/compendium-banner/purple.webp`,
    },
    adventures: {
      type: "Adventure",
      banner: `systems/pf2e/assets/system-banners/01.webp`,
    }
  }

  // things to get from the types prop

  static list = [];
}

// # functions for parsing data
function parseText(text) {
  // remove empty lines
  const lines = text.split("\n").filter((l) => l.trim().length > 0);

  let path = [];
  let lastDepth = 0;
  let prefix = "";

  lines.forEach((line) => {
    const regex = /^(?<depth>[^\S\r\n]*)(?<comment>#?)(?<folder>\/?)(?<observer>\*?)(?<folderName>(?<=\/)\w*)?(?<type>(?<!\/)\w*):? ?"?(?<label>(?<=").*?(?="))?"?/gi;

    let obj = regex.exec(line).groups;
    let { depth, comment, folder, observer, folderName, type, label } = obj;

    // we dont really care about comments
    if (comment) return;

    // simplify depth to make it easier to find things in array
    depth = Math.floor(depth.length / 2);
    if (lastDepth >= depth)
      path = path.slice(0, depth);

    // control naming -- expeditions are expeditionLocation + label; everything else is fullPath + label (if label === last part of path, then just fullPath)
    if (path.includes("Expeditions") && path[path.length - 1] !== "Expeditions")
      prefix = path[path.length - 1];
    else if (path[path.length - 1] === label)
      prefix = path.slice(0, depth - 1).join(" ");
    else
      prefix = path.join(" ")
    let name = folderName ?? label ?? capitalize(type);
    name = folder ? name : [prefix, name].join(" ");
    path.push(name);

    // actually make the items from the parsed text
    if (folder) {
      new Folder({ name, path, depth })
    } else if (type) {
      new Pack({ type, label: name, playerObservable: !!observer, path })
    }

    // track depth to determine nesting level for next line
    lastDepth = depth;
  });

  return { folders: flatToTree(Folder.list), packs: Pack.list, foldersFlat: Folder.list, folderCount: Object.keys(Folder.list).length }
}

function flatToTree(flatMap) {
  const treeMap = {};

  // build tree
  for (const [key, folder] of Object.entries(flatMap)) {
    treeMap[key] = { ...folder, folders: [] };
  }

  // add the children folders to their parent folders
  for (const [key, folder] of Object.entries(flatMap)) {
    const node = treeMap[key];
    node.folders = folder.folders.map(childName => treeMap[childName]);
  }

  // only return root folder (no parent)
  const childNames = new Set();
  for (const folder of Object.values(flatMap)) {
    for (const childName of folder.folders) {
      childNames.add(childName);
    }
  }
  const roots = Object.values(treeMap).filter(f => !childNames.has(f.name));
  return roots.length ? roots : Object.values(treeMap);
}

function editModuleJson({ folders, packs, folderCount }) {
  const moduleObj = JSON.parse(readFileSync(MODULE_FILE, 'utf-8'));
  moduleObj.packs = packs;
  // moduleObj.packFolders = folders;

  writeFileSync(MODULE_FILE, JSON.stringify(moduleObj, null, 2));
  console.log(`Set up module.json with ${packs.length} packs and ${folderCount} folders.`)
}

function writeExpectedPacks({ foldersFlat, packs }) {
  const schema = JSON.parse(readFileSync(SCHEMA_FILE, 'utf-8'));

  schema.SCHEMA_VERSION = schema.SCHEMA_VERSION + 1;
  schema.folders = foldersFlat;

  writeFileSync(SCHEMA_FILE, JSON.stringify(schema, null, 2));

  console.log(`Updated ${SCHEMA_FILE}'s versioning!`)
}

// # time to run

function run() {
  const planner = readFileSync(PLANNER_FILE, 'utf-8');
  const parsed = parseText(planner);

  writeExpectedPacks(parsed);
  editModuleJson(parsed);
}

run();