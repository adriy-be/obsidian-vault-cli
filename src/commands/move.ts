/**
 * move — Move/rename a file in the vault
 *
 * Usage: obsidian-vault move <from> <to>
 */

import { Command, Args, Flags } from "@oclif/core";
import { createDFM, listFiles } from "../lib/connection.ts";

export default class Move extends Command {
    static description = "Move or rename a file in the vault";

    static examples = [
        '<%= config.bin %> move "Notes/draft.md" "Notes/final.md"',
        '<%= config.bin %> move "Inbox/todo.md" "Projects/App/todo.md" --yes',
        '<%= config.bin %> move "Notes/file.md" "Archive/file.md" --force --yes',
    ];

    static args = {
        from: Args.string({
            description: "Current vault-relative file path",
            required: true,
        }),
        to: Args.string({
            description: "New vault-relative file path",
            required: true,
        }),
    };

    static flags = {
        verbose: Flags.boolean({
            char: "v",
            description: "Show verbose LiveSync log output",
            default: false,
        }),
        yes: Flags.boolean({
            char: "y",
            description: "Skip confirmation prompt",
            default: false,
        }),
        force: Flags.boolean({
            char: "f",
            description: "Overwrite destination if it already exists",
            default: false,
        }),
    };

    async run(): Promise<void> {
        const { args, flags } = await this.parse(Move);
        let success = false;

        if (args.from === args.to) {
            this.log(`Source and destination are identical: ${args.from}`);
            process.exit(0);
        }

        // Confirm unless --yes
        if (!flags.yes) {
            const readline = await import("node:readline");
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stderr,
            });

            const confirmed = await new Promise<boolean>((resolve) => {
                rl.question(`Move "${args.from}" -> "${args.to}"? [y/N] `, (answer) => {
                    rl.close();
                    resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
                });
            });

            if (!confirmed) {
                this.log("Aborted.");
                process.exit(0);
            }
        }

        const dfm = await createDFM(flags.verbose);
        try {
            const files = await listFiles(dfm);

            const source = files.find(f =>
                f.path === args.from ||
                f.path.toLowerCase() === args.from.toLowerCase()
            );

            if (!source) {
                this.error(`File not found: ${args.from}`);
            }

            const destination = files.find(f =>
                f.path === args.to ||
                f.path.toLowerCase() === args.to.toLowerCase()
            );

            if (destination && !flags.force) {
                this.error(`Destination already exists: ${args.to} (use --force to overwrite)`);
            }

            const moved = await dfm.move(source.path as any, args.to as any, flags.force);
            if (!moved) {
                this.error(`Move failed: ${source.path} -> ${args.to}`);
            }

            this.log(`Moved: ${source.path} -> ${args.to}`);
            success = true;
        } finally {
            await dfm.close();
            process.exit(success ? 0 : 1);
        }
    }
}