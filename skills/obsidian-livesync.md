# Obsidian LiveSync — Vault CLI (Agent Skill)

`obsidian-vault` reads and writes files in an encrypted Obsidian vault.
The vault is end-to-end encrypted (AES-256-GCM) and synced via CouchDB + LiveSync.
The CLI handles all encryption/decryption transparently — just use the commands.

## Commands

### List files

```bash
# All vault files
obsidian-vault list

# Files under a specific folder
obsidian-vault list "Projects/"
obsidian-vault list "Daily Notes/" --long
```

### Read a file

```bash
obsidian-vault read "Projects/roadmap.md"
```

### Search file contents (grep)

```bash
# --path is required (scopes the search for performance)
obsidian-vault grep "sprint" --path "Projects/"
obsidian-vault grep "TODO|FIXME" --path "Projects/" -i --long
```

### Search file paths

```bash
obsidian-vault search "Projects/"
obsidian-vault search "\.md$"
```

### File metadata

```bash
obsidian-vault meta "Projects/roadmap.md"
```

### Write a new file

```bash
obsidian-vault write "Notes/hello.md" "# Hello World"
echo "content" | obsidian-vault write "Notes/hello.md"
```

### Patch a file (targeted edits)

```bash
# Replace (like Claude Code's Edit tool)
obsidian-vault patch "Notes/todo.md" --old "## Tasks" --new "## Tasks\n- New item"

# Replace all occurrences
obsidian-vault patch "Notes/doc.md" --old "typo" --new "fixed" --all

# Append
obsidian-vault patch "Notes/log.md" --append "## 2026-03-22\nEntry."
echo "content" | obsidian-vault patch "Notes/doc.md" --append
```

### Move or rename a file

```bash
# Rename a file
obsidian-vault move "Notes/draft.md" "Notes/final.md"

# Move a file into another folder
obsidian-vault move "inbox/test.md" "Notes/"

# Move and skip confirmation
obsidian-vault move "Inbox/todo.md" "Projects/App/todo.md" --yes

# Overwrite destination if it already exists
obsidian-vault move "Notes/file.md" "Archive/file.md" --force --yes
```

Flags:

```bash
-f, --force    Overwrite destination if it already exists
-v, --verbose  Show verbose LiveSync log output
-y, --yes      Skip confirmation prompt
```

### Delete a file

```bash
obsidian-vault delete "Notes/old.md" --yes
```

### Dump entire vault

```bash
obsidian-vault dump ./vault-export
```

## Agent best practices

* **Prefer `patch` over `write` for edits.** `patch --old/--new` for surgical changes, `--append` for additions. Only use `write` for new files or full replacements.
* **Use `move` for renames and folder changes.** Do not emulate a move by reading, writing, then deleting unless `move` is unavailable.
* **Use `--yes` for confirmed automated moves.** Add `--force` only when overwriting the destination is intentional.
* **Grep requires `--path`.** Always scope content searches to a folder. Full vault scans are slow.
* **Use `list` with a folder** to explore: `obsidian-vault list "Projects/"` instead of listing everything.
* **Paths are vault-relative.** Use `"Folder/note.md"`, not absolute paths.
* **Encryption is automatic.** Never interact with CouchDB directly.
* **Writes and moves are immediate.** Files appear in Obsidian within seconds via LiveSync.

## Output conventions

| Stream | Contains                                  |
| ------ | ----------------------------------------- |
| stdout | File content, paths, JSON — pipe-friendly |
| stderr | Status messages, progress, errors         |
