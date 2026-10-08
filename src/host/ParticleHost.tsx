import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { Dimensions, Image, type LayoutChangeEvent, Platform, StyleSheet, View } from "react-native";

import { engine } from "../api";
import { COIN_IMAGES } from "../coins";
import { frameOf, type Slot, type SlotFrame, type SlotLook } from "../engine";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { computeDeltaSeconds } from "../utils/math";

const DEFAULT_Z_INDEX = 9999;

export interface ParticleHostProps {
	/** Stacking order over your app. Default 9999. */
	readonly zIndex?: number;
}

/** A React Native view ref, or the DOM node react-native-web hands back. */
interface PieceNode {
	setNativeProps?: (props: object) => void;
	style?: { transform: string; opacity: string };
}

function nativeStyle(frame: SlotFrame, look: SlotLook) {
	return {
		opacity: frame.opacity,
		transform: [
			{ translateX: frame.x - look.width / 2 },
			{ translateY: frame.y - look.height / 2 },
			{ rotate: `${frame.rotation}rad` },
			{ scale: frame.scale },
			{ scaleX: frame.scaleX },
			{ skewX: `${frame.skewX}rad` },
		],
	};
}

/** Writes one frame without a React render. */
function applyFrame(node: PieceNode, frame: SlotFrame, look: SlotLook): void {
	if (typeof node.setNativeProps === "function") {
		node.setNativeProps({ style: nativeStyle(frame, look) });
		return;
	}
	if (node.style !== undefined) {
		node.style.opacity = String(frame.opacity);
		node.style.transform =
			`translateX(${frame.x - look.width / 2}px) translateY(${frame.y - look.height / 2}px) ` +
			`rotate(${frame.rotation}rad) scale(${frame.scale}) scaleX(${frame.scaleX}) skewX(${frame.skewX}rad)`;
	}
}

function Piece({ slot, onRef }: { slot: Slot; onRef: (id: number, node: PieceNode | null) => void }) {
	const { look } = slot;
	const ref = (node: PieceNode | null) => onRef(slot.id, node);
	const box = { width: look.width, height: look.height };
	const motion = nativeStyle(frameOf(slot), look);

	if (look.appearance === "coin") {
		return (
			<Image
				ref={ref as never}
				source={look.coinSource ?? COIN_IMAGES[look.coinType]}
				resizeMode="contain"
				fadeDuration={0}
				style={[styles.piece, box, motion]}
			/>
		);
	}
	const radius = look.shape === "circle" ? Math.max(look.width, look.height) / 2 : 0;
	return (
		<View
			ref={ref as never}
			style={[styles.piece, box, { backgroundColor: look.color, borderRadius: radius }, motion]}
		/>
	);
}

/**
 * Full-screen, touch-through overlay that draws every `confetti()` burst and
 * `confetti.collect()` flight. Mount it once, as the last child of your root view.
 */
export function ParticleHost({ zIndex = DEFAULT_Z_INDEX }: ParticleHostProps) {
	const [, rerender] = useReducer((n: number) => n + 1, 0);
	const [offset, setOffset] = useState({ x: 0, y: 0 });
	const rootRef = useRef<View>(null);
	const nodes = useRef(new Map<number, PieceNode>());
	const frameHandle = useRef(0);
	const lastTimestamp = useRef(0);
	const reducedMotion = useReducedMotion();

	useEffect(() => {
		engine.setReducedMotion(reducedMotion);
	}, [reducedMotion]);

	const tick = useCallback((timestamp: number) => {
		const dt = computeDeltaSeconds(lastTimestamp.current, timestamp);
		lastTimestamp.current = timestamp;
		const anyAlive = engine.step(dt);

		for (const slot of engine.getSlots()) {
			const node = nodes.current.get(slot.id);
			if (node) applyFrame(node, frameOf(slot), slot.look);
		}

		if (anyAlive) {
			frameHandle.current = requestAnimationFrame(tick);
		} else {
			frameHandle.current = 0;
			lastTimestamp.current = 0;
			engine.clearIfIdle();
		}
	}, []);

	useEffect(() => {
		const { width, height } = Dimensions.get("window");
		engine.attach({ x: 0, y: 0, width, height }, () => {
			rerender();
			if (frameHandle.current === 0 && engine.activeCount > 0) {
				frameHandle.current = requestAnimationFrame(tick);
			}
		});
		return () => {
			if (frameHandle.current !== 0) cancelAnimationFrame(frameHandle.current);
			frameHandle.current = 0;
			engine.detach();
		};
	}, [tick]);

	const onLayout = useCallback((event: LayoutChangeEvent) => {
		const { width, height } = event.nativeEvent.layout;
		const root = rootRef.current;
		if (root === null || typeof root.measureInWindow !== "function") {
			engine.setBounds({ x: 0, y: 0, width, height });
			return;
		}
		root.measureInWindow((x, y, w, h) => {
			setOffset({ x, y });
			engine.setBounds({ x, y, width: w || width, height: h || height });
		});
	}, []);

	const onRef = useCallback((id: number, node: PieceNode | null) => {
		if (node) nodes.current.set(id, node);
		else nodes.current.delete(id);
	}, []);

	return (
		<View
			ref={rootRef}
			pointerEvents="none"
			onLayout={onLayout}
			style={[StyleSheet.absoluteFill, webFixed, { zIndex, elevation: zIndex }]}
		>
			<View style={[styles.canvas, { left: -offset.x, top: -offset.y }]}>
				{engine.getSlots().map((slot) => (
					<Piece key={slot.id} slot={slot} onRef={onRef} />
				))}
			</View>
		</View>
	);
}

/** Web absolute positioning scrolls with the page. Fixed keeps the flight on screen. */
const webFixed =
	Platform.OS === "web" ? ({ position: "fixed" } as unknown as { position: "absolute" }) : null;

const styles = StyleSheet.create({
	canvas: { position: "absolute" },
	piece: { position: "absolute", left: 0, top: 0 },
});
