package com.apex.mkheroes.item;

import com.apex.mkheroes.effect.ModEffects;
import com.apex.mkheroes.power.Powers;
import net.minecraft.entity.EntityType;
import net.minecraft.entity.LivingEntity;
import net.minecraft.entity.boss.WitherEntity;
import net.minecraft.entity.boss.dragon.EnderDragonEntity;
import net.minecraft.entity.effect.StatusEffectInstance;
import net.minecraft.entity.effect.StatusEffects;
import net.minecraft.entity.mob.MobEntity;
import net.minecraft.entity.passive.ChickenEntity;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.item.Item;
import net.minecraft.item.ItemStack;
import net.minecraft.item.tooltip.TooltipType;
import net.minecraft.particle.DustParticleEffect;
import net.minecraft.particle.ParticleTypes;
import net.minecraft.server.world.ServerWorld;
import net.minecraft.sound.SoundCategory;
import net.minecraft.sound.SoundEvents;
import net.minecraft.text.Text;
import net.minecraft.util.Formatting;
import net.minecraft.util.Hand;
import net.minecraft.util.TypedActionResult;
import net.minecraft.util.hit.BlockHitResult;
import net.minecraft.util.math.BlockPos;
import net.minecraft.util.math.Box;
import net.minecraft.util.math.Vec3d;
import net.minecraft.world.World;
import org.joml.Vector3f;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Thanos' Infinity Gauntlet with all six stones (and the Snap).
 * Sneak + right click: switch stone. Right click: use the selected stone.
 */
public class InfinityGauntletItem extends Item {
	public enum Stone {
		POWER("power", Formatting.DARK_PURPLE, 60, new Vector3f(0.6f, 0.1f, 0.9f)),
		SPACE("space", Formatting.BLUE, 20, new Vector3f(0.1f, 0.4f, 1.0f)),
		REALITY("reality", Formatting.RED, 80, new Vector3f(0.9f, 0.05f, 0.1f)),
		SOUL("soul", Formatting.GOLD, 40, new Vector3f(1.0f, 0.55f, 0.0f)),
		TIME("time", Formatting.GREEN, 100, new Vector3f(0.1f, 0.9f, 0.2f)),
		MIND("mind", Formatting.YELLOW, 100, new Vector3f(1.0f, 0.9f, 0.1f)),
		SNAP("snap", Formatting.WHITE, 600, new Vector3f(1.0f, 1.0f, 1.0f));

		public final String id;
		public final Formatting color;
		public final int cooldown;
		public final DustParticleEffect dust;

		Stone(String name, Formatting color, int cooldown, Vector3f rgb) {
			this.id = name;
			this.color = color;
			this.cooldown = cooldown;
			this.dust = new DustParticleEffect(rgb, 1.5f);
		}

		public Text title() {
			return Text.translatable("mkheroes.stone." + id).formatted(color, Formatting.BOLD);
		}
	}

	public InfinityGauntletItem(Settings settings) {
		super(settings);
	}

	public static Stone stone(ItemStack stack) {
		int i = stack.getOrDefault(ModComponents.STONE, 0);
		Stone[] all = Stone.values();
		return all[Math.floorMod(i, all.length)];
	}

	@Override
	public TypedActionResult<ItemStack> use(World world, PlayerEntity player, Hand hand) {
		ItemStack stack = player.getStackInHand(hand);
		if (world instanceof ServerWorld sw) {
			if (player.isSneaking()) {
				Stone next = Stone.values()[(stone(stack).ordinal() + 1) % Stone.values().length];
				stack.set(ModComponents.STONE, next.ordinal());
				player.sendMessage(Text.translatable("mkheroes.msg.stone_selected", next.title()), true);
				sw.playSound(null, player.getX(), player.getY(), player.getZ(), SoundEvents.BLOCK_AMETHYST_BLOCK_CHIME, SoundCategory.PLAYERS, 1.5f, 1.0f);
			} else {
				Stone s = stone(stack);
				if (Powers.ready(player, "stone_" + s.id, s.cooldown)) {
					switch (s) {
						case POWER -> power(sw, player);
						case SPACE -> space(sw, player);
						case REALITY -> reality(sw, player);
						case SOUL -> soul(sw, player);
						case TIME -> time(sw, player);
						case MIND -> mind(sw, player);
						case SNAP -> snap(sw, player);
					}
				}
			}
		}
		return TypedActionResult.success(stack, world.isClient());
	}

