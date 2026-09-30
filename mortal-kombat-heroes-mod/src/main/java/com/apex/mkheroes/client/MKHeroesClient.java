package com.apex.mkheroes.client;

import com.apex.mkheroes.item.ModArmorMaterials;
import com.apex.mkheroes.power.SuitPowers;
import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.api.EnvType;
import net.fabricmc.api.Environment;
import net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientTickEvents;
import net.minecraft.client.network.ClientPlayerEntity;
import net.minecraft.util.math.Vec3d;

@Environment(EnvType.CLIENT)
public class MKHeroesClient implements ClientModInitializer {
	@Override
	public void onInitializeClient() {
		ClientTickEvents.END_CLIENT_TICK.register(client -> {
			ClientPlayerEntity player = client.player;
			if (player == null || player.getAbilities().flying || player.isSpectator()) {
				return;
			}
			// Spider-Man suit: climb any wall. Walk into it to climb up, sneak to stick in place.
			if (player.horizontalCollision && SuitPowers.isWearing(player, ModArmorMaterials.SPIDERMAN)) {
				Vec3d v = player.getVelocity();
				double y = player.isSneaking() ? 0.0 : 0.25;
				player.setVelocity(v.x, y, v.z);
				player.fallDistance = 0;
			}
		});
	}
}
