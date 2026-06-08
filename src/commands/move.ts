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
        const sourceBaseName = args.from.split("/").filter(Boolean).pop() ?? "";
        const destinationPath = args.to.endsWith("/")
            ? `${args.to}${sourceBaseName}`
            : args.to;

        if (args.from === destinationPath) {
            this.log(`Source and destination are identical: ${args.from}`);
            return;
        }

        // Confirm unless --yes
        if (!flags.yes) {
            const readline = await import("node:readline");
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stderr,
            });

            const confirmed = await new Promise<boolean>((resolve) => {
                rl.question(`Move "${args.from}" -> "${destinationPath}"? [y/N] `, (answer) => {
                    rl.close();
                    resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
                });
            });

            if (!confirmed) {
                this.log("Aborted.");
                return;
            }
        }

        const dfm = await createDFM(flags.verbose);
        try {
            if (typeof (dfm as any).move !== "function") {
                this.error("LiveSync API mismatch: move() is unavailable in DirectFileManipulator instance");
            }

            const files = await listFiles(dfm);

            const source = files.find(f =>
                f.path === args.from ||
                f.path.toLowerCase() === args.from.toLowerCase()
            );

            if (!source) {
                this.error(`File not found: ${args.from}`);
            }

            const destination = files.find(f =>
                f.path === destinationPath ||
                f.path.toLowerCase() === destinationPath.toLowerCase()
            );

            if (destination && !flags.force) {
                this.error(`Destination already exists: ${destinationPath} (use --force to overwrite)`);
            }

            const moved = await dfm.move(source.path as any, destinationPath as any, flags.force);
            if (!moved) {
                this.error(`Move failed: ${source.path} -> ${destinationPath}`);
            }

            this.log(`Moved: ${source.path} -> ${destinationPath}`);
        } finally {
            await dfm.close();
        }
    }
}