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

	private static final Map<EntityType<?>, List<PartDefinition>> PARTS = Map.ofEntries(
			Map.entry(EntityType.ENDERMAN, List.of(
					PartDefinition.fixed("eye", "part.ghostharvest.eye", 2, () -> new ItemStack(Items.ENDER_PEARL))
			)),
			Map.entry(EntityType.BLAZE, List.of(
					PartDefinition.ranged("rod", "part.ghostharvest.rod", 3, 6, () -> new ItemStack(Items.BLAZE_ROD))
			)),
			Map.entry(EntityType.SKELETON, List.of(
					PartDefinition.ranged("bone", "part.ghostharvest.bone", 2, 4, () -> new ItemStack(Items.BONE)),
					PartDefinition.instantKill("skull", "part.ghostharvest.skull", () -> new ItemStack(Items.SKELETON_SKULL))
			)),
			Map.entry(EntityType.ZOMBIE, List.of(
					PartDefinition.fixed("arm", "part.ghostharvest.arm", 2, () -> new ItemStack(Items.ROTTEN_FLESH)),
					PartDefinition.instantKill("head", "part.ghostharvest.head", () -> new ItemStack(Items.ZOMBIE_HEAD))
			)),
			Map.entry(EntityType.CREEPER, List.of(
					PartDefinition.instantKill("core", "part.ghostharvest.core", () -> new ItemStack(Items.GUNPOWDER))
			)),
			Map.entry(EntityType.SPIDER, List.of(
					PartDefinition.ranged("leg", "part.ghostharvest.leg", 4, 8, () -> new ItemStack(Items.STRING)),
					PartDefinition.fixed("fang", "part.ghostharvest.fang", 2, () -> new ItemStack(Items.SPIDER_EYE))
			)),
			Map.entry(EntityType.PIGLIN, List.of(
					PartDefinition.fixed("tusk", "part.ghostharvest.tusk", 2, () -> new ItemStack(Items.GOLD_NUGGET)),
					PartDefinition.instantKill("gold_tooth", "part.ghostharvest.gold_tooth", () -> new ItemStack(Items.GOLD_INGOT))
			)),
			Map.entry(EntityType.WITCH, List.of(
					PartDefinition.ranged("wart", "part.ghostharvest.wart", 2, 4, () -> new ItemStack(Items.GLASS_BOTTLE)),
					PartDefinition.instantKill("nose", "part.ghostharvest.nose", () -> new ItemStack(Items.FERMENTED_SPIDER_EYE))
			)),
			Map.entry(EntityType.WITHER_SKELETON, List.of(
					PartDefinition.ranged("rib", "part.ghostharvest.rib", 3, 5, () -> new ItemStack(Items.BONE)),
					PartDefinition.instantKill("skull", "part.ghostharvest.skull", () -> new ItemStack(Items.WITHER_SKELETON_SKULL))
			)),
			Map.entry(EntityType.DROWNED, List.of(
					PartDefinition.fixed("fin", "part.ghostharvest.fin", 2, () -> new ItemStack(Items.PRISMARINE_SHARD)),
					PartDefinition.instantKill("trident_arm", "part.ghostharvest.trident_arm", () -> new ItemStack(Items.TRIDENT))
			)),
			Map.entry(EntityType.GUARDIAN, List.of(
					PartDefinition.ranged("spike", "part.ghostharvest.spike", 3, 6, () -> new ItemStack(Items.PRISMARINE_SHARD)),
					PartDefinition.instantKill("eye", "part.ghostharvest.eye", () -> new ItemStack(Items.PRISMARINE_CRYSTALS))
			)),
			Map.entry(EntityType.SILVERFISH, List.of(
					PartDefinition.instantKill("shell", "part.ghostharvest.shell", () -> new ItemStack(Items.IRON_NUGGET))
			))
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
