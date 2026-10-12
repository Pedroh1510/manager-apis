/** Mirrors server/tdarr/tdarrNodes.ts and tdarrStats.ts (door 3 of the tdarr-dashboard plan). */
export type TdarrWorkerKind = 'transcode' | 'healthCheck';
export type TdarrHardware = 'gpu' | 'cpu';

export interface TdarrWorker {
	id: string;
	kind: TdarrWorkerKind;
	hardware: TdarrHardware;
	file: string;
	percentage: number;
	/** `H:MM:SS` */
	eta: string;
	fps: number;
	originalSizeGb: number;
	estimatedSizeGb: number;
}

export interface TdarrWorkerLimits {
	transcodeGpu: number;
	transcodeCpu: number;
	healthCheckGpu: number;
	healthCheckCpu: number;
}

export interface TdarrNode {
	id: string;
	name: string;
	paused: boolean;
	online: boolean;
	busyWorkers: number;
	workerCapacity: number;
	workerLimits: TdarrWorkerLimits;
	workers: TdarrWorker[];
}

export interface TdarrOverview {
	version: string;
	nodes: TdarrNode[];
}

export interface TdarrErrorFile {
	file: string;
	library: string;
	date: string | null;
}

export interface TdarrErrorList {
	total: number;
	items: TdarrErrorFile[];
}

export interface TdarrStats {
	totals: { files: number; transcodes: number; healthChecks: number; spaceSavedGb: number };
	transcode: { onHold: number; queued: number; succeeded: number; failed: number };
	healthCheck: { queued: number; succeeded: number; failed: number };
	errors: { transcode: TdarrErrorList; healthCheck: TdarrErrorList };
}
