# Covalon
Foundry module with compendiums for all Covalon-related resources — deities, mentors, and expeditions.

> **New to this project, or migrating from the old `covalon/covalon`?** Head to **[INSTALL.md](INSTALL.md)** first. It's all the one time setup steps needed to get your computer ready. Come back here once that's done; this file covers everything you'll actually use day to day. 

If you get stuck anywhere, hit @nelizzy (Ateia) up in #pogchamp-tech-support.

## Contents

1. [How it works](#1-how-it-works)
2. [Your everyday editing workflow](#2-your-everyday-editing-workflow)
3. [Adding new images](#3-adding-new-images)
4. [Adding a new compendium](#4-adding-a-new-compendium)
5. [Making a new release](#5-making-a-new-release)
6. [Command cheat sheet](#6-command-cheat-sheet)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. How it works

This module holds all of Covalon's Foundry content as **compendiums**. Foundry itself only understands a compiled, computer-readable database format for compendiums (kept in `packs/`). We humans can't read it, and worse still, when we open a world which has the Covalon module active, *every single database* is regstered as having updated (becuase technically, it has, but only its 'last accessed' timestamp) which means it's really hard to keep track of actual changes in the awesome version-control software that is git. 

So this project keeps two versions of the content side by side:

- **`src/packs/`** — the *real* source of truth. Every document (every actor, item, journal page, scene) is its own small, human-readable YAML (.yml) file. This is what gets committed to Git, and what shows up in your diffs when you review changes.
- **`packs/`** — the compiled version Foundry actually reads from. This folder is *not* stored in Git (it's regenerated on your computer from `src/packs/`) and isn't something you should ever edit by hand.

Two small scripts convert between the two:

- `npm run repack` — builds `packs/` from `src/packs/`, so Foundry can load your latest content. This runs **automatically** for you right after a pull (more on that in [section 2](#2-your-everyday-editing-workflow)). You'd only run it by hand if you manually edit the source files and need to see it in Foundry.
- `npm run unpack` — reads whatever is in `packs/` (i.e., whatever you just edited inside Foundry) and writes it back out to `src/packs/` as YAML. **Run this after making changes to the compendiums in Foundry, *after* closing Foundry.**

So the loop, every time you sit down to work, is:

> **Pull → (auto) repack → edit in Foundry → close Foundry → unpack → commit & push**

If you haven't set your computer up for this project yet, see **[INSTALL.md](INSTALL.md)** first — everything below assumes that's done.

---

## 2. Your everyday editing workflow

Every time you sit down to add or edit content, follow these steps **in order**. Skipping the order (especially editing while Foundry and your terminal are fighting over the same files) is the most common source of problems.

### Step 1 — Get the latest changes

1. Open **GitHub Desktop**.
2. Make sure it's showing the `covalon` repository (top-left dropdown) and you're on the `master` branch.
3. Click **Fetch origin**, then **Pull origin** if it appears (this downloads everyone else's latest changes onto your computer).

This project has a git hook set up (via a tool called Husky) that automatically runs `npm run repack` for you the moment a pull finishes, so the compendiums Foundry reads always match whatever was just pulled. You'll see some output from it (either in GitHub Desktop directly, or a terminal window that flashes up) saying something like "Pulled changes detected — rebuilding Foundry compendiums..." — just let it finish before opening Foundry.

If you ever don't see that happen, or Foundry looks like it's missing content you know was just pulled, run it by hand as a fallback: open a terminal in the `covalon` folder (see [INSTALL.md, section 2e](INSTALL.md#2e-get-comfortable-opening-a-terminal-in-vs-code)) and run:

```
npm run repack
```

### Step 2 — Edit in Foundry

1. Launch **Foundry VTT**, open your world.
2. Make your edits — add journal pages, tweak actors, adjust items, whatever the task calls for — directly inside Foundry's compendiums, as normal.
3. When you're done for this session, **fully close Foundry** (quit the world and close the application). This matters: Foundry keeps a lock on the compendium files while it's running, and the next step can't read them properly until it's closed.

### Step 3 — Convert your edits back to source files

1. Back in a VS Code terminal, run:

   ```
   npm run unpack
   ```

   This reads whatever you just changed in `packs/` and writes it back out as readable YAML files in `src/packs/` — the format Git can actually track and diff.

### Step 4 — Review, commit, and push

1. Open **GitHub Desktop**. You should see your changes listed on the left as a list of added/changed/removed files (under `src/packs/...`).
2. Skim the list — it's normal to see files for whatever you actually touched, and you generally shouldn't see changes to files under `packs/` itself (that folder isn't tracked by Git at all) or under `images_original/`. If you see a file you don't recognize touching, or a huge pile of unrelated changes, stop and ask before committing rather than shrugging it off.
3. At the bottom left, write a short summary in the **Summary** box (see below for what makes a good one).
4. Click **Commit to master**.
5. Click **Push origin** (top of the window) to upload your commit to GitHub for everyone else.

That's the full loop. Next time, start again from Step 1.

#### Writing a good commit message

A commit message is just a note to your future self (and everyone else) explaining what a change was and why, so when future you is trying to figure out what happened when, they don't have to go through millions of unhelpful messages like "oh shit" "oops" "fixing!" 🙃

(This is wonderful, helpful guidance, but honestly, if you don't do it... it's fine. 🤭 I certainly forget sometimes.)

- **The Summary line** should say what changed, briefly, as if finishing the sentence "This commit will…" — e.g. "Add Whitespire tavern scene and two NPCs", "Fix Verndhelt journal typos", "Rework Briarmurk expedition intro".
- **Optional: Description** (right below Summary) for anything the one-liner doesn't cover, like WHY you did what you did, or any other special information. This is extra credit stuff, so only do it if you need to earn brownie points with future you.
- **One commit per logical chunk of work**, not one giant commit for an entire session. If you added a scene *and* fixed an unrelated typo elsewhere, GitHub Desktop lets you tick/untick individual files before committing — split those into two commits with two summaries rather than mashing them into one vague one.
- **Only commit what you meant to change.** This ties back to point 2 above — the compendium `src/packs/` files you touched should roughly match what you remember doing. If something else is staged too, figure out why before committing it.

> **A note on working together:** try to avoid two people editing the exact same document (e.g. the same NPC or the same journal page) in the same session — Git can't merge conflicting changes to the same compendium document automatically, and untangling it isn't simple. If you're not sure who's working on what, a quick message in chat before you start goes a long way. If you do end up with a conflict when pulling or pushing, stop and hit @nelizzy up in #pogchamp-tech-support rather than trying to force through it.

---

## 3. Adding new images

If you added or replaced any images (which should be in the `/images` folder, ideally nicely sorted!!) run one more command **before** the "commit and push" step (Step 4 above) — after unpacking, before committing:

```
npm run assets
```

This compresses new images to a reasonable file size and updates any references to them in `src/packs/`. It also keeps a backup of the original, unmodified files in an `images_original/` folder (which isn't uploaded to Git — it's just a local safety net for you), and writes a size comparison to `image-comparison.csv`. You don't need to do anything with either of those; just make sure `npm run assets` has run before you commit.

---

## 4. Adding a new compendium

Whenever something needs a brand-new compendium — a new expedition location, a new folder of items, whatever — it all starts in one file: [`COMPENDIUM_PLANNER.txt`](COMPENDIUM_PLANNER.txt), at the top of the project. This is the plan for every folder and pack in the module; editing it is how you tell the project "this new thing should exist."

### Editing the planner

Open [`COMPENDIUM_PLANNER.txt`](COMPENDIUM_PLANNER.txt) in VS Code. The comments at the top of the file (the lines starting with `#`) explain the format in detail — read through those first. The short version:

- A line starting with `/` is a **folder** (e.g. `/Whitespire`).
- Any other line is a **compendium pack**, and has to be one of: `actors`, `items`, `scenes`, `journals`, `macros`, `rolltables`, `playlists`, `adventures`.
- Put a `*` in front of a pack type (e.g. `*actors`) to make it observable by players. Leave the `*` off and only the GM can see it.
- Add `: "Some Label"` after a pack type to give it a custom name instead of the default (e.g. `items: "Actions"`).

**Spacing is what tells it how things nest, so it has to be exact.** Every level of nesting is two spaces — a pack sits two spaces further in than the folder it belongs to, and a subfolder sits two spaces further in than its parent folder. If you copy/paste a block to use as a starting point for something new, double-check the indentation lined up the way you expect once you're done — a line that's off by a space or two will end up in the wrong folder, or not parse as intended.

Want to disable a folder? Put a `#` in front of its line to comment it out — there's already an example of this in the file (`# /Events`).

The comments also explain exactly how the final compendium names get built from the folder structure (folder path + label, with a couple of naming shortcuts to avoid repeating words, and a special case for Expeditions) — worth a read if you're naming something new and want to predict what it'll end up being called.

### To Foundry!

Once you've saved your changes to `COMPENDIUM_PLANNER.txt`, run:

```
npm run comp
```

This reads the planner and rewrites `module.json`'s compendium list to match — creating whatever new packs and folders you added, and putting everything in its right place. You'll see a line telling you how many packs and folders it set up.

From there, it's the same loop as always: `npm run repack`, open Foundry (your new folders and compendiums will be sitting there, empty and ready), add content, close Foundry, `npm run unpack`, then commit and push.

> **One thing to watch for:** `npm run comp` rewrites the *whole* compendium list each time, so if two people edit `COMPENDIUM_PLANNER.txt` at the same time, whoever pushes second can end up overwriting the other's structural changes.

---

## 5. Making a new release

Everything above gets content into the `master` branch on GitHub — but that's not what players' Foundry installs actually pull updates from. Foundry checks a **GitHub release**, which is a separate, versioned snapshot that GitHub Actions builds automatically whenever one is published. Cutting a release is how "what's on `master`" becomes "what everyone's game can update to."

This part happens on github.com in your browser, not in GitHub Desktop — Desktop doesn't have a way to create releases itself.

1. Make sure everything you want in the release is committed and pushed to `master` (follow section 2 as normal).
2. Go to the repository on github.com (`github.com/covalon/covalon`) and click **Releases** (on the right-hand side of the file list).
3. Click **Draft a new release**. (Make sure **Target** is set to `master`.)
4. Click the **Choose a tag** dropdown, type a new version number, and click **Create new tag**. This project uses `v` + semantic version numbers, in the form `vMAJOR.MINOR.PATCH` (e.g. the last release was `v2.8.5`). Which number to bump depends on what's in the release:

   - **Patch** (`2.8.5` → `2.8.6`) — editing existing content. Fixing typos, rewriting a journal entry, tweaking an NPC's stats, swapping an image — anything that changes what's already there without adding or removing whole compendiums.
   - **Minor** (`2.8.5` → `2.9.0`) — adding or removing content. A new expedition, a new compendium folder, a big batch of new actors/items — anything from [section 4](#4-adding-a-new-compendium) counts here.
   - **Major** (`2.8.5` → `3.0.0`) — upgrading to a new Foundry version. Reserved for when the module itself is being bumped to support a new Foundry major release (see below) — not something that happens from day-to-day content work.
5. Fill in a **Release title** (often just the version number) and a short description of what changed — you can click **Generate release notes** to have GitHub draft one from the commits since the last release, then tidy it up.
6. Click **Publish release**.

Publishing triggers a GitHub Actions workflow (you can watch it run under the repo's **Actions** tab) that compresses assets, repacks the compendiums, and builds a `module.json` and `module.zip` from the current `master` — then attaches both to the release you just published, with the version and download links pointed at that release. That's the actual file Foundry reads to check for updates, so nothing you did locally (your own `module.json`, your own built `packs/`) needs to match it exactly — the workflow builds the real thing fresh, from source, every time.

Give the workflow a few minutes, then check the release page — once `module.json` and `module.zip` show up as attached files, the release is live and existing installs will see an update available.

### Bumping compatibility (Foundry or PF2e version updates)

Foundry itself and the PF2e system both get updated independently of this module, and `module.json` tells Foundry which versions of each this module is expected to work with. This is the one thing in `module.json` that's edited by hand rather than generated by a script, so if Foundry or PF2e ever puts out a new version, this is where that gets reflected before cutting a release for it.

Open `module.json` in VS Code and look for two spots:

- Near the top, a `"compatibility"` block — this is for **Foundry** itself:

  ```json
  "compatibility": {
    "minimum": "13",
    "verified": "13.351"
  },
  ```

- Further down, inside `"relationships" → "systems"`, a matching `"compatibility"` block for the **PF2e system**:

  ```json
  "compatibility": {
    "minimum": "7.0",
    "verified": "7.12.2"
  }
  ```

`"verified"` is the highest version you've actually confirmed the module still works on — bump this whenever you've tested against a newer Foundry or PF2e release and nothing broke. It just means our module won't be the stinky yellow color instead of green.
`"minimum"` is the oldest version still supported. Raising `"minimum"` is the kind of change that calls for a **major** version bump on the next release, since anyone still on an older Foundry/PF2e would no longer be able to run the module at all. Usually, if we're updating the [Covalon Foundry Standard in #gms-guide](https://discord.com/channels/802423566196539412/1033738928416632842/1512866443128209549), we should update it here too.

After editing, save, commit (see the commit message guidance in [section 2](#2-your-everyday-editing-workflow)), push, and cut a release as above.

---

## 6. Command cheat sheet

All of these are run from a terminal opened inside the `covalon` folder (e.g. VS Code's **Terminal → New Terminal**).

| Command | When to run it | What it does |
|---|---|---|
| `npm install` | Once, after first cloning (or if told to) | Installs the project's tools |
| `npm run repack` | Runs automatically after every pull (via a git hook) — only run by hand as a fallback, or after first-time setup | Builds `packs/` (for Foundry) from `src/packs/` (the source files) |
| `npm run unpack` | Every time, after closing Foundry, before committing | Converts your Foundry edits in `packs/` back into `src/packs/` YAML |
| `npm run assets` | Only if you added/changed images, after unpacking | Compresses images and updates references |
| `npm run comp` | After saving changes to `COMPENDIUM_PLANNER.txt` | Regenerates the compendium/folder list in `module.json` to match |

---

## 7. Troubleshooting

**Images look like tiny broken files, or Foundry shows missing/broken image icons.**
This almost always means Git LFS didn't actually download the real image files — you just have small placeholder "pointer" files instead. Open a terminal in the `covalon` folder and run:

```
git lfs install
git lfs pull
```

Then restart Foundry. If that doesn't fix it, try **Repository → Pull** again from GitHub Desktop.

**Foundry doesn't seem to show content you know was just pulled.**
The automatic repack (see [section 2](#2-your-everyday-editing-workflow)) may not have run — this can happen if `npm install` was never run in this clone (so the automation was never switched on), or occasionally with certain pull settings. Just run it by hand: open a terminal in the `covalon` folder and run `npm run repack`, then reopen Foundry.

**`npm run unpack` (or `repack`) fails with a file lock / permission error.**
Foundry (or sometimes VS Code, if a file is open) is still holding the files open. Fully quit Foundry VTT (not just close the world — quit the application), close any compendium-related files open in VS Code, and try again.

**`npm` / `node` isn't recognized as a command.**
Node.js either isn't installed, or your computer hasn't picked up the change yet. Restart your computer and try again; if it still fails, re-run the Node.js installer from [INSTALL.md, section 2c](INSTALL.md#2c-install-nodejs).

**GitHub Desktop shows a scary-looking merge conflict.**
Stop and don't guess — hit @nelizzy up in #pogchamp-tech-support with a screenshot before doing anything else. This usually means two people edited the same document; it's easy to fix with a bit of care, but easy to make worse by clicking around blindly.

**`npm install` fails with an error mentioning `EPERM` or `symlink` (Windows).**
This is the Developer Mode thing from [INSTALL.md, section 2c](INSTALL.md#2c-install-nodejs) — turn it on (Settings → Privacy & Security → For developers → Developer Mode), then run `npm install` again.

**You're not sure if your changes actually made it to GitHub.**
Open GitHub Desktop, click **History** (next to Changes), and confirm your commit is at the top with a green **Pushed** indicator, not just committed locally. If in doubt, click **Push origin** again — it's harmless if there's nothing new to push.

**You published a release, but `module.json`/`module.zip` never showed up on it.**
Go to the repo's **Actions** tab on github.com and check the "Release Creation" run for that release — a red X means it failed partway through, and clicking into it shows which step and why. Common culprits are a syntax mistake in `COMPENDIUM_PLANNER.txt` or `module.json` that only breaks under a clean install (the workflow runs `npm ci` from scratch, so a problem hiding on your machine because you never re-ran `npm install` can show up here first).

**Something looks wrong and none of the above matches.**
Don't try to "fix" it by deleting the `covalon` folder and re-cloning unless you're sure your own uncommitted work is safe — ask first. It's much easier to help debug a stuck state than to reconstruct lost edits.
