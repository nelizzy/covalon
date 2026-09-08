import { SCHEMA_VERSION } from "./v.json";

Hooks.on("init", async () => {
  await game.settings.register('covalon', 'packSchemaVersion', {
    name: 'Pack Schema',
    default: 0,
    scope: 'world'
  })
})

Hooks.on("ready", async () => {
  await run();
});

/*

[`covalon.${compendiumName}`]: {
  folder: FOLDER_ID
}

*/

function recursiveFilter(folder) {
  if (folder.folder === null) return false;
  if (folder.folder.name === "Covalon") return true;

  return recursiveFilter(folder.folder);
}

async function run() {
  // check flag for schema update
  const currentVersion = await game.settings.get('covalon', 'packSchemaVersion');

  if (currentVersion >= SCHEMA_VERSION) return;

  // get all covalon specific folders
  const oldFolders = game.folders.filter(recursiveFilter);

  // tear down folders
  Folder.deleteDocuments([oldFolders.map(f => f.id)])

  // rebuild folders


  // move all packs into folders
  // const covaPacks = game.packs.filter(p => p.metadata.packageName === "covalon");
  // covaPacks.forEach( p => p.setFolder() )

  // write new layout to compendiumConfiguration

  // set schema flag
  await game.settings.set('covalon', 'packSchemaVersion', SCHEMA_VERSION)
}