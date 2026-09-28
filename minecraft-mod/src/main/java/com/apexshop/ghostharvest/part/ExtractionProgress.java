package com.apexshop.ghostharvest.part;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

/**
 * Per-mob-instance state: how many of each part this particular mob turned
 * out to have (rolled once, on first grab, for parts with a random range),
 * and how many of each part have already been pulled out.
 */
public final class ExtractionProgress {

	private final Map<String, Integer> rolledCounts = new HashMap<>();
	private final Map<String, Integer> extractedCounts = new HashMap<>();
	private final Random random = new Random();

	public int rolledCount(PartDefinition part) {
		return rolledCounts.computeIfAbsent(part.id(), id -> part.minCount() == part.maxCount()
				? part.minCount()
				: part.minCount() + random.nextInt(part.maxCount() - part.minCount() + 1));
	}

	public int extractedCount(String partId) {
		return extractedCounts.getOrDefault(partId, 0);
	}

	public int remaining(PartDefinition part) {
		return Math.max(0, rolledCount(part) - extractedCount(part.id()));
	}

	public boolean hasRemaining(PartDefinition part) {
		return remaining(part) > 0;
	}

	public void extractOne(PartDefinition part) {
		extractedCounts.merge(part.id(), 1, Integer::sum);
	}

	public boolean isFullyDepleted(List<PartDefinition> parts) {
		for (PartDefinition part : parts) {
			if (hasRemaining(part)) {
				return false;
			}
		}
		return true;
	}
}
