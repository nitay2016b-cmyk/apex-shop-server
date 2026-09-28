package com.apexshop.ghostharvest.item;

import net.fabricmc.fabric.api.itemgroup.v1.ItemGroupEvents;
import net.minecraft.item.Item;
import net.minecraft.item.ItemGroups;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.util.Identifier;

public final class GhostHarvestItems {

	/**
	 * Right-click a mob with this in hand (instead of trading with it) to open
	 * the extraction menu for it.
	 */
	public static final Item EXTRACTION_HOOK = Registry.register(
			Registries.ITEM,
			Identifier.of("ghostharvest", "extraction_hook"),
			new Item(new Item.Settings().maxCount(1))
	);

	private GhostHarvestItems() {
	}

	public static void register() {
		ItemGroupEvents.modifyEntriesEvent(ItemGroups.TOOLS).register(entries -> entries.add(EXTRACTION_HOOK));
	}
}
