package com.apexshop.ghostharvest.part;

import net.minecraft.entity.EntityType;
import net.minecraft.item.Items;
import net.minecraft.item.ItemStack;

import java.util.List;
import java.util.Map;

/**
 * Which parts each mob type can be harvested for. To support a new mob, add
 * an entry here (and, for the ghost visual on the client, an entry in
 * GhostVisuals on the client side).
 */
public final class MobPartRegistry {

	private static final Map<EntityType<?>, List<PartDefinition>> PARTS = Map.of(
			EntityType.ENDERMAN, List.of(
					PartDefinition.fixed("eye", "part.ghostharvest.eye", 2, () -> new ItemStack(Items.ENDER_PEARL))
			),
			EntityType.BLAZE, List.of(
					PartDefinition.ranged("rod", "part.ghostharvest.rod", 3, 6, () -> new ItemStack(Items.BLAZE_ROD))
			),
			EntityType.SKELETON, List.of(
					PartDefinition.ranged("bone", "part.ghostharvest.bone", 2, 4, () -> new ItemStack(Items.BONE)),
					PartDefinition.instantKill("skull", "part.ghostharvest.skull", () -> new ItemStack(Items.SKELETON_SKULL))
			),
			EntityType.ZOMBIE, List.of(
					PartDefinition.fixed("arm", "part.ghostharvest.arm", 2, () -> new ItemStack(Items.ROTTEN_FLESH)),
					PartDefinition.instantKill("head", "part.ghostharvest.head", () -> new ItemStack(Items.ZOMBIE_HEAD))
			),
			EntityType.CREEPER, List.of(
					PartDefinition.instantKill("core", "part.ghostharvest.core", () -> new ItemStack(Items.GUNPOWDER))
			),
			EntityType.SPIDER, List.of(
					PartDefinition.ranged("leg", "part.ghostharvest.leg", 4, 8, () -> new ItemStack(Items.STRING)),
					PartDefinition.fixed("fang", "part.ghostharvest.fang", 2, () -> new ItemStack(Items.SPIDER_EYE))
			)
	);

	private MobPartRegistry() {
	}

	public static List<PartDefinition> get(EntityType<?> type) {
		return PARTS.getOrDefault(type, List.of());
	}

	public static boolean isSupported(EntityType<?> type) {
		return PARTS.containsKey(type);
	}
}
