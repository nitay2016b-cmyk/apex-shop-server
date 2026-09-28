package com.apexshop.ghostharvest.part;

import net.minecraft.entity.LivingEntity;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Server-side in-memory table of extraction progress, keyed by mob UUID.
 * Intentionally not persisted to disk: progress simply starts over for a mob
 * that survives a server restart or leaves loaded chunks and comes back. If
 * you need it to survive that too, migrate this to Fabric's Attachment API
 * (net.fabricmc.fabric.api.attachment.v1) with a codec for ExtractionProgress.
 */
public final class ExtractionManager {

	private static final Map<UUID, ExtractionProgress> PROGRESS = new ConcurrentHashMap<>();

	private ExtractionManager() {
	}

	public static ExtractionProgress get(LivingEntity entity) {
		return PROGRESS.computeIfAbsent(entity.getUuid(), id -> new ExtractionProgress());
	}

	public static void clear(LivingEntity entity) {
		PROGRESS.remove(entity.getUuid());
	}
}