	/** Power Stone: a purple shockwave that smashes everything around where you aim. */
	private void power(ServerWorld world, PlayerEntity player) {
		Vec3d pt = Powers.aimPoint(player, 40);
		Powers.beam(world, Stone.POWER.dust, Powers.hand(player), pt, 0.3);
		world.spawnParticles(ParticleTypes.EXPLOSION_EMITTER, pt.x, pt.y, pt.z, 1, 0, 0, 0, 0);
		world.spawnParticles(Stone.POWER.dust, pt.x, pt.y, pt.z, 150, 3, 1.5, 3, 0);
		world.spawnParticles(ParticleTypes.WITCH, pt.x, pt.y, pt.z, 80, 3, 1.5, 3, 0.1);
		world.playSound(null, pt.x, pt.y, pt.z, SoundEvents.ENTITY_GENERIC_EXPLODE, SoundCategory.PLAYERS, 2.0f, 0.6f);
		world.playSound(null, pt.x, pt.y, pt.z, SoundEvents.ENTITY_WARDEN_SONIC_BOOM, SoundCategory.PLAYERS, 1.5f, 0.8f);
		for (LivingEntity e : around(world, player, pt, 6)) {
			e.damage(player.getDamageSources().playerAttack(player), 14.0f);
			Vec3d push = e.getPos().subtract(pt).multiply(1, 0, 1).normalize().multiply(2.2);
			Powers.velocity(e, new Vec3d(push.x, 0.9, push.z));
		}
	}

	/** Space Stone: teleport to where you look. */
	private void space(ServerWorld world, PlayerEntity player) {
		BlockHitResult hit = Powers.raycastBlock(player, 80);
		Vec3d dest;
		if (hit != null) {
			BlockPos pos = hit.getBlockPos().offset(hit.getSide());
			dest = new Vec3d(pos.getX() + 0.5, pos.getY(), pos.getZ() + 0.5);
		} else {
			dest = Powers.eye(player).add(player.getRotationVec(1.0f).multiply(40));
		}
		Vec3d from = player.getPos();
		world.spawnParticles(ParticleTypes.PORTAL, from.x, from.y + 1, from.z, 120, 0.5, 1, 0.5, 0.5);
		world.spawnParticles(Stone.SPACE.dust, from.x, from.y + 1, from.z, 60, 0.4, 1, 0.4, 0);
		world.playSound(null, from.x, from.y, from.z, SoundEvents.ENTITY_ENDERMAN_TELEPORT, SoundCategory.PLAYERS, 1.2f, 0.8f);
		player.requestTeleport(dest.x, dest.y, dest.z);
		player.fallDistance = 0;
		world.spawnParticles(ParticleTypes.REVERSE_PORTAL, dest.x, dest.y + 1, dest.z, 120, 0.5, 1, 0.5, 0.3);
		world.playSound(null, dest.x, dest.y, dest.z, SoundEvents.ENTITY_ENDERMAN_TELEPORT, SoundCategory.PLAYERS, 1.2f, 1.2f);
	}

