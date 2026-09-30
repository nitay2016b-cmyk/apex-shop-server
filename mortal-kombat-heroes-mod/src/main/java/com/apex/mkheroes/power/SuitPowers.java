package com.apex.mkheroes.power;

import com.apex.mkheroes.effect.ModEffects;
import com.apex.mkheroes.item.ModArmorMaterials;
import net.minecraft.entity.effect.StatusEffect;
import net.minecraft.entity.effect.StatusEffectInstance;
import net.minecraft.entity.effect.StatusEffects;
import net.minecraft.entity.player.PlayerAbilities;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.item.ArmorItem;
import net.minecraft.item.ArmorMaterial;
import net.minecraft.item.ItemStack;
import net.minecraft.particle.ParticleTypes;
import net.minecraft.registry.entry.RegistryEntry;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.server.world.ServerWorld;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * Powers you only get while wearing a hero's FULL suit (helmet, chestplate, leggings and boots).
 */
public final class SuitPowers {
	private static final float IRON_MAN_FLY_SPEED = 0.1f;
	private static final float DEFAULT_FLY_SPEED = 0.05f;
	/** Players the Iron Man suit gave flight to (so we only take away flight we gave). */
	private static final Set<UUID> FLYERS = new HashSet<>();

	private SuitPowers() {
	}

	public static boolean isWearing(PlayerEntity player, RegistryEntry<ArmorMaterial> material) {
		for (ItemStack stack : player.getArmorItems()) {
			if (!(stack.getItem() instanceof ArmorItem armor) || armor.getMaterial().value() != material.value()) {
				return false;
			}
		}
		return true;
	}

	public static void tick(ServerPlayerEntity player) {
		boolean refresh = player.age % 20 == 0;

		if (isWearing(player, ModArmorMaterials.SCORPION)) {
			if (refresh) {
				buff(player, StatusEffects.FIRE_RESISTANCE, 0);
				buff(player, StatusEffects.STRENGTH, 0);
			}
		}

		if (isWearing(player, ModArmorMaterials.SUBZERO)) {
			if (refresh) {
				buff(player, StatusEffects.RESISTANCE, 0);
				buff(player, StatusEffects.SPEED, 0);
			}
			// Sub-Zero can't be frozen.
			player.setFrozenTicks(0);
			player.removeStatusEffect(ModEffects.FROZEN);
		}

		if (isWearing(player, ModArmorMaterials.SPIDERMAN)) {
			if (refresh) {
				buff(player, StatusEffects.JUMP_BOOST, 1);
				buff(player, StatusEffects.SPEED, 0);
			}
			// Spider-Man lands on his feet; wall climbing happens on the client (MKHeroesClient).
			player.fallDistance = 0;
			player.removeStatusEffect(ModEffects.WEBBED);
		}

		if (isWearing(player, ModArmorMaterials.THANOS)) {
			if (refresh) {
				buff(player, StatusEffects.STRENGTH, 1);
				buff(player, StatusEffects.RESISTANCE, 1);
			}
		}

		ironMan(player, isWearing(player, ModArmorMaterials.IRONMAN), refresh);

		if (WebSwing.recentlySwung(player)) {
			player.fallDistance = 0;
		}
	}

	private static void ironMan(ServerPlayerEntity player, boolean wearing, boolean refresh) {
		PlayerAbilities abilities = player.getAbilities();
		if (wearing) {
			if (refresh) {
				buff(player, StatusEffects.FIRE_RESISTANCE, 0);
				buff(player, StatusEffects.RESISTANCE, 0);
				buff(player, StatusEffects.NIGHT_VISION, 0);
			}
			boolean changed = false;
			if (!abilities.allowFlying) {
				abilities.allowFlying = true;
				FLYERS.add(player.getUuid());
				changed = true;
			}
			if (FLYERS.contains(player.getUuid()) && abilities.getFlySpeed() != IRON_MAN_FLY_SPEED) {
				abilities.setFlySpeed(IRON_MAN_FLY_SPEED);
				changed = true;
			}
			if (changed) {
				player.sendAbilitiesUpdate();
			}
			if (abilities.flying) {
				player.fallDistance = 0;
				ServerWorld world = player.getServerWorld();
				world.spawnParticles(ParticleTypes.FLAME, player.getX(), player.getY() - 0.1, player.getZ(), 2, 0.12, 0.05, 0.12, 0.01);
				world.spawnParticles(ParticleTypes.SMOKE, player.getX(), player.getY() - 0.3, player.getZ(), 1, 0.1, 0.05, 0.1, 0.01);
			}
		} else if (FLYERS.remove(player.getUuid())) {
			removeFlight(player);
		}
	}

	private static void removeFlight(ServerPlayerEntity player) {
		PlayerAbilities abilities = player.getAbilities();
		if (!player.isCreative() && !player.isSpectator()) {
			abilities.allowFlying = false;
			abilities.flying = false;
		}
		abilities.setFlySpeed(DEFAULT_FLY_SPEED);
		player.sendAbilitiesUpdate();
	}

	public static void onDisconnect(ServerPlayerEntity player) {
		if (FLYERS.remove(player.getUuid())) {
			removeFlight(player);
		}
		WebSwing.clear(player.getUuid());
		Powers.clear(player.getUuid());
	}

	private static void buff(PlayerEntity player, RegistryEntry<StatusEffect> effect, int amplifier) {
		int duration = effect == StatusEffects.NIGHT_VISION ? 300 : 60;
		player.addStatusEffect(new StatusEffectInstance(effect, duration, amplifier, true, false, true));
	}
}
