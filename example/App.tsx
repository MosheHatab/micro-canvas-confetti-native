import { useRef, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import {
	COIN_IMAGES,
	COIN_TYPES,
	confetti,
	measureCenter,
	ParticleHost,
	type CoinType,
} from "micro-canvas-confetti-native";

const COLLECT_COUNT = 8;

export default function App() {
	const badgeRef = useRef<View>(null);
	const [coinType, setCoinType] = useState<CoinType>("h-keystone");
	const [balance, setBalance] = useState(0);

	async function collectIntoBadge() {
		const target = await measureCenter(badgeRef);
		await confetti.collect({
			appearance: "coin",
			coinType,
			target,
			particleCount: COLLECT_COUNT,
			onArrive: () => setBalance((count) => count + 1),
		});
	}

	return (
		<View style={styles.root}>
			<StatusBar style="light" />
			<View style={styles.header}>
				<Text style={styles.title}>Confetti + coins</Text>
				<View ref={badgeRef} style={styles.badge} accessibilityRole="text">
					<Image source={COIN_IMAGES[coinType]} style={styles.badgeCoin} />
					<Text style={styles.balance}>{balance}</Text>
				</View>
			</View>

			<View style={styles.actions}>
				<Pressable
					style={styles.button}
					onPress={() => confetti({ preset: "celebration" })}
				>
					<Text style={styles.buttonLabel}>Confetti burst</Text>
				</Pressable>
				<Pressable
					style={styles.button}
					onPress={() => confetti({ appearance: "coin", coinType, particleCount: 12 })}
				>
					<Text style={styles.buttonLabel}>Coin burst</Text>
				</Pressable>
				<Pressable style={[styles.button, styles.buttonAccent]} onPress={collectIntoBadge}>
					<Text style={styles.buttonLabel}>Collect into badge</Text>
				</Pressable>
			</View>

			<View style={styles.types}>
				{COIN_TYPES.map((type) => {
					const selected = type === coinType;
					return (
						<Pressable
							key={type}
							onPress={() => setCoinType(type)}
							style={[styles.chip, selected && styles.chipSelected]}
							accessibilityRole="button"
							accessibilityState={{ selected }}
						>
							<Image source={COIN_IMAGES[type]} style={styles.chipCoin} />
							<Text style={styles.chipLabel}>{type}</Text>
						</Pressable>
					);
				})}
			</View>

			<ParticleHost />
		</View>
	);
}

const styles = StyleSheet.create({
	root: {
		flex: 1,
		backgroundColor: "#0b1020",
		paddingTop: 64,
		paddingHorizontal: 20,
		paddingBottom: 32,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	title: {
		color: "#f4f1ea",
		fontSize: 22,
		fontWeight: "700",
	},
	badge: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		backgroundColor: "#171d33",
		borderRadius: 999,
		paddingVertical: 6,
		paddingHorizontal: 12,
	},
	badgeCoin: { width: 28, height: 28 },
	balance: { color: "#f5b301", fontSize: 18, fontWeight: "700", minWidth: 24 },
	actions: { marginTop: 48, gap: 12 },
	button: {
		backgroundColor: "#1c2440",
		borderRadius: 14,
		paddingVertical: 16,
		alignItems: "center",
	},
	buttonAccent: { backgroundColor: "#b07a00" },
	buttonLabel: { color: "#f4f1ea", fontSize: 16, fontWeight: "600" },
	types: {
		marginTop: "auto",
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
	},
	chip: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		borderRadius: 999,
		paddingVertical: 6,
		paddingHorizontal: 10,
		backgroundColor: "#12182c",
	},
	chipSelected: { backgroundColor: "#2a3358" },
	chipCoin: { width: 20, height: 20 },
	chipLabel: { color: "#d7d3c8", fontSize: 12 },
});
