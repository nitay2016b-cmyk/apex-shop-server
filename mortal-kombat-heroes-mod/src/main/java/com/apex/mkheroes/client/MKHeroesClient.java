package com.apex.mkheroes.client;

import com.apex.mkheroes.item.ModArmorMaterials;
import com.apex.mkheroes.item.ModItems;
import com.apex.mkheroes.power.SuitPowers;
import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.api.EnvType;
import net.fabricmc.api.Environment;
import net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientTickEvents;
import net.fabricmc.fabric.api.client.item.v1.ItemTooltipCallback;
import net.minecraft.client.network.ClientPlayerEntity;
import net.minecraft.text.Text;
import net.minecraft.util.Formatting;
import net.minecraft.util.math.Vec3d;

@Environment(EnvType.CLIENT)
public class MKHeroesClient implements ClientModInitializer {
	@Override
	public void onInitializeClient() {
		// First tooltip line on every item: which world and which hero it belongs to, e.g. "Marvel - Thanos".
		ItemTooltipCallback.EVENT.register((stack, context, type, lines) -> {
			ModItems.Universe universe = ModItems.UNIVERSE.get(stack.getItem());
			if (universe == null) {
				return;
			}
			Text label = Text.translatable("mkheroes.universe." + universe.id).formatted(universe.color, Formatting.BOLD)
					.append(Text.literal(" - ").formatted(Formatting.GRAY))
					.append(Text.translatable("mkheroes.hero." + ModItems.HERO.get(stack.getItem())).formatted(Formatting.WHITE));
			lines.add(Math.min(1, lines.size()), label);
		});

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
