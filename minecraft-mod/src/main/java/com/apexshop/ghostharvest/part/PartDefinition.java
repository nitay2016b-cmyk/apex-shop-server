package com.apexshop.ghostharvest.part;

import net.minecraft.item.ItemStack;

import java.util.function.Supplier;

/**
 * Describes one harvestable part a mob can offer, e.g. Enderman "eye" (needs 2)
 * or Blaze "rod" (a random amount per-mob). {@code instantKill} parts (like a
 * "head") kill the mob the moment they're taken, regardless of any other part.
 */
public record PartDefinition(String id, String translationKey, int minCount, int maxCount, boolean instantKill,
							  Supplier<ItemStack> dropItem) {

	public static PartDefinition fixed(String id, String translationKey, int count, Supplier<ItemStack> dropItem) {
		return new PartDefinition(id, translationKey, count, count, false, dropItem);
	}

	public static PartDefinition ranged(String id, String translationKey, int min, int max, Supplier<ItemStack> dropItem) {
		return new PartDefinition(id, translationKey, min, max, false, dropItem);
	}

	public static PartDefinition instantKill(String id, String translationKey, Supplier<ItemStack> dropItem) {
		return new PartDefinition(id, translationKey, 1, 1, true, dropItem);
	}
}
