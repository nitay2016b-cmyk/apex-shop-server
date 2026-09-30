package com.apex.mkheroes;

import com.apex.mkheroes.effect.ModEffects;
import com.apex.mkheroes.item.ModArmorMaterials;
import com.apex.mkheroes.item.ModComponents;
import com.apex.mkheroes.item.ModItems;
import com.apex.mkheroes.power.SuitPowers;
import net.fabricmc.api.ModInitializer;
import net.fabricmc.fabric.api.event.lifecycle.v1.ServerTickEvents;
import net.fabricmc.fabric.api.itemgroup.v1.FabricItemGroup;
import net.fabricmc.fabric.api.networking.v1.ServerPlayConnectionEvents;
import net.minecraft.item.Item;
import net.minecraft.item.ItemStack;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.text.Text;
import net.minecraft.util.Identifier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class MKHeroes implements ModInitializer {
	public static final String MOD_ID = "mkheroes";
	public static final Logger LOGGER = LoggerFactory.getLogger(MOD_ID);

	public static Identifier id(String path) {
		return Identifier.of(MOD_ID, path);
	}

	/** One creative tab per world, so Mortal Kombat and Marvel items are not mixed. */
	private static void registerTab(ModItems.Universe universe, Item icon) {
		Registry.register(Registries.ITEM_GROUP, id(universe.id), FabricItemGroup.builder()
				.icon(() -> new ItemStack(icon))
				.displayName(Text.translatable("itemGroup.mkheroes." + universe.id))
				.entries((context, entries) -> universe.items.forEach(entries::add))
				.build());
	}

	@Override
	public void onInitialize() {
		ModComponents.init();
		ModEffects.init();
		ModArmorMaterials.init();
		ModItems.init();

		registerTab(ModItems.Universe.MORTAL_KOMBAT, ModItems.SCORPION_HANDS);
		registerTab(ModItems.Universe.MARVEL, ModItems.INFINITY_GAUNTLET);

		ServerTickEvents.END_SERVER_TICK.register(server -> {
			for (ServerPlayerEntity player : server.getPlayerManager().getPlayerList()) {
				SuitPowers.tick(player);
			}
		});
		ServerPlayConnectionEvents.DISCONNECT.register((handler, server) -> SuitPowers.onDisconnect(handler.getPlayer()));

		LOGGER.info("Mortal Kombat Heroes loaded - GET OVER HERE!");
	}
}
