import { App, Modal } from "obsidian";
import RavenHogwartsToolkitPlugin from "@/src/main";
import { createRoot, Root } from "react-dom/client";
import * as React from "react";
import { X } from "lucide-react";
import "./styles/BaseModal.css";

interface IBaseModalProps {
	app: App;
	plugin: RavenHogwartsToolkitPlugin;
	onClose: () => void;
	additionalProps?: Record<string, any>;
	sizeClass?: string;
}

export const ModalContext = React.createContext<{
	app: App;
	plugin: RavenHogwartsToolkitPlugin;
	additionalProps?: Record<string, any>;
} | null>(null);

const ModalLoading: React.FC = () => (
	<div className="rht-toolkit-modal-loading">
		<span>Loading...</span>
	</div>
);

export class BaseModal extends Modal {
	private root: Root | null = null;
	private props: IBaseModalProps;
	private LazyComponent: React.LazyExoticComponent<React.ComponentType<any>>;

	constructor(
		app: App,
		plugin: RavenHogwartsToolkitPlugin,
		componentImport: () => Promise<{ default: React.ComponentType<any> }>,
		additionalProps: Record<string, any> = {},
		sizeClass = "modal-size-large"
	) {
		super(app);
		this.props = {
			app,
			plugin,
			onClose: () => this.close(),
			additionalProps,
			sizeClass,
		};
		this.LazyComponent = React.lazy(componentImport);
	}

	async onOpen(): Promise<void> {
		const el = this.containerEl;
		this.root = createRoot(el);
		this.root.render(
			<React.StrictMode>
				<div className={`rht-toolkit-modal ${this.props.sizeClass}`}>
					<ModalContext.Provider
						value={{
							app: this.props.app,
							plugin: this.props.plugin,
							additionalProps: this.props.additionalProps,
						}}
					>
						<React.Suspense fallback={<ModalLoading />}>
							<this.LazyComponent {...this.props} />
						</React.Suspense>
					</ModalContext.Provider>
					<div
						className="rht-toolkit-modal-close"
						onClick={() => this.close()}
					>
						<X />
					</div>
				</div>
			</React.StrictMode>
		);
	}

	async onClose() {
		this.root?.unmount();
		this.root = null;
		this.containerEl.empty();
	}
}

// Custom hook to access modal context
export const useModal = () => {
	const context = React.useContext(ModalContext);
	if (!context) {
		throw new Error("useModal must be used within a ModalContext.Provider");
	}
	return context;
};
