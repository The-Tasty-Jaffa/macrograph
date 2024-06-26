import { createMutable } from "solid-js/store";
import { z } from "zod";

import { Node } from "./Node";
import { Graph } from "./Graph";
import { XY, Size } from "../utils";
import { SerializedCommentBox } from "./serialized";

export interface CommentBoxArgs {
	id: number;
	graph: Graph;
	position: XY;
	size: XY;
	text: string;
}

export type GetNodeSize = (node: Node) => Size | undefined;

export class CommentBox {
	id: number;
	graph: Graph;
	position: XY;
	size: XY;
	text: string;

	constructor(args: CommentBoxArgs) {
		this.id = args.id;
		this.graph = args.graph;
		this.position = args.position;
		this.size = args.size;
		this.text = args.text;

		return createMutable(this);
	}

	getNodes(nodes: IterableIterator<Node>, getNodeSize: GetNodeSize) {
		const { size, position } = this;

		const ret = new Set<Node>();

		for (const node of nodes) {
			const nodePosition = node.state.position;

			if (nodePosition.x < position.x || nodePosition.y < position.y) continue;

			const nodeSize = getNodeSize(node);
			if (!nodeSize) continue;

			if (
				nodePosition.x + nodeSize.width > position.x + size.x ||
				nodePosition.y + nodeSize.height > position.y + size.y
			)
				continue;

			ret.add(node);
		}

		return ret;
	}

	serialize(): z.infer<typeof SerializedCommentBox> {
		return {
			id: this.id,
			position: this.position,
			size: this.size,
			text: this.text,
		};
	}

	static deserialize(
		graph: Graph,
		data: z.infer<typeof SerializedCommentBox>,
	): CommentBox | null {
		return new CommentBox({
			graph,
			id: data.id ?? graph.generateId(),
			position: data.position,
			size: data.size,
			text: data.text,
		});
	}
}
