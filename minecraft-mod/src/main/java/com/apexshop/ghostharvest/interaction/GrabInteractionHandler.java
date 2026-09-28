package com.apexshop.ghostharvest.interaction;

import com.apexshop.ghostharvest.entity.GhostFollowerEntity;
import com.apexshop.ghostharvest.entity.GhostHarvestEntities;
import com.apexshop.ghostharvest.item.GhostHarvestItems;
import com.apexshop.ghostharvest.network.MenuStateS2CPayload;
import com.apexshop.ghostharvest.part.ExtractionManager;
import com.apexshop.ghostharvest.part.ExtractionProgress;
import com.apexshop.ghostharvest.part.MobPartRegistry;
import com.apexshop.ghostharvest.part.PartDefinition;
import com.apexshop.ghostharvest.part.PartState;
import com.apexshop.ghostharvest.part.PartStateCodec;

import net.fabricmc.fabric.api.event.player.UseEntityCallback;
import net.fabricmc.fabric.api.networking.v1.ServerPlayNetworking;
import net.minecraft.entity.Entity;
import net.minecraft.entity.EntityType;
import net.minecraft.entity.LivingEntity;
import net.minecraft.entity.ItemEntity;
import net.minecraft.item.ItemStack;
import net.minecraft.particle.ParticleTypes;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.server.world.ServerWorld;
import net.minecraft.sound.SoundCategory;
import net.minecraft.sound.SoundEvents;
import net.minecraft.util.ActionResult;
import net.minecraft.util.Hand;

import java.util.List;

/**
 * Server-side brains of the mod: right-clicking a supported mob with the
 * Extraction Hook opens the menu instead of the vanilla trade/interact
 * behaviour, and picking a part there routes back here to actually take it.
 */
public final class GrabInteractionHandler {

	private GrabInteractionHandler() {
	}

	public static void register() {
		UseEntityCallback.EVENT.register((player, world, hand, entity, hitResult) -> {
			if (world.isClient() || hand != Hand.MAIN_HAND) {
				return ActionResult.PASS;
			}
			if (!(entity instanceof LivingEntity target) || !target.isAlive()) {
				return ActionResult.PASS;
			}
			if (!player.getStackInHand(hand).isOf(GhostHarvestItems.EXTRACTION_HOOK)) {
				return ActionResult.PASS;
			}
			if (!MobPartRegistry.isSupported(target.getType())) {
				return ActionResult.PASS;
			}
			if (player instanceof ServerPlayerEntity serverPlayer) {
				openMenu(serverPlayer, target);
			}
			return ActionResult.SUCCESS;
		});
	}

	private static void openMenu(ServerPlayerEntity player, LivingEntity target) {
		sendMenuState(player, target, MobPartRegistry.get(target.getType()), true);
	}

	public static void extractPart(ServerPlayerEntity player, int entityId, String partId) {
		Entity entity = player.getWorld().getEntityById(entityId);
		if (!(entity instanceof LivingEntity target) || !target.isAlive()) {
			return;
		}
		if (player.squaredDistanceTo(target) > 8 * 8) {
			return;
		}

		List<PartDefinition> parts = MobPartRegistry.get(target.getType());
		PartDefinition part = parts.stream().filter(candidate -> candidate.id().equals(partId)).findFirst().orElse(null);
		if (part == null) {
			return;
		}

		ExtractionProgress progress = ExtractionManager.get(target);
		if (!part.instantKill() && !progress.hasRemaining(part)) {
			return;
		}

		ServerWorld world = (ServerWorld) target.getWorld();
		dropPart(world, target, part);
		progress.extractOne(part);
		playExtractionFeedback(world, target);

		boolean dead = part.instantKill() || progress.isFullyDepleted(parts);
		if (dead) {
			killAndSpawnGhost(world, target, player);
			sendMenuState(player, target, List.of(), false);
		} else {
			sendMenuState(player, target, parts, true);
		}
	}

	private static void dropPart(ServerWorld world, LivingEntity target, PartDefinition part) {
		ItemStack stack = part.dropItem().get();
		ItemEntity itemEntity = new ItemEntity(world, target.getX(), target.getBodyY(0.5), target.getZ(), stack);
		itemEntity.setVelocity(0, 0.2, 0);
		world.spawnEntity(itemEntity);
	}

	private static void playExtractionFeedback(ServerWorld world, LivingEntity target) {
		world.spawnParticles(ParticleTypes.DAMAGE_INDICATOR,
				target.getX(), target.getBodyY(0.5), target.getZ(), 6, 0.3, 0.3, 0.3, 0.0);
		world.playSound(null, target.getBlockPos(), SoundEvents.ENTITY_GENERIC_HURT, SoundCategory.HOSTILE, 1.0f, 1.0f);
	}

	private static void killAndSpawnGhost(ServerWorld world, LivingEntity target, ServerPlayerEntity player) {
		EntityType<?> sourceType = target.getType();
		target.kill(world);

		GhostFollowerEntity ghost = new GhostFollowerEntity(GhostHarvestEntities.GHOST_FOLLOWER, world);
		ghost.refreshPositionAndAngles(target.getX(), target.getY() + 0.5, target.getZ(), target.getYaw(), 0);
		ghost.setSourceType(sourceType);
		ghost.setOwner(player);
		world.spawnEntity(ghost);

		ExtractionManager.clear(target);
		world.spawnParticles(ParticleTypes.SOUL,
				target.getX(), target.getBodyY(0.5), target.getZ(), 20, 0.3, 0.5, 0.3, 0.05);
		world.playSound(null, target.getBlockPos(), SoundEvents.ENTITY_WITHER_AMBIENT, SoundCategory.HOSTILE, 0.6f, 1.4f);
	}

	private static void sendMenuState(ServerPlayerEntity player, LivingEntity target, List<PartDefinition> parts, boolean alive) {
		ExtractionProgress progress = ExtractionManager.get(target);
		List<PartState> states = parts.stream()
				.map(part -> new PartState(part.id(), part.translationKey(), progress.remaining(part), part.instantKill()))
				.toList();
		String encoded = PartStateCodec.encode(states);
		String mobKey = target.getType().getTranslationKey();
		ServerPlayNetworking.send(player, new MenuStateS2CPayload(target.getId(), mobKey, encoded, alive));
	}
}
