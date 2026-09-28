package com.apexshop.ghostharvest;

import com.apexshop.ghostharvest.entity.GhostHarvestEntities;
import com.apexshop.ghostharvest.interaction.GrabInteractionHandler;
import com.apexshop.ghostharvest.item.GhostHarvestItems;
import com.apexshop.ghostharvest.network.ExtractPartC2SPayload;
import com.apexshop.ghostharvest.network.MenuStateS2CPayload;
import com.apexshop.ghostharvest.part.ExtractionManager;

import net.fabricmc.api.ModInitializer;
import net.fabricmc.fabric.api.entity.event.v1.ServerEntityEvents;
import net.fabricmc.fabric.api.networking.v1.PayloadTypeRegistry;
import net.fabricmc.fabric.api.networking.v1.ServerPlayNetworking;
import net.minecraft.entity.LivingEntity;

public class GhostHarvestMod implements ModInitializer {

	@Override
	public void onInitialize() {
		GhostHarvestItems.register();
		GhostHarvestEntities.register();

		PayloadTypeRegistry.playC2S().register(ExtractPartC2SPayload.ID, ExtractPartC2SPayload.CODEC);
		PayloadTypeRegistry.playS2C().register(MenuStateS2CPayload.ID, MenuStateS2CPayload.CODEC);

		ServerPlayNetworking.registerGlobalReceiver(ExtractPartC2SPayload.ID, (payload, context) ->
				context.server().execute(() ->
						GrabInteractionHandler.extractPart(context.player(), payload.entityId(), payload.partId())));

		GrabInteractionHandler.register();

		// Progress is only kept in memory (see ExtractionManager); drop it once
		// the mob is gone so it can't leak.
		ServerEntityEvents.ENTITY_UNLOAD.register((entity, world) -> {
			if (entity instanceof LivingEntity livingEntity) {
				ExtractionManager.clear(livingEntity);
			}
		});
	}
}
