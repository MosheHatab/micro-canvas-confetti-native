import { MAX_COIN_PIECES, MAX_CONFETTI_PIECES, SIMULATION_TIME_SCALE } from "./constants";
import { retargetCollectPiece, sampleCollectPiece, spawnCollectPieces } from "./physics/collect";
import { integrateParticle, isParticleDead, spawnParticles } from "./physics/spawn";
import { computeSkewX, computeWobbleScale } from "./physics/wobble";
import type {
	CoinSource,
	CoinType,
	CollectOptions,
	CollectPiece,
	ConfettiOptions,
	ConfettiOrigin,
	Particle,
	ParticleAppearance,
	ParticleShape,
	PhysicsConfig,
	RenderCoinFn,
	ResolvedAppearance,
	Viewport,
} from "./types";
import { parseCollectOptions, parseConfettiOptions, warnIfScreenCapped } from "./utils/validation";

/** Static look of one mounted piece; fixed for its lifetime. */
export interface SlotLook {
	readonly appearance: ParticleAppearance;
	readonly coinType: CoinType;
	readonly coinSource?: CoinSource;
	readonly renderCoin?: RenderCoinFn;
	readonly color: string;
	readonly shape: ParticleShape;
	readonly width: number;
	readonly height: number;
}

/** Per-frame transform for one piece, centered on (x, y). */
export interface SlotFrame {
	readonly x: number;
	readonly y: number;
	readonly rotation: number;
	readonly scale: number;
	readonly scaleX: number;
	readonly skewX: number;
	readonly opacity: number;
}

/** Pieces spawned by one call; settles its promise when all are gone. */
export interface Batch {
	total: number;
	remaining: number;
	readonly resolve: () => void;
	readonly onArrive?: (index: number, total: number) => void;
}

interface BaseSlot {
	readonly id: number;
	/** Index within the burst, passed to `renderCoin`. */
	readonly index: number;
	readonly look: SlotLook;
	readonly batch: Batch;
	alive: boolean;
}

interface BurstSlot extends BaseSlot {
	readonly kind: "burst";
	readonly particle: Particle;
	readonly physics: PhysicsConfig;
	readonly originY: number;
}

interface CollectSlot extends BaseSlot {
	readonly kind: "collect";
	readonly piece: CollectPiece;
	readonly startedAtMs: number;
	readonly trackTarget?: () => ConfettiOrigin | null;
	frame: SlotFrame;
}

export type Slot = BurstSlot | CollectSlot;

type Request = () => void;

/** Where the host sits on screen, in window coordinates. */
export interface HostBounds {
	readonly x: number;
	readonly y: number;
	readonly width: number;
	readonly height: number;
}

const HIDDEN_FRAME: SlotFrame = { x: 0, y: 0, rotation: 0, scale: 1, scaleX: 1, skewX: 0, opacity: 0 };

/**
 * Framework-free store behind `confetti()`. The `ParticleHost` attaches to it,
 * reports size and reduced motion, steps it every frame, and draws its slots.
 */
export class ParticleEngine {
	private slots: Slot[] = [];
	private nextId = 1;
	private clockMs = 0;
	/** Cull bounds and default origin, both in window coordinates. */
	private viewport: Viewport = { width: 0, height: 0 };
	private center: ConfettiOrigin = { x: 0, y: 0 };
	private reducedMotion = false;
	private attached = false;
	private pending: Request[] = [];
	private onChange: (() => void) | null = null;

	/** Called by the host on mount. Flushes calls made before it existed. */
	public attach(bounds: HostBounds, onChange: () => void): void {
		this.attached = true;
		this.setBounds(bounds);
		this.onChange = onChange;
		const queued = this.pending;
		this.pending = [];
		for (const request of queued) request();
	}

	/** Called by the host on unmount. Clears everything on screen. */
	public detach(): void {
		this.reset();
		this.attached = false;
		this.onChange = null;
	}

	/** Host rectangle in window coordinates. */
	public setBounds(bounds: HostBounds): void {
		this.viewport = { width: bounds.x + bounds.width, height: bounds.y + bounds.height };
		this.center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
	}

	public setReducedMotion(reduced: boolean): void {
		this.reducedMotion = reduced;
	}

	public get isAttached(): boolean {
		return this.attached;
	}

	/** Mounted slots, including dead ones awaiting cleanup. */
	public getSlots(): readonly Slot[] {
		return this.slots;
	}

	public get activeCount(): number {
		let count = 0;
		for (const slot of this.slots) if (slot.alive) count += 1;
		return count;
	}

	/** Queues or spawns a physics burst. */
	public burst(options: ConfettiOptions | undefined, batch: Batch): void {
		this.run(() => {
			const resolved = parseConfettiOptions(options, this.center);
			if (this.skipForMotion(resolved)) return this.settle(batch, 0);
			const particles = spawnParticles(resolved).slice(0, this.capacity(resolved.appearance));
			warnIfScreenCapped(resolved.appearance, resolved.particleCount, particles.length);
			this.settle(batch, particles.length);
			this.compact();
			particles.forEach((particle, index) => {
				this.slots.push({
					kind: "burst",
					id: this.nextId++,
					index,
					alive: true,
					batch,
					particle,
					physics: resolved.physics,
					originY: resolved.origin.y,
					look: lookOf(resolved, particle.color, particle.shape, particle.width, particle.height),
				});
			});
			this.notify();
		});
	}

