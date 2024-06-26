import { Platform } from "@macrograph/interface";
import { readTextFile, writeTextFile } from "@tauri-apps/api/fs";
import { save, open, ask } from "@tauri-apps/api/dialog";
import { Core, SerializedProject } from "@macrograph/runtime";
import { Accessor } from "solid-js";
import { Setter } from "solid-js";

export function createPlatform(props: {
	projectUrl: Accessor<string | null>;
	setProjectUrl: Setter<string | null>;
	core: Core;
}) {
	return {
		projectPersistence: {
			async saveProject(saveAs = false) {
				let url = !saveAs ? props.projectUrl() : null;

				if (url === null) {
					url = await save({
						defaultPath: "macrograph-project.json",
						filters: [{ name: "JSON", extensions: ["json"] }],
					});
				}

				if (url === null) return;

				const name = url.split("/").pop()?.split(".")[0];
				if (name) props.core.project.name = name;

				await writeTextFile(
					url,
					JSON.stringify(props.core.project.serialize(), null, 4),
				);

				props.setProjectUrl(url);
			},
			async loadProject() {
				if (await ask("Woudl you like to save this project?"))
					await this.saveProject();

				const url = await open({
					filters: [{ name: "JSON", extensions: ["json"] }],
					multiple: false,
				});

				if (typeof url !== "string") return;

				const data = await readTextFile(url);

				const serializedProject = SerializedProject.parse(JSON.parse(data));

				await props.core.load(serializedProject);

				props.setProjectUrl(url);
			},
			get url() {
				return props.projectUrl();
			},
		},
	} satisfies Platform;
}
