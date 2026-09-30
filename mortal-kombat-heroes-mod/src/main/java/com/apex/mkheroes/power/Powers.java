package com.apex.mkheroes.power;

import net.minecraft.entity.Entity;
import net.minecraft.entity.LivingEntity;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.particle.ParticleEffect;
import net.minecraft.server.world.ServerWorld;
import net.minecraft.text.Text;
import net.minecraft.util.Formatting;
import net.minecraft.util.hit.BlockHitResult;
import net.minecraft.util.hit.HitResult;
import net.minecraft.util.math.Box;
import net.minecraft.util.math.Vec3d;
import net.minecraft.world.RaycastContext;
import org.jetbrains.annotations.Nullable;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/** Shared helpers for every hero ability: aiming, particle beams and cooldowns. */
public final class Powers {
	private static final Map<UUID, Map<String, Integer>> COOLDOWNS = new HashMap<>();

	private Powers() {
	}

	public static Vec3d eye(PlayerEntity player) {
		return player.getCameraPosVec(1.0f);
	}

	/** The block the player is looking at, or null. */
	@Nullable
	public static BlockHitResult raycastBlock(PlayerEntity player, double range) {
		Vec3d start = eye(player);
		Vec3d end = start.add(player.getRotationVec(1.0f).multiply(range));
		BlockHitResult hit = player.getWorld().raycast(new RaycastContext(start, end, RaycastContext.ShapeType.COLLIDER, RaycastContext.FluidHandling.NONE, player));
		return hit.getType() == HitResult.Type.BLOCK ? hit : null;
	}

	/** The living entity the player is aiming at (with a little aim assist), or null. Walls block the aim. */
	@Nullable
	public static LivingEntity raycastEntity(PlayerEntity player, double range) {
		Vec3d start = eye(player);
		Vec3d look = player.getRotationVec(1.0f);
		Vec3d end = start.add(look.multiply(range));
		BlockHitResult blockHit = raycastBlock(player, range);
		if (blockHit != null) {
			end = blockHit.getPos();
		}
		Box search = player.getBoundingBox().stretch(look.multiply(range)).expand(1.5);
		LivingEntity best = null;
		double bestDist = Double.MAX_VALUE;
		for (Entity entity : player.getWorld().getOtherEntities(player, search, e -> e instanceof LivingEntity && e.isAlive() && !e.isSpectator())) {
			Box box = entity.getBoundingBox().expand(0.5);
			Vec3d hit = box.contains(start) ? start : box.raycast(start, end).orElse(null);
			if (hit != null) {
				double dist = start.squaredDistanceTo(hit);
				if (dist < bestDist) {
					bestDist = dist;
					best = (LivingEntity) entity;
				}
			}
		}
		return best;
	}

	/** Where the player's aim lands: an entity, a block, or the end of the range. */
	public static Vec3d aimPoint(PlayerEntity player, double range) {
		LivingEntity target = raycastEntity(player, range);
		if (target != null) {
			return target.getPos().add(0, target.getHeight() / 2, 0);
		}
		BlockHitResult block = raycastBlock(player, range);
		if (block != null) {
			return block.getPos();
		}
		return eye(player).add(player.getRotationVec(1.0f).multiply(range));
	}

	public static Vec3d center(Entity entity) {
		return entity.getPos().add(0, entity.getHeight() / 2, 0);
	}

	/** Draws a particle line between two points (visible to everyone). */
	public static void beam(ServerWorld world, ParticleEffect particle, Vec3d from, Vec3d to, double step) {
		Vec3d diff = to.subtract(from);
		double length = diff.length();
		if (length < 0.01) {
			return;
		}
		Vec3d dir = diff.multiply(1.0 / length);
		for (double d = 0; d <= length; d += step) {
			Vec3d p = from.add(dir.multiply(d));
			world.spawnParticles(particle, p.x, p.y, p.z, 1, 0, 0, 0, 0);
		}
	}

	/** Hand position slightly in front of and below the eyes, where beams start. */
	public static Vec3d hand(PlayerEntity player) {
		return eye(player).add(player.getRotationVec(1.0f).multiply(0.6)).add(0, -0.3, 0);
	}

	/**
	 * Returns true (and starts the cooldown) if the ability is ready. Otherwise tells the player how long to wait.
	 */
	public static boolean ready(PlayerEntity player, String ability, int ticks) {
		int now = player.getServer() != null ? player.getServer().getTicks() : 0;
		Map<String, Integer> map = COOLDOWNS.computeIfAbsent(player.getUuid(), u -> new HashMap<>());
		Integer readyAt = map.get(ability);
		if (readyAt != null && readyAt > now) {
			double seconds = (readyAt - now) / 20.0;
			player.sendMessage(Text.translatable("mkheroes.msg.cooldown", String.format("%.1f", seconds)).formatted(Formatting.GRAY), true);
			return false;
		}
		map.put(ability, now + ticks);
		return true;
	}

	public static void clear(UUID uuid) {
		COOLDOWNS.remove(uuid);
	}

	public static void say(PlayerEntity player, String key, Formatting color) {
		player.sendMessage(Text.translatable(key).formatted(color, Formatting.BOLD), true);
	}

	public static void velocity(Entity entity, Vec3d velocity) {
		entity.setVelocity(velocity);
		entity.velocityModified = true;
	}
}
