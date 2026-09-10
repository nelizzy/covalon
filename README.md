# Covalon
Foundry module with compendiums for all Covalon-related resources — deities, mentors, and expeditions.

Below is a complete setup guide for anyone helping maintain this module. Follow it top to bottom once, and you'll have everything you need for every future session. If you get stuck anywhere in this guide, hit @nelizzy (Ateia) up in #pogchamp-tech-support. 

## Contents

1. [How it works](#1-how-it-works)
2. [Prerequisites](#2-prerequisites)
3. [One-time computer setup](#3-one-time-computer-setup)
4. [Getting the project files](#4-getting-the-project-files)
5. [First-time project setup](#5-first-time-project-setup)
6. [Your everyday editing workflow](#6-your-everyday-editing-workflow)
7. [Adding new images](#7-adding-new-images)
8. [Adding a new compendium](#8-adding-a-new-compendium)
9. [Making a new release](#9-making-a-new-release)
10. [Command cheat sheet](#10-command-cheat-sheet)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. How it works

This module holds all of Covalon's Foundry content as **compendiums**. Foundry itself only understands a compiled, computer-readable database format for compendiums (kept in `packs/`). We humans can't read it, and worse still, when we open a world which has the Covalon module active, *every single database* is regstered as having updated (becuase technically, it has, but only its 'last accessed' timestamp) which means it's really hard to keep track of actual changes in the awesome version-control software that is git. 

So this project keeps two versions of the content side by side:

- **`src/packs/`** — the *real* source of truth. Every document (every actor, item, journal page, scene) is its own small, human-readable YAML (.yml) file. This is what gets committed to Git, and what shows up in your diffs when you review changes.
- **`packs/`** — the compiled version Foundry actually reads from. This folder is *not* stored in Git (it's regenerated on your computer from `src/packs/`) and isn't something you should ever edit by hand.

Two small scripts convert between the two:

- `npm run repack` — builds `packs/` from `src/packs/`, so Foundry can load your latest content. **Run this after pulling changes or making any changes to the source files, *before* opening Foundry.**
- `npm run unpack` — reads whatever is in `packs/` (i.e., whatever you just edited inside Foundry) and writes it back out to `src/packs/` as YAML. **Run this after making changes to the compendiums in Foundry, *after* closing Foundry.**

So the loop, every time you sit down to work, is:

> **Pull → repack → edit in Foundry → close Foundry → unpack → commit & push**

The rest of this guide gets your computer ready to do that, then walks through doing it.

---

## 2. Prerequisites

- **Local Foundry instance**, installed on your computer.
- **A GitHub account**, and an invitation to the `covalon/covalon` repository (ask nelizzy if you don't have access yet).
- Windows 10/11 or macOS. Steps below are given for both; skip whichever doesn't apply to you.

---

## 3. One-time computer setup

You only need to do everything in this section once per computer. If you already installed GitHub Desktop for the old module, you can skip step 3a and jump to 3b.

### 3a. Install GitHub Desktop (includes Git)

Quick primer if this is all new to you (skip ahead if you've used the old module already):

**Git** is the system that keeps track of every change ever made to this project — who changed what, when, and lets everyone's changes get combined together without overwriting each other. **GitHub** is just the website that hosts the project's Git history online (`github.com/covalon/covalon`), so everyone's copy can sync through it. Neither of those is something you interact with directly.

**GitHub Desktop** is the app that does. It's a normal-looking application with buttons, not a command line — it gives you a visual way to download everyone else's latest changes ("pull"), see exactly what you've changed, and upload your own changes ("push"), without ever having to type a Git command. It also comes bundled with Git itself and with Git LFS (used below for images), so installing it covers all three.

If you already installed GitHub Desktop for the old module, you can skip straight to confirming you're signed in below.

**Windows and Mac:**

1. Go to [desktop.github.com](https://desktop.github.com) and click the download button for your operating system.
2. Run the installer and follow the prompts (Windows: run the `.exe`; Mac: drag the app into Applications).
3. Open GitHub Desktop and sign in with your GitHub account when prompted (**File/GitHub Desktop menu → Options/Preferences → Accounts → Sign in**). If you don't have a GitHub account yet, it'll offer to let you create one — free, just an email and a username.

If you already have GitHub Desktop installed from before, just open it and confirm you're signed in.

### 3b. Confirm Git LFS is set up

This project stores every image (`.png`, `.jpg`, `.webp`, etc.) through **Git LFS**, a Git extension for handling large files efficiently. GitHub Desktop installs Git LFS automatically, but it needs to be switched on once per computer.

1. Open **GitHub Desktop**.
2. Go to the menu bar: **File → Options** (Windows) or **GitHub Desktop → Preferences** (Mac).
3. Under the **Git** tab, you'll typically see LFS already configured. If GitHub Desktop ever prompts you with something like *"This repository uses Git LFS, initialize it now?"* when you open the Covalon repo later on, click **Yes/Initialize**.

You can sanity-check this later (after cloning the repo) by opening a terminal in the project folder and running:

```
git lfs install
```

It should print something like `Git LFS initialized.` — that's a good sign either way, so it's safe to run even if it's already set up.

**Mac only — a one-time popup the first time you run any `git` command.** If this is the first time you've ever typed a `git` command in Terminal on this Mac, you'll get a system popup saying something like *"'git' requires the Command Line Tools. Would you like to install them now?"* This is normal and expected — click **Install**, wait for it to finish (a few minutes, needs internet), then run the `git lfs install` command again. You only ever see this once per Mac.

### 3c. Install Node.js

Node.js runs the small helper scripts this project uses to convert content back and forth (the "repack"/"unpack" steps above), and to optimize images.

**Windows only — turn on Developer Mode.** Some of the tools `npm install` pulls in need to create what's called a "symlink," and Windows blocks that for regular (non-admin) users unless Developer Mode is switched on — it shows up as an error mentioning `EPERM` or "symlink" if you hit it. Worth just turning it on now rather than waiting to hit the error:

1. Open **Settings → Privacy & Security → For developers** (or search "Developer Mode" in the Start menu).
2. Toggle **Developer Mode** on.


**Windows and Mac:**

1. Go to [nodejs.org](https://nodejs.org).
2. Click the big download button for the **LTS** version (LTS = "Long Term Support"; it's the stable, recommended one — don't pick "Current").
3. Run the installer, accepting all the defaults (keep every checkbox as-is, including "Add to PATH").
4. Restart your computer after installing (this makes sure Node.js is available everywhere it needs to be).

**To check it worked:** open a terminal — Command Prompt or PowerShell on Windows, Terminal on Mac — and type:

```
node -v
```

You should see a version number like `v22.x.x` or higher. If you instead get an error like "command not found" or "not recognized," restart your computer and try again; if it still fails, the installer likely needs to be re-run.

### 3d. Install Visual Studio Code (VS Code)

VS Code is a free code/text editor. You'll mostly use it for opening a terminal that's already pointed at the right folder, and occasionally peeking at a file.

**Windows and Mac:**

1. Go to [code.visualstudio.com](https://code.visualstudio.com) and click **Download**.
2. Run the installer.
   - **Windows:** on the "Select Additional Tasks" screen, tick **"Add to PATH"** if it isn't already checked. The other defaults are fine.
   - **Mac:** drag the app into Applications, then open it once from there.

You now have everything installed: GitHub Desktop (+ Git + Git LFS), Node.js, and VS Code. Yippee! 🥳

### 3e. Get comfortable opening a terminal in VS Code

You'll be opening a terminal a lot in this guide, so it's worth getting used to it now. A "terminal" is just a text-based way to type commands instead of clicking buttons. Super handy when you get used to it!

Once you have a folder open in VS Code (**File → Open Folder…**):

- **Windows:** press `` Ctrl + ` ``
- **Mac:** press `` Cmd + ` ``

Or **Terminal → New Terminal** from the menu bar at the top.

Either way, a panel opens at the bottom of the window with a blinking cursor — that's the terminal, and it's already sitting in whatever folder you have open in VS Code, so you can just start typing. Every command in this guide (`npm install`, `npm run repack`, etc.) gets typed there, followed by Enter.

---

## 4. Getting the project files

We're setting things up so Foundry reads the project folder *directly*. That means where you clone the repo matters.

### 4a. Find your Foundry "Data" folder

This is the folder Foundry stores all its user content in — worlds, systems, and modules.

- **Windows:** `%localappdata%\FoundryVTT\Data` — you can jump straight there by pressing `Win + R`, pasting `%localappdata%\FoundryVTT\Data`, and hitting Enter; or right click the icon on the taskbar and click User Data.
- **Mac:** `~/Library/Application Support/FoundryVTT/Data` — in Finder, press `Cmd + Shift + G` and paste that path.

Inside that `Data` folder you should see folders named `worlds`, `systems`, and `modules`. If you're not sure this is the right folder, you can also check it from inside Foundry: **Configuration and Setup → Application Settings/Options**, where the "Data Path" is shown.

### 4b. Clone the repository straight into `Data/modules`

"Cloning" just means downloading a full copy of the repository, connected to GitHub so you can pull updates and push your changes.

1. Open **GitHub Desktop**.
2. Go to **File → Clone Repository**.
3. Click the **GitHub.com** tab, find `covalon/covalon` in the list (or paste the URL `https://github.com/covalon/covalon.git` under the **URL** tab), and select it.
4. For **Local Path**, click **Choose...** and browse directly into your Foundry `Data/modules` folder from step 4a (e.g. `...\FoundryVTT\Data\modules` on Windows, or `.../FoundryVTT/Data/modules` on Mac). GitHub Desktop will create one folder called `covalon` inside there — make sure it lands directly in `modules`, not nested a level too deep (i.e. you want `modules/covalon`, not `modules/covalon/covalon`).
5. Click **Clone**.

This will take a little while the first time, since it also has to download every image through Git LFS.

**How to check it worked:** inside `Data/modules` you should now have a `covalon` folder, and inside *that*, files like `module.json`, `package.json`, and folders like `images`, `src`, `scripts`. Open a couple of files under `images/` — they should open as actual pictures, not tiny text files. (If they *are* tiny text files full of gibberish, see [Troubleshooting](#11-troubleshooting) — that means Git LFS didn't download the real images.)

---

## 5. First-time project setup

Now that the files are on your computer, you need to install the project's own small toolset and build the compendiums so Foundry can read them. You'll do this once now, and the "repack" part again every time you pull new changes (see [section 6](#6-your-everyday-editing-workflow)).

1. Open **VS Code**.
2. **File → Open Folder…**, and select the `covalon` folder you cloned in step 4b (the one containing `module.json`).
3. Open a terminal inside VS Code: **Terminal → New Terminal** (or `` Ctrl+` `` / `` Cmd+` ``). This opens a command line that's already sitting in the right folder — you'll use this terminal for every command in this guide from now on.
4. Type the following and press Enter:

   ```
   npm install
   ```

   This downloads the small set of tools the project's scripts depend on. It only needs to be re-run later if `package.json` or `package-lock.json` ever change (a pull will tell you if files changed, but running it again never hurts).

5. Then run:

   ```
   npm run repack
   ```

   This builds the `packs/` folder Foundry actually reads, from the YAML source files in `src/packs/`. You should see a line printed for each compendium ("Packing …").

6. Launch **Foundry VTT** itself (the desktop app), go to **Add-on Modules**, and confirm **Covalon** appears in the list and is enabled for your world. Load your world and check that the Covalon compendiums show up with content in them.

7. **Lock the module — important, don't skip this.** While you're on the **Add-on Modules** screen, right-click **Covalon** and choose **Lock Module**. Foundry occasionally shows an "Update" button next to modules when a newer version exists on GitHub (see [section 9](#9-making-a-new-release)) — but for you, this folder *is* your Git clone, not something Foundry should manage. If you ever click that Update button, Foundry will download and overwrite the whole folder with a release build, silently wiping out your local Git history and any uncommitted work in it. Locking the module removes the Update button entirely and stops that from happening by accident. You only need to do this once — it stays locked from here on.

If all that worked, you're fully set up. From here on, you don't need to repeat sections 3–5 — only [section 6](#6-your-everyday-editing-workflow) below.

---

## 6. Your everyday editing workflow

Every time you sit down to add or edit content, follow these steps **in order**. Skipping the order (especially editing while Foundry and your terminal are fighting over the same files) is the most common source of problems.

### Step 1 — Get the latest changes

1. Open **GitHub Desktop**.
2. Make sure it's showing the `covalon` repository (top-left dropdown) and you're on the `master` branch.
3. Click **Fetch origin**, then **Pull origin** if it appears (this downloads everyone else's latest changes onto your computer).

### Step 2 — Rebuild the compendiums

1. Open **VS Code**, with the `covalon` folder open (it should remember it from last time — **File → Open Recent**).
2. Open a terminal (**Terminal → New Terminal**) and run:

   ```
   npm run repack
   ```

   Do this **every single time** after pulling, even if you don't think anything changed — it makes sure the compendiums Foundry loads match the latest content, including anyone else's edits.

### Step 3 — Edit in Foundry

1. Launch **Foundry VTT**, open your world.
2. Make your edits — add journal pages, tweak actors, adjust items, whatever the task calls for — directly inside Foundry's compendiums, as normal.
3. When you're done for this session, **fully close Foundry** (quit the world and close the application). This matters: Foundry keeps a lock on the compendium files while it's running, and the next step can't read them properly until it's closed.

### Step 4 — Convert your edits back to source files

1. Back in the VS Code terminal, run:

   ```
   npm run unpack
   ```

   This reads whatever you just changed in `packs/` and writes it back out as readable YAML files in `src/packs/` — the format Git can actually track and diff.

### Step 5 — Review, commit, and push

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

## 7. Adding new images

If you added or replaced any images while editing in Foundry, run one more command **before** the "commit and push" step (Step 5 above) — after unpacking, before committing:

```
npm run assets
```

This compresses new images to a reasonable file size and updates any references to them in `src/packs/`. It also keeps a backup of the original, unmodified files in an `images_original/` folder (which isn't uploaded to Git — it's just a local safety net for you), and writes a size comparison to `image-comparison.csv`. You don't need to do anything with either of those; just make sure `npm run assets` has run before you commit.

---

## 8. Adding a new compendium

Whenever something needs a brand-new compendium — a new expedition location, a new folder of items, whatever — it all starts in one file: `COMPENDIUM_PLANNER.txt`, at the top of the project. This is the plan for every folder and pack in the module; editing it is how you tell the project "this new thing should exist."

### Editing the planner

Open `COMPENDIUM_PLANNER.txt` in VS Code. The comments at the top of the file (the lines starting with `#`) explain the format in detail — read through those first. The short version:

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

## 9. Making a new release

Everything above gets content into the `master` branch on GitHub — but that's not what players' Foundry installs actually pull updates from. Foundry checks a **GitHub release**, which is a separate, versioned snapshot that GitHub Actions builds automatically whenever one is published. Cutting a release is how "what's on `master`" becomes "what everyone's game can update to."

This part happens on github.com in your browser, not in GitHub Desktop — Desktop doesn't have a way to create releases itself.

1. Make sure everything you want in the release is committed and pushed to `master` (follow section 6 as normal).
2. Go to the repository on github.com (`github.com/covalon/covalon`) and click **Releases** (on the right-hand side of the file list).
3. Click **Draft a new release**. (Make sure **Target** is set to `master`.)
4. Click the **Choose a tag** dropdown, type a new version number, and click **Create new tag**. This project uses `v` + semantic version numbers, in the form `vMAJOR.MINOR.PATCH` (e.g. the last release was `v2.8.5`). Which number to bump depends on what's in the release:

   - **Patch** (`2.8.5` → `2.8.6`) — editing existing content. Fixing typos, rewriting a journal entry, tweaking an NPC's stats, swapping an image — anything that changes what's already there without adding or removing whole compendiums.
   - **Minor** (`2.8.5` → `2.9.0`) — adding or removing content. A new expedition, a new compendium folder, a big batch of new actors/items — anything from [section 8](#8-adding-a-new-compendium) counts here.
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

After editing, save, commit (see the commit message guidance in [section 6](#6-your-everyday-editing-workflow)), push, and cut a release as above.

---

## 10. Command cheat sheet

All of these are run from a terminal opened inside the `covalon` folder (e.g. VS Code's **Terminal → New Terminal**).

| Command | When to run it | What it does |
|---|---|---|
| `npm install` | Once, after first cloning (or if told to) | Installs the project's tools |
| `npm run repack` | Every time, after pulling, before opening Foundry | Builds `packs/` (for Foundry) from `src/packs/` (the source files) |
| `npm run unpack` | Every time, after closing Foundry, before committing | Converts your Foundry edits in `packs/` back into `src/packs/` YAML |
| `npm run assets` | Only if you added/changed images, after unpacking | Compresses images and updates references |
| `npm run comp` | After saving changes to `COMPENDIUM_PLANNER.txt` | Regenerates the compendium/folder list in `module.json` to match |

---

## 11. Troubleshooting

**Images look like tiny broken files, or Foundry shows missing/broken image icons.**
This almost always means Git LFS didn't actually download the real image files — you just have small placeholder "pointer" files instead. Open a terminal in the `covalon` folder and run:

```
git lfs install
git lfs pull
```

Then restart Foundry. If that doesn't fix it, try **Repository → Pull** again from GitHub Desktop.

**`npm run unpack` (or `repack`) fails with a file lock / permission error.**
Foundry (or sometimes VS Code, if a file is open) is still holding the files open. Fully quit Foundry VTT (not just close the world — quit the application), close any compendium-related files open in VS Code, and try again.

**`npm` / `node` isn't recognized as a command.**
Node.js either isn't installed, or your computer hasn't picked up the change yet. Restart your computer and try again; if it still fails, re-run the Node.js installer from [section 3c](#3c-install-nodejs).

**GitHub Desktop shows a scary-looking merge conflict.**
Stop and don't guess — hit @nelizzy up in #pogchamp-tech-support with a screenshot before doing anything else. This usually means two people edited the same document; it's easy to fix with a bit of care, but easy to make worse by clicking around blindly.

**`npm install` fails with an error mentioning `EPERM` or `symlink` (Windows).**
This is the Developer Mode thing from [section 3c](#3c-install-nodejs) — turn it on (Settings → Privacy & Security → For developers → Developer Mode), then run `npm install` again.

**You're not sure if your changes actually made it to GitHub.**
Open GitHub Desktop, click **History** (next to Changes), and confirm your commit is at the top with a green **Pushed** indicator, not just committed locally. If in doubt, click **Push origin** again — it's harmless if there's nothing new to push.

**You published a release, but `module.json`/`module.zip` never showed up on it.**
Go to the repo's **Actions** tab on github.com and check the "Release Creation" run for that release — a red X means it failed partway through, and clicking into it shows which step and why. Common culprits are a syntax mistake in `COMPENDIUM_PLANNER.txt` or `module.json` that only breaks under a clean install (the workflow runs `npm ci` from scratch, so a problem hiding on your machine because you never re-ran `npm install` can show up here first).

**Something looks wrong and none of the above matches.**
Don't try to "fix" it by deleting the `covalon` folder and re-cloning unless you're sure your own uncommitted work is safe — ask first. It's much easier to help debug a stuck state than to reconstruct lost edits.
