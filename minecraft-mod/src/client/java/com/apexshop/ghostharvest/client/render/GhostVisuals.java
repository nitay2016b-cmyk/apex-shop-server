package com.apexshop.ghostharvest.client.render;

import net.minecraft.entity.Entity;
import net.minecraft.entity.EntityType;
import net.minecraft.entity.mob.BlazeEntity;
import net.minecraft.entity.mob.CreeperEntity;
import net.minecraft.entity.mob.EndermanEntity;
import net.minecraft.entity.mob.SkeletonEntity;
import net.minecraft.entity.mob.SpiderEntity;
import net.minecraft.entity.mob.ZombieEntity;
import net.minecraft.world.World;

import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * Client-only: which real mob entity to stand in as a "puppet" when drawing
 * a ghost of a given source type. We reuse the mob's own (always-correct,
 * always up to date) renderer by handing the dispatcher a throwaway instance
 * of the real entity class each frame - see GhostFollowerEntityRenderer.
 * Add an entry here for every EntityType listed in MobPartRegistry.
 */
public final class GhostVisuals {

	private static final Map<EntityType<?>, Function<World, Entity>> PUPPET_FACTORIES = new HashMap<>();

	static {
		PUPPET_FACTORIES.put(EntityType.ENDERMAN, world -> new EndermanEntity(EntityType.ENDERMAN, world));
		PUPPET_FACTORIES.put(EntityType.BLAZE, world -> new BlazeEntity(EntityType.BLAZE, world));
		PUPPET_FACTORIES.put(EntityType.SKELETON, world -> new SkeletonEntity(EntityType.SKELETON, world));
		PUPPET_FACTORIES.put(EntityType.ZOMBIE, world -> new ZombieEntity(EntityType.ZOMBIE, world));
		PUPPET_FACTORIES.put(EntityType.CREEPER, world -> new CreeperEntity(EntityType.CREEPER, world));
		PUPPET_FACTORIES.put(EntityType.SPIDER, world -> new SpiderEntity(EntityType.SPIDER, world));
	}

	private GhostVisuals() {
	}

	public static Entity createPuppet(EntityType<?> sourceType, World world) {
		Function<World, Entity> factory = PUPPET_FACTORIES.getOrDefault(sourceType, PUPPET_FACTORIES.get(EntityType.ZOMBIE));
		return factory.apply(world);
	}
}
