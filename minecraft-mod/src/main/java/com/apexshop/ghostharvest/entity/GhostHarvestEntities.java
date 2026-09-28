package com.apexshop.ghostharvest.entity;

import net.minecraft.entity.EntityType;
import net.minecraft.entity.SpawnGroup;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.registry.RegistryKey;
import net.minecraft.registry.RegistryKeys;
import net.minecraft.util.Identifier;

public final class GhostHarvestEntities {

	private static final RegistryKey<EntityType<?>> GHOST_FOLLOWER_KEY =
			RegistryKey.of(RegistryKeys.ENTITY_TYPE, Identifier.of("ghostharvest", "ghost_follower"));

	public static final EntityType<GhostFollowerEntity> GHOST_FOLLOWER = Registry.register(
			Registries.ENTITY_TYPE,
			GHOST_FOLLOWER_KEY,
			EntityType.Builder.<GhostFollowerEntity>create(GhostFollowerEntity::new, SpawnGroup.MISC)
					.setDimensions(0.4f, 0.4f)
					.maxTrackingRange(64)
					.trackingTickInterval(1)
					.makeFireImmune()
					.disableSummon()
					.build(GHOST_FOLLOWER_KEY)
	);

	private GhostHarvestEntities() {
	}

	public static void register() {
		// Referencing GHOST_FOLLOWER above triggers the static registration.
	}
}