	/** Reality Stone: mobs are turned into chickens, players see crazy illusions. */
	private void reality(ServerWorld world, PlayerEntity player) {
		LivingEntity target = Powers.raycastEntity(player, 30);
		if (target == null) {
			Powers.say(player, "mkheroes.msg.no_target", Formatting.GRAY);
			return;
		}
		Vec3d c = Powers.center(target);
		Powers.beam(world, Stone.REALITY.dust, Powers.hand(player), c, 0.3);
		world.spawnParticles(Stone.REALITY.dust, c.x, c.y, c.z, 100, 0.8, 1, 0.8, 0);
		world.playSound(null, c.x, c.y, c.z, SoundEvents.ENTITY_ILLUSIONER_CAST_SPELL, SoundCategory.PLAYERS, 1.5f, 0.7f);
		if (target instanceof MobEntity mob && !(mob instanceof ChickenEntity) && !(mob instanceof EnderDragonEntity) && !(mob instanceof WitherEntity)) {
			mob.convertTo(EntityType.CHICKEN, false);
		} else {
			target.addStatusEffect(new StatusEffectInstance(StatusEffects.NAUSEA, 200, 0));
			target.addStatusEffect(new StatusEffectInstance(StatusEffects.BLINDNESS, 60, 0));
			target.addStatusEffect(new StatusEffectInstance(StatusEffects.LEVITATION, 40, 1));
			target.damage(player.getDamageSources().magic(), 6.0f);
		}
	}

	/** Soul Stone: rip the life out of a target and heal yourself with it. */
	private void soul(ServerWorld world, PlayerEntity player) {
		LivingEntity target = Powers.raycastEntity(player, 30);
		if (target == null) {
			Powers.say(player, "mkheroes.msg.no_target", Formatting.GRAY);
			return;
		}
		Vec3d c = Powers.center(target);
		Powers.beam(world, Stone.SOUL.dust, c, Powers.hand(player), 0.3);
		Powers.beam(world, ParticleTypes.SOUL, c, Powers.hand(player), 1.0);
		world.spawnParticles(ParticleTypes.SOUL_FIRE_FLAME, c.x, c.y, c.z, 40, 0.4, 0.6, 0.4, 0.05);
		world.playSound(null, c.x, c.y, c.z, SoundEvents.ENTITY_WITHER_SHOOT, SoundCategory.PLAYERS, 1.0f, 1.4f);
		float before = target.getHealth();
		target.damage(player.getDamageSources().indirectMagic(player, player), 8.0f);
		float stolen = Math.max(before - Math.max(target.getHealth(), 0), 4.0f);
		player.heal(stolen);
	}

	/** Time Stone: stop time around you for 5 seconds and speed yourself up. */
	private void time(ServerWorld world, PlayerEntity player) {
		Vec3d c = player.getPos();
		world.spawnParticles(Stone.TIME.dust, c.x, c.y + 1, c.z, 200, 7, 2, 7, 0);
		world.spawnParticles(ParticleTypes.HAPPY_VILLAGER, c.x, c.y + 1, c.z, 60, 6, 2, 6, 0);
		world.playSound(null, c.x, c.y, c.z, SoundEvents.BLOCK_BEACON_ACTIVATE, SoundCategory.PLAYERS, 1.5f, 0.5f);
		world.playSound(null, c.x, c.y, c.z, SoundEvents.BLOCK_BELL_RESONATE, SoundCategory.PLAYERS, 1.5f, 1.0f);
		for (LivingEntity e : around(world, player, c, 15)) {
			e.addStatusEffect(new StatusEffectInstance(ModEffects.FROZEN, 100, 0, false, true, true));
			if (e instanceof PlayerEntity victim) {
				Powers.say(victim, "mkheroes.msg.time_stopped", Formatting.GREEN);
			}
		}
		player.addStatusEffect(new StatusEffectInstance(StatusEffects.SPEED, 100, 2));
		player.addStatusEffect(new StatusEffectInstance(StatusEffects.REGENERATION, 100, 1));
	}

