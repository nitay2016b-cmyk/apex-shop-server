package com.apexshop.ghostharvest.client;

import com.apexshop.ghostharvest.client.gui.ExtractionScreen;
import com.apexshop.ghostharvest.client.render.GhostFollowerEntityRenderer;
import com.apexshop.ghostharvest.entity.GhostHarvestEntities;
import com.apexshop.ghostharvest.network.MenuStateS2CPayload;
import com.apexshop.ghostharvest.part.PartStateCodec;

import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.networking.v1.ClientPlayNetworking;
import net.fabricmc.fabric.api.client.rendering.v1.EntityRendererRegistry;
import net.minecraft.client.MinecraftClient;
import net.minecraft.client.gui.screen.Screen;

public class GhostHarvestClient implements ClientModInitializer {

	@Override
	public void onInitializeClient() {
		EntityRendererRegistry.register(GhostHarvestEntities.GHOST_FOLLOWER, GhostFollowerEntityRenderer::new);

		ClientPlayNetworking.registerGlobalReceiver(MenuStateS2CPayload.ID, (payload, context) ->
				context.client().execute(() -> handleMenuState(payload)));
	}

	private static void handleMenuState(MenuStateS2CPayload payload) {
		MinecraftClient client = MinecraftClient.getInstance();

		if (!payload.entityAlive()) {
			if (client.currentScreen instanceof ExtractionScreen screen && screen.getEntityId() == payload.entityId()) {
				client.setScreen(null);
			}
			return;
		}

		Screen screen = new ExtractionScreen(payload.entityId(), payload.mobTranslationKey(),
				PartStateCodec.decode(payload.encodedParts()));
		client.setScreen(screen);
	}
}
