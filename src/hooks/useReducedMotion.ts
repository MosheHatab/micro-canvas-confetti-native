import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/**
 * Reactively report whether the user prefers reduced motion, backed by
 * `AccessibilityInfo.isReduceMotionEnabled`. Defaults to `false`.
 */
export function useReducedMotion(): boolean {
	const [reduced, setReduced] = useState(false);

	useEffect(() => {
		let mounted = true;
		AccessibilityInfo.isReduceMotionEnabled()
			.then((value) => {
				if (mounted) setReduced(value);
			})
			.catch(() => undefined);
		const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);
		return () => {
			mounted = false;
			subscription.remove();
		};
	}, []);

	return reduced;
}