	/** Mind Stone: mobs around you fight each other, players get dizzy. */
	private void mind(ServerWorld world, PlayerEntity player) {
		Vec3d c = player.getPos();
		world.spawnParticles(Stone.MIND.dust, c.x, c.y + 1, c.z, 200, 8, 2, 8, 0);
		world.spawnParticles(ParticleTypes.ENCHANT, c.x, c.y + 1, c.z, 150, 6, 2, 6, 1);
		world.playSound(null, c.x, c.y, c.z, SoundEvents.ENTITY_EVOKER_PREPARE_WONDER, SoundCategory.PLAYERS, 1.5f, 1.0f);
		List<MobEntity> mobs = new ArrayList<>();
		for (LivingEntity e : around(world, player, c, 20)) {
			if (e instanceof MobEntity mob) {
				mobs.add(mob);
			} else {
				e.addStatusEffect(new StatusEffectInstance(StatusEffects.NAUSEA, 200, 0));
				e.addStatusEffect(new StatusEffectInstance(StatusEffects.WEAKNESS, 200, 1));
			}
		}
		for (int i = 0; i < mobs.size(); i++) {
			MobEntity mob = mobs.get(i);
			mob.addStatusEffect(new StatusEffectInstance(StatusEffects.GLOWING, 200, 0));
			if (mobs.size() > 1) {
				mob.setTarget(mobs.get((i + 1) % mobs.size()));
			} else {
				mob.setTarget(null);
			}
		}
		Powers.say(player, "mkheroes.msg.mind", Formatting.YELLOW);
	}

	/** The Snap: half of all the mobs around you turn to dust. */
	private void snap(ServerWorld world, PlayerEntity player) {
		world.playSound(null, player.getX(), player.getY(), player.getZ(), SoundEvents.ENTITY_LIGHTNING_BOLT_THUNDER, SoundCategory.PLAYERS, 1.0f, 1.5f);
		world.playSound(null, player.getX(), player.getY(), player.getZ(), SoundEvents.BLOCK_NOTE_BLOCK_SNARE, SoundCategory.PLAYERS, 2.0f, 1.5f);
		List<LivingEntity> victims = new ArrayList<>();
		for (LivingEntity e : around(world, player, player.getPos(), 64)) {
			if (!(e instanceof PlayerEntity)) {
				victims.add(e);
			}
		}
		Collections.shuffle(victims);
		int count = victims.size() / 2 + (victims.size() % 2);
		for (int i = 0; i < count; i++) {
			LivingEntity e = victims.get(i);
			Vec3d c = Powers.center(e);
			world.spawnParticles(ParticleTypes.ASH, c.x, c.y, c.z, 60, 0.4, 0.8, 0.4, 0.02);
			world.spawnParticles(ParticleTypes.LARGE_SMOKE, c.x, c.y, c.z, 15, 0.3, 0.6, 0.3, 0.02);
			e.kill();
		}
		player.damage(player.getDamageSources().magic(), 4.0f);
		player.sendMessage(Text.translatable("mkheroes.msg.snap", count).formatted(Formatting.GOLD, Formatting.BOLD), true);
	}

	private static List<LivingEntity> around(ServerWorld world, PlayerEntity player, Vec3d center, double radius) {
		Box box = new Box(center.subtract(radius, radius, radius), center.add(radius, radius, radius));
		return world.getEntitiesByClass(LivingEntity.class, box, e -> e != player && e.isAlive() && !e.isSpectator()
				&& e.squaredDistanceTo(center) <= radius * radius);
	}

	@Override
	public void appendTooltip(ItemStack stack, TooltipContext context, List<Text> tooltip, TooltipType type) {
		tooltip.add(Text.translatable("mkheroes.tooltip.gauntlet.selected", stone(stack).title()));
		tooltip.add(Text.translatable("mkheroes.tooltip.gauntlet.1").formatted(Formatting.GRAY));
		tooltip.add(Text.translatable("mkheroes.tooltip.gauntlet.2").formatted(Formatting.GRAY));
		for (Stone s : Stone.values()) {
			tooltip.add(Text.literal(" - ").append(Text.translatable("mkheroes.stone." + s.id + ".desc")).formatted(s.color));
		}
	}
}
