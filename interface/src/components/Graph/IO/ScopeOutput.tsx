import { ScopeOutput as ScopeOutputModel } from "@macrograph/runtime";
import { Show } from "solid-js";
import { usePin } from ".";

interface Props {
	output: ScopeOutputModel;
}

export const ScopeOutput = (props: Props) => {
	const { ref, active } = usePin(() => props.output);

	return (
		<div class="flex flex-row items-center space-x-1.5 h-5">
			<Show when={props.output.name}>{(name) => <span>{name()}</span>}</Show>
			<div ref={ref}>
				<svg
					style={{
						"pointer-events": "all",
					}}
					viewBox="0 0 16 13"
					class="w-4 text-transparent hover:text-white pointer-events-[all]"
					fill={
						props.output.connection().isSome() || active()
							? "white"
							: "currentColor"
					}
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M9.08253 1.375L14.2787 10.375C14.7598 11.2083 14.1584 12.25 13.1962 12.25H2.80385C1.8416 12.25 1.24019 11.2083 1.72132 10.375L6.91747 1.375C7.39859 0.541667 8.60141 0.541668 9.08253 1.375Z"
						stroke="white"
						stroke-width="1.5"
					/>
				</svg>
			</div>
		</div>
	);
};