	/** Queues or spawns a collect flight. Throws synchronously on a bad target. */
	public collect(options: CollectOptions, batch: Batch): void {
		parseCollectOptions(options, this.center);
		this.run(() => {
			const resolved = parseCollectOptions(options, this.center);
			if (this.skipForMotion(resolved)) return this.settle(batch, 0);
			const pieces = spawnCollectPieces(resolved).slice(0, this.capacity(resolved.appearance));
			warnIfScreenCapped(resolved.appearance, resolved.particleCount, pieces.length);
			this.settle(batch, pieces.length);
			this.compact();
			pieces.forEach((piece, index) => {
				this.slots.push({
					kind: "collect",
					id: this.nextId++,
					alive: true,
					batch,
					piece,
					index,
					startedAtMs: this.clockMs,
					...(options.trackTarget ? { trackTarget: options.trackTarget } : {}),
					frame: HIDDEN_FRAME,
					look: lookOf(resolved, piece.color, piece.shape, piece.size, piece.size),
				});
			});
			this.notify();
		});
	}

	/** Advances every live piece by `dtSeconds` of real time. Returns true while any remain. */
	public step(dtSeconds: number): boolean {
		this.clockMs += dtSeconds * 1000;
		const simDt = dtSeconds * SIMULATION_TIME_SCALE;
		let anyAlive = false;

		for (const slot of this.slots) {
			if (!slot.alive) continue;
			if (slot.kind === "burst") {
				integrateParticle(slot.particle, simDt, slot.physics);
				if (isParticleDead(slot.particle, this.viewport, slot.originY)) this.kill(slot);
			} else {
				const nextTarget = slot.trackTarget?.();
				if (nextTarget !== null && nextTarget !== undefined && Number.isFinite(nextTarget.x) && Number.isFinite(nextTarget.y)) {
					retargetCollectPiece(slot.piece, nextTarget);
				}
				const sample = sampleCollectPiece(slot.piece, this.clockMs - slot.startedAtMs);
				slot.frame = {
					x: sample.x,
					y: sample.y,
					rotation: 0,
					scale: sample.scale,
					scaleX: sample.scaleX,
					skewX: 0,
					opacity: sample.opacity,
				};
				if (sample.done) {
					slot.batch.onArrive?.(slot.index, slot.batch.total);
					this.kill(slot);
				}
			}
			if (slot.alive) anyAlive = true;
		}
		return anyAlive;
	}

	/** Drops every slot once nothing is alive, so the host can unmount its views. */
	public clearIfIdle(): boolean {
		if (this.slots.length === 0 || this.activeCount > 0) return false;
		this.slots = [];
		this.notify();
		return true;
	}

	/** Stops everything immediately and settles all pending promises. */
	public reset(): void {
		const batches = new Set<Batch>();
		for (const slot of this.slots) if (slot.alive) batches.add(slot.batch);
		this.slots = [];
		for (const batch of batches) {
			batch.remaining = 0;
			batch.resolve();
		}
		this.notify();
	}

	private run(request: Request): void {
		if (this.attached) request();
		else this.pending.push(request);
	}

	private skipForMotion(look: ResolvedAppearance): boolean {
		return this.reducedMotion && look.disableForReducedMotion;
	}

	/** Free views under the safety ceiling for this look. */
	private capacity(appearance: ParticleAppearance): number {
		const max = appearance === "coin" ? MAX_COIN_PIECES : MAX_CONFETTI_PIECES;
		let used = 0;
		for (const slot of this.slots) if (slot.alive && slot.look.appearance === appearance) used += 1;
		return Math.max(0, max - used);
	}

	private settle(batch: Batch, count: number): void {
		batch.total = count;
		batch.remaining = count;
		if (count === 0) batch.resolve();
	}

	private kill(slot: Slot): void {
		slot.alive = false;
		slot.batch.remaining -= 1;
		if (slot.batch.remaining === 0) slot.batch.resolve();
	}

	private compact(): void {
		this.slots = this.slots.filter((slot) => slot.alive);
	}

	private notify(): void {
		this.onChange?.();
	}
}

function lookOf(
	look: ResolvedAppearance,
	color: string,
	shape: ParticleShape,
	width: number,
	height: number,
): SlotLook {
	return {
		appearance: look.appearance,
		coinType: look.coinType,
		...(look.coinSource !== undefined ? { coinSource: look.coinSource } : {}),
		...(look.renderCoin !== undefined ? { renderCoin: look.renderCoin } : {}),
		color,
		shape,
		width,
		height,
	};
}

/** Transform to draw a slot this frame. Dead slots are hidden. */
export function frameOf(slot: Slot): SlotFrame {
	if (!slot.alive) return HIDDEN_FRAME;
	if (slot.kind === "collect") return slot.frame;
	const { particle, physics } = slot;
	const isCoin = slot.look.appearance === "coin";
	return {
		x: particle.x,
		y: particle.y,
		rotation: particle.rotation,
		scale: 1,
		scaleX: computeWobbleScale(particle.wobblePhase, physics.minFlatness),
		skewX: isCoin ? 0 : computeSkewX(particle.wobblePhase, physics.skewFactor),
		opacity: particle.opacity,
	};
}

/** Creates a batch with its promise. */
export function createBatch(onArrive?: (index: number, total: number) => void): {
	batch: Batch;
	promise: Promise<void>;
} {
	let resolve: () => void = () => undefined;
	const promise = new Promise<void>((done) => {
		resolve = done;
	});
	let settled = false;
	const batch: Batch = {
		total: 0,
		remaining: -1,
		resolve: () => {
			if (settled) return;
			settled = true;
			resolve();
		},
		...(onArrive ? { onArrive } : {}),
	};
	return { batch, promise };
}
