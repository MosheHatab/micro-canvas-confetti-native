import { useEffect, useRef, useState, type ReactNode } from "react";
import {
	Image,
	PanResponder,
	Platform,
	Pressable,
	ScrollView,
	Share,
	StyleSheet,
	Switch,
	Text,
	useWindowDimensions,
	View,
	type GestureResponderEvent,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import {
	COIN_IMAGES,
	COIN_TYPES,
	confetti,
	confettiSequence,
	getActiveParticleCount,
	MAX_COIN_PIECES,
	MAX_CONFETTI_PIECES,
	measureCenter,
	ParticleHost,
	PRESET_OPTIONS,
	reset,
	type CoinType,
	type ConfettiDuration,
	type ConfettiPreset,
} from "micro-canvas-confetti-native";

import { formatSnippet, toConfettiOptions, type PlaygroundSettings } from "./snippet";

const PRESETS: readonly ConfettiPreset[] = ["celebration", "subtle", "cannon", "spark"];
const DURATIONS: readonly ConfettiDuration[] = ["short", "normal", "long"];
const REACH_PRESETS = [0, 50, 200, 500, 1000] as const;
const WIDE = 960;

const INITIAL: PlaygroundSettings = {
	appearance: "confetti",
	coinType: "h-keystone",
	preset: null,
	particleCount: 80,
	scalar: 1,
	spread: 45,
	startVelocity: 45,
	gravity: 1.2,
	duration: "normal",
	burstRadius: 0,
	disableForReducedMotion: true,
};

function clampCount(count: number, appearance: PlaygroundSettings["appearance"]): number {
	const max = appearance === "coin" ? MAX_COIN_PIECES : MAX_CONFETTI_PIECES;
	return Math.min(max, Math.max(1, Math.round(count)));
}

export default function App() {
	const { width, height } = useWindowDimensions();
	const wide = width >= WIDE;
	const badgeRef = useRef<View>(null);
	const [settings, setSettings] = useState<PlaygroundSettings>(INITIAL);
	const [balance, setBalance] = useState(0);
	const [liveCount, setLiveCount] = useState(0);
	const [hintVisible, setHintVisible] = useState(true);
	const [copied, setCopied] = useState(false);
	const [capNote, setCapNote] = useState<string | null>(null);
	const [ring, setRing] = useState<{ x: number; y: number; radius: number } | null>(null);
	const snippet = formatSnippet(settings);
	const pieceMax = settings.appearance === "coin" ? MAX_COIN_PIECES : MAX_CONFETTI_PIECES;

	useEffect(() => {
		const timer = setInterval(() => setLiveCount(getActiveParticleCount()), 200);
		return () => clearInterval(timer);
	}, []);

	function patch(partial: Partial<PlaygroundSettings>, keepPreset = false) {
		setSettings((current) => {
			const next = { ...current, ...partial };
			if (!keepPreset && !("preset" in partial)) next.preset = null;
			if (partial.appearance) next.particleCount = clampCount(next.particleCount, partial.appearance);
			return next;
		});
	}

	function selectPreset(preset: ConfettiPreset) {
		const options = PRESET_OPTIONS[preset];
		setSettings((current) => ({
			...current,
			preset,
			particleCount: clampCount(options.particleCount ?? current.particleCount, current.appearance),
			startVelocity: options.startVelocity ?? current.startVelocity,
			spread: options.spread ?? current.spread,
			gravity: options.gravity ?? current.gravity,
			scalar: options.scalar ?? current.scalar,
			duration: options.duration ?? current.duration,
			burstRadius: options.burstRadius ?? 0,
		}));
	}

	function noteBudget(before: number, requested: number) {
		const added = getActiveParticleCount() - before;
		if (added < requested && (added > 0 || before > 0)) {
			const label = settings.appearance === "coin" ? "coins" : "confetti";
			setCapNote(
				`Safety cap is ${pieceMax} ${label} on screen. Added ${added} of ${requested}. Wait for pieces to leave.`,
			);
			return;
		}
		setCapNote(null);
	}

	function burstAt(origin?: { x: number; y: number }) {
		setHintVisible(false);
		const before = getActiveParticleCount();
		confetti({ ...toConfettiOptions(settings), ...(origin ? { origin } : {}) });
		noteBudget(before, settings.particleCount);
	}

	function onStagePress(event: GestureResponderEvent) {
		const { locationX, locationY, pageX, pageY } = event.nativeEvent;
		if (settings.burstRadius > 0) {
			setRing({ x: locationX, y: locationY, radius: settings.burstRadius });
			setTimeout(() => setRing(null), 900);
		}
		burstAt({ x: pageX, y: pageY });
	}

	function runSequence() {
		setHintVisible(false);
		const options = toConfettiOptions(settings);
		confettiSequence([
			{ delay: 0, options: { ...options, origin: { x: width * 0.22, y: height * 0.62 } } },
			{ delay: 320, options: { ...options, origin: { x: width * 0.5, y: height * 0.42 } } },
			{ delay: 640, options: { ...options, origin: { x: width * 0.78, y: height * 0.62 } } },
		]);
	}

	const badgeCenter = useRef({ x: 0, y: 0 });

	function rememberBadge() {
		badgeRef.current?.measureInWindow((x, y, badgeWidth, badgeHeight) => {
			if (badgeWidth === 0 && badgeHeight === 0) return;
			badgeCenter.current = { x: x + badgeWidth / 2, y: y + badgeHeight / 2 };
		});
	}

	async function collectIntoBadge() {
		const target = await measureCenter(badgeRef);
		badgeCenter.current = target;
		const count = Math.min(settings.particleCount, MAX_COIN_PIECES);
		const before = getActiveParticleCount();
		const flight = confetti.collect({
			appearance: "coin",
			coinType: settings.coinType,
			target,
			trackTarget: () => badgeCenter.current,
			particleCount: count,
			scalar: settings.scalar,
			onArrive: () => setBalance((value) => value + 1),
		});
		const added = getActiveParticleCount() - before;
		if (added < count && (added > 0 || before > 0)) {
			setCapNote(
				`Safety cap is ${MAX_COIN_PIECES} coins on screen. Added ${added} of ${count}. Wait for pieces to leave.`,
			);
		} else if (added >= count) {
			setCapNote(null);
		}
		await flight;
	}

	async function copySnippet() {
		const text = `${snippet.install}\n\n${snippet.code}`;
		const clipboard = (globalThis as { navigator?: { clipboard?: { writeText: (value: string) => Promise<void> } } })
			.navigator?.clipboard;
		if (clipboard) {
			await clipboard.writeText(text);
		} else {
			await Share.share({ message: text });
		}
		setCopied(true);
		setTimeout(() => setCopied(false), 1400);
	}

	const stage = (
		<Pressable style={[styles.stage, wide && styles.stageWide]} onPress={onStagePress}>
			{hintVisible ? (
				<View style={[styles.hint, styles.noTouch]}>
					<Text style={styles.hintTitle}>Tap to celebrate</Text>
					<Text style={styles.hintBody}>Bursts start where you tap. Controls stay live.</Text>
				</View>
			) : null}
			<Text style={styles.liveCount}>{liveCount} on screen</Text>
			{ring ? (
				<View
					style={[
						styles.noTouch,
						styles.ring,
						{
							left: ring.x - ring.radius,
							top: ring.y - ring.radius,
							width: ring.radius * 2,
							height: ring.radius * 2,
							borderRadius: ring.radius,
						},
					]}
				/>
			) : null}
		</Pressable>
	);

	const coinsSelected = settings.appearance === "coin";

	const controls = (
		<View style={[styles.panel, wide && styles.panelWide]}>
			<View style={styles.row}>
				{(["confetti", "coin"] as const).map((appearance) => (
					<Pressable
						key={appearance}
						onPress={() => patch({ appearance })}
						style={[styles.segment, settings.appearance === appearance && styles.segmentOn]}
					>
						<Text style={styles.segmentLabel}>{appearance === "coin" ? "Coins" : "Confetti"}</Text>
					</Pressable>
				))}
			</View>

			{coinsSelected ? (
				<Section title="Coins" collapsible={!wide}>
					<View style={styles.wrap}>
						{COIN_TYPES.map((type) => (
							<CoinChip
								key={type}
								type={type}
								selected={type === settings.coinType}
								onPress={() => patch({ coinType: type })}
							/>
						))}
					</View>
					<Action label="Collect into badge" onPress={collectIntoBadge} accent compact={!wide} />
				</Section>
			) : (
				<Section title="Presets" collapsible={!wide}>
					<View style={styles.presetGrid}>
						{PRESETS.map((preset) => {
							const colors = PRESET_OPTIONS[preset].colors ?? [];
							const selected = settings.preset === preset;
							return (
								<Pressable
									key={preset}
									onPress={() => selectPreset(preset)}
									style={[styles.preset, selected && styles.presetOn]}
								>
									<Text style={styles.presetLabel}>{preset}</Text>
									<View style={styles.swatches}>
										{colors.slice(0, 4).map((color) => (
											<View key={color} style={[styles.swatch, { backgroundColor: color }]} />
										))}
									</View>
								</Pressable>
							);
						})}
					</View>
				</Section>
			)}

			<Section title="Burst" collapsible={!wide}>
			<View style={styles.sliderGrid}>
			<SliderRow
				label="Pieces"
				value={settings.particleCount}
				min={1}
				max={pieceMax}
				step={1}
				onChange={(particleCount) => patch({ particleCount })}
			/>
			<SliderRow
				label="Size"
				value={settings.scalar}
				min={0.2}
				max={3}
				step={0.1}
				display={`${Math.round(settings.scalar * 100) / 100}x`}
				onChange={(scalar) => patch({ scalar })}
			/>
			<SliderRow
				label="Spread"
				value={settings.spread}
				min={0}
				max={360}
				step={1}
				display={`${Math.round(settings.spread)}\u00B0`}
				onChange={(spread) => patch({ spread })}
			/>
			<SliderRow
				label="Speed"
				value={settings.startVelocity}
				min={0}
				max={200}
				step={1}
				onChange={(startVelocity) => patch({ startVelocity })}
			/>
			<SliderRow
				label="Fall"
				value={settings.gravity}
				min={0}
				max={5}
				step={0.1}
				display={settings.gravity.toFixed(1)}
				onChange={(gravity) => patch({ gravity })}
			/>
			<SliderRow
				label="Reach"
				value={settings.burstRadius}
				min={0}
				max={1000}
				step={10}
				display={settings.burstRadius === 0 ? "Off" : String(settings.burstRadius)}
				onChange={(burstRadius) => patch({ burstRadius })}
			/>
			</View>
			{capNote ? <Text style={styles.capNote}>{capNote}</Text> : null}
			<View style={styles.row}>
				{DURATIONS.map((duration) => (
					<Pressable
						key={duration}
						onPress={() => patch({ duration })}
						style={[styles.segment, settings.duration === duration && styles.segmentOn]}
					>
						<Text style={styles.segmentLabel}>{duration}</Text>
					</Pressable>
				))}
			</View>

			<View style={styles.wrap}>
				{REACH_PRESETS.map((radius) => (
					<Pressable
						key={radius}
						onPress={() => patch({ burstRadius: radius })}
						style={[styles.mini, settings.burstRadius === radius && styles.miniOn]}
					>
						<Text style={styles.miniLabel}>{radius === 0 ? "Off" : radius}</Text>
					</Pressable>
				))}
			</View>

			<View style={styles.switchRow}>
				<Text style={styles.switchLabel}>Honor reduced motion</Text>
				<Switch
					value={settings.disableForReducedMotion}
					onValueChange={(disableForReducedMotion) => patch({ disableForReducedMotion }, true)}
					trackColor={{ false: "#2a3148", true: "#8a6a1f" }}
					thumbColor={settings.disableForReducedMotion ? "#f5b301" : "#c5cad6"}
				/>
			</View>

			</Section>

			<Section title="Install" collapsible={!wide}>
				<View style={styles.codeCard}>
					<Text style={styles.code} selectable>
						{snippet.install}
					</Text>
				</View>
				<View style={styles.codeCard}>
					<Text style={styles.code} selectable>
						{snippet.code}
					</Text>
				</View>
				<Pressable style={styles.copy} onPress={copySnippet}>
					<Text style={styles.copyLabel}>{copied ? "Copied" : "Copy install"}</Text>
				</Pressable>
			</Section>
		</View>
	);

	return (
		<View style={styles.root}>
			<StatusBar style="light" />
			<ScrollView
				contentContainerStyle={[styles.page, wide && styles.pageWide]}
				onScroll={rememberBadge}
				scrollEventThrottle={16}
			>
				<View style={wide ? styles.mainCol : undefined}>
					<View style={styles.header}>
						<View>
							<Text style={styles.kicker}>React Native</Text>
							<Text style={styles.title}>Confetti + coins</Text>
						</View>
						<View ref={badgeRef} onLayout={rememberBadge} style={styles.badge}>
							<Image source={COIN_IMAGES[settings.coinType]} style={styles.badgeCoin} />
							<Text style={styles.balance}>{balance}</Text>
						</View>
					</View>
					{stage}
					<View style={[styles.actions, !wide && styles.actionsMobile]}>
						<Action label="Pop" onPress={() => burstAt()} compact={!wide} />
						<Action label="Sequence" onPress={runSequence} compact={!wide} />
						<Action label="Clear" onPress={() => reset()} compact={!wide} />
					</View>
				</View>
				{controls}
			</ScrollView>
			<ParticleHost />
		</View>
	);
}

function Section({ title, collapsible, children }: { title: string; collapsible: boolean; children: ReactNode }) {
	const [open, setOpen] = useState(true);
	const expanded = !collapsible || open;

	return (
		<View style={styles.sectionBlock}>
			{collapsible ? (
				<Pressable
					onPress={() => setOpen((value) => !value)}
					style={styles.sectionHead}
					accessibilityRole="button"
					accessibilityState={{ expanded }}
				>
					<Text style={styles.section}>{title}</Text>
					<Text style={styles.sectionCue}>{expanded ? "Hide" : "Show"}</Text>
				</Pressable>
			) : (
				<Text style={styles.section}>{title}</Text>
			)}
			{expanded ? <View style={styles.sectionBody}>{children}</View> : null}
		</View>
	);
}

function Action({
	label,
	onPress,
	accent = false,
	compact = false,
}: {
	label: string;
	onPress: () => void;
	accent?: boolean;
	compact?: boolean;
}) {
	return (
		<Pressable style={[styles.action, compact && styles.actionCompact, accent && styles.actionAccent]} onPress={onPress}>
			<Text style={[styles.actionLabel, compact && styles.actionLabelCompact]}>{label}</Text>
		</Pressable>
	);
}

function CoinChip({ type, selected, onPress }: { type: CoinType; selected: boolean; onPress: () => void }) {
	return (
		<Pressable onPress={onPress} style={[styles.chip, selected && styles.chipOn]} accessibilityState={{ selected }}>
			<Image source={COIN_IMAGES[type]} style={styles.chipCoin} />
			<Text style={styles.chipLabel}>{type}</Text>
		</Pressable>
	);
}

function SliderRow({
	label,
	value,
	min,
	max,
	step,
	display,
	onChange,
}: {
	label: string;
	value: number;
	min: number;
	max: number;
	step: number;
	display?: string;
	onChange: (value: number) => void;
}) {
	const trackRef = useRef<View>(null);
	const boundsRef = useRef({ min, max, step, onChange });
	boundsRef.current = { min, max, step, onChange };

	function setFromPageX(pageX: number) {
		const bounds = boundsRef.current;
		trackRef.current?.measureInWindow((x, _y, width) => {
			if (width <= 0) return;
			const ratio = Math.min(1, Math.max(0, (pageX - x) / width));
			const raw = bounds.min + ratio * (bounds.max - bounds.min);
			const stepped = Math.round(raw / bounds.step) * bounds.step;
			const next = Math.min(bounds.max, Math.max(bounds.min, Math.round(stepped * 1000) / 1000));
			bounds.onChange(next);
		});
	}

	const pan = useRef(
		PanResponder.create({
			onStartShouldSetPanResponder: () => true,
			onMoveShouldSetPanResponder: () => true,
			onPanResponderGrant: (event) => setFromPageX(event.nativeEvent.pageX),
			onPanResponderMove: (event) => setFromPageX(event.nativeEvent.pageX),
		}),
	).current;

	const ratio = max === min ? 0 : (value - min) / (max - min);

	return (
		<View style={[styles.sliderBlock, styles.sliderCell]}>
			<View style={styles.sliderHead}>
				<Text style={styles.sliderLabel}>{label}</Text>
				<Text style={styles.sliderValue}>{display ?? String(Math.round(value))}</Text>
			</View>
			<View ref={trackRef} style={styles.track} {...pan.panHandlers}>
				<View style={[styles.trackFill, { width: `${ratio * 100}%` }]} />
				<View style={[styles.thumb, { left: `${ratio * 100}%` }]} />
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	root: { flex: 1, backgroundColor: "#05060a" },
	page: { paddingTop: Platform.OS === "web" ? 28 : 56, paddingHorizontal: 20, paddingBottom: 40, gap: 16 },
	pageWide: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "flex-start",
		alignSelf: "center",
		width: "100%",
		gap: 48,
	},
	mainCol: { width: 640, maxWidth: "100%", flexShrink: 1, gap: 16 },
	header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: 640, maxWidth: "100%" },
	kicker: { color: "#f5b301", fontSize: 12, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase" },
	title: { color: "#f4f1ea", fontSize: 28, fontWeight: "700" },
	badge: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		backgroundColor: "#101218",
		borderRadius: 999,
		paddingVertical: 6,
		paddingLeft: 6,
		paddingRight: 14,
		borderWidth: 1,
		borderColor: "#2c303a",
	},
	badgeCoin: { width: 32, height: 32 },
	balance: { color: "#f5b301", fontSize: 18, fontWeight: "700", minWidth: 20 },
	stage: {
		height: 220,
		borderRadius: 20,
		backgroundColor: "#0c0e14",
		borderWidth: 1,
		borderColor: "#2c303a",
		overflow: "hidden",
		alignItems: "center",
		justifyContent: "center",
	},
	stageWide: { width: 640, maxWidth: "100%", height: 480, alignSelf: "flex-start" },
	noTouch: { pointerEvents: "none" },
	hint: { alignItems: "center", gap: 6, paddingHorizontal: 24 },
	hintTitle: { color: "#f4f1ea", fontSize: 22, fontWeight: "700" },
	hintBody: { color: "#c5cad6", fontSize: 14, textAlign: "center" },
	liveCount: { position: "absolute", left: 14, bottom: 12, color: "#b7becc", fontSize: 12 },
	capNote: { color: "#f5b301", fontSize: 13, lineHeight: 18 },
	ring: { position: "absolute", borderWidth: 1, borderColor: "rgba(245,179,1,0.7)" },
	actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	actionsMobile: { marginTop: 18 },
	action: {
		backgroundColor: "#161922",
		borderRadius: 12,
		paddingVertical: 12,
		paddingHorizontal: 16,
		minWidth: 88,
		alignItems: "center",
	},
	actionCompact: { paddingVertical: 8, paddingHorizontal: 12, minWidth: 72, borderRadius: 10 },
	actionAccent: { backgroundColor: "#b07a00" },
	actionLabel: { color: "#f4f1ea", fontSize: 15, fontWeight: "600" },
	actionLabelCompact: { fontSize: 13 },
	sliderGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
	panel: { gap: 20 },
	panelWide: { width: 400 },
	sectionBlock: { gap: 12 },
	sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
	section: { color: "#c5cad6", fontSize: 12, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase" },
	sectionCue: { color: "#f5b301", fontSize: 12, fontWeight: "700" },
	sectionBody: { gap: 12 },
	row: { flexDirection: "row", gap: 8 },
	segment: {
		flex: 1,
		alignItems: "center",
		paddingVertical: 10,
		borderRadius: 12,
		backgroundColor: "#12141c",
		borderWidth: 1,
		borderColor: "#2c303a",
	},
	segmentOn: { borderColor: "#f5b301", backgroundColor: "#241e10" },
	segmentLabel: { color: "#f4f1ea", fontSize: 14, fontWeight: "600", textTransform: "capitalize" },
	wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	chip: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		borderRadius: 999,
		paddingVertical: 6,
		paddingHorizontal: 10,
		backgroundColor: "#12141c",
		borderWidth: 1,
		borderColor: "#2c303a",
	},
	chipOn: { borderColor: "#f5b301" },
	chipCoin: { width: 18, height: 18 },
	chipLabel: { color: "#e4e7ee", fontSize: 12 },
	presetGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	preset: {
		width: "48%",
		flexGrow: 1,
		backgroundColor: "#12141c",
		borderRadius: 14,
		borderWidth: 1,
		borderColor: "#2c303a",
		padding: 12,
		gap: 8,
	},
	presetOn: { borderColor: "#f5b301" },
	presetLabel: { color: "#f4f1ea", fontSize: 14, fontWeight: "600", textTransform: "capitalize" },
	swatches: { flexDirection: "row", gap: 4 },
	swatch: { width: 14, height: 14, borderRadius: 4 },
	sliderBlock: { gap: 6 },
	sliderCell: { width: "47%", flexGrow: 1, minWidth: 140 },
	sliderHead: { flexDirection: "row", justifyContent: "space-between" },
	sliderLabel: { color: "#e4e7ee", fontSize: 14 },
	sliderValue: { color: "#f5b301", fontSize: 14, fontWeight: "700" },
	track: {
		height: 28,
		borderRadius: 999,
		backgroundColor: "#12141c",
		justifyContent: "center",
	},
	trackFill: { position: "absolute", left: 0, top: 12, height: 4, borderRadius: 999, backgroundColor: "#f5b301" },
	thumb: {
		position: "absolute",
		top: 4,
		width: 20,
		height: 20,
		marginLeft: -10,
		borderRadius: 10,
		backgroundColor: "#f4f1ea",
	},
	mini: {
		paddingVertical: 6,
		paddingHorizontal: 12,
		borderRadius: 999,
		backgroundColor: "#12141c",
		borderWidth: 1,
		borderColor: "#2c303a",
	},
	miniOn: { borderColor: "#f5b301" },
	miniLabel: { color: "#f4f1ea", fontSize: 12, fontWeight: "600" },
	switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 },
	switchLabel: { color: "#e4e7ee", fontSize: 14 },
	codeCard: { backgroundColor: "#08090d", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#2c303a" },
	code: { color: "#e4e7ee", fontSize: 12, fontFamily: Platform.OS === "web" ? "ui-monospace, monospace" : "monospace" },
	copy: { alignSelf: "flex-start", backgroundColor: "#161922", borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 },
	copyLabel: { color: "#f4f1ea", fontSize: 13, fontWeight: "600" },
});
