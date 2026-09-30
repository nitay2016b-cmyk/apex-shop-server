package com.apex.mkheroes.power;

import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.util.math.Vec3d;
import org.jetbrains.annotations.Nullable;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/** Keeps the web line of every swinging player and does the pendulum physics. */
public final class WebSwing {
	public static final double RANGE = 48;

	private static final Map<UUID, Rope> CLIENT = new HashMap<>();
	private static final Map<UUID, Rope> SERVER = new HashMap<>();
	/** Server time when each player let go of their last web, for fall-damage protection. */
	private static final Map<UUID, Long> LAST_RELEASE = new HashMap<>();

	private WebSwing() {
	}

	public static final class Rope {
		public final Vec3d anchor;
		public double length;

		Rope(Vec3d anchor, double length) {
			this.anchor = anchor;
			this.length = length;
		}
	}

	private static Map<UUID, Rope> side(PlayerEntity player) {
		return player.getWorld().isClient() ? CLIENT : SERVER;
	}

	public static void start(PlayerEntity player, Vec3d anchor) {
		side(player).put(player.getUuid(), new Rope(anchor, Math.max(3.0, attach(player).distanceTo(anchor))));
	}

	@Nullable
	public static Rope get(PlayerEntity player) {
		return side(player).get(player.getUuid());
	}

	public static void stop(PlayerEntity player) {
		if (side(player).remove(player.getUuid()) != null && !player.getWorld().isClient()) {
			LAST_RELEASE.put(player.getUuid(), player.getWorld().getTime());
		}
	}

	public static boolean recentlySwung(PlayerEntity player) {
		if (SERVER.containsKey(player.getUuid())) {
			return true;
		}
		Long released = LAST_RELEASE.get(player.getUuid());
		return released != null && player.getWorld().getTime() - released < 100;
	}

	public static void clear(UUID uuid) {
		SERVER.remove(uuid);
		LAST_RELEASE.remove(uuid);
	}

	/** Point on the player where the web is attached (the raised hand). */
	public static Vec3d attach(PlayerEntity player) {
		return player.getPos().add(0, player.getHeight() * 0.85, 0);
	}

	/** Runs on the swinging player's own client, which is in charge of its movement. */
	public static void applyPhysics(PlayerEntity player, Rope rope) {
		Vec3d toAnchor = rope.anchor.subtract(attach(player));
		double dist = toAnchor.length();
		if (dist < 1.2) {
			return;
		}
		Vec3d dir = toAnchor.multiply(1.0 / dist);
		Vec3d v = player.getVelocity();

		// Reel the web in a little every tick so you gain height while swinging.
		rope.length = Math.max(3.0, rope.length - 0.08);
		if (dist > rope.length) {
			double radial = v.dotProduct(dir);
			if (radial < 0) {
				v = v.subtract(dir.multiply(radial));
			}
			v = v.add(dir.multiply(Math.min((dist - rope.length) * 0.2, 0.7)));
		}

		// Steer with where you look.
		Vec3d look = player.getRotationVector();
		v = v.add(look.x * 0.045, 0, look.z * 0.045);

		double max = 2.4;
		if (v.length() > max) {
			v = v.normalize().multiply(max);
		}
		player.setVelocity(v);
		player.fallDistance = 0;
	}
}
