package com.apex.mkheroes.item;

import com.apex.mkheroes.power.Powers;
import net.minecraft.entity.LivingEntity;
import net.minecraft.entity.effect.StatusEffectInstance;
import net.minecraft.entity.effect.StatusEffects;
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
import net.minecraft.util.math.Vec3d;
import net.minecraft.world.World;
import org.joml.Vector3f;

import java.util.List;

/**
 * Scorpion's hands.
 * Right click: spear on a chain - "GET OVER HERE!" pulls the target to you.
 * Sneak + right click: hellfire punch - huge hit that sets the target on fire.
 */
public class ScorpionHandsItem extends Item {
	private static final DustParticleEffect CHAIN = new DustParticleEffect(new Vector3f(0.55f, 0.55f, 0.6f), 1.0f);

	public ScorpionHandsItem(Settings settings) {
		super(settings);
	}

	@Override
	public TypedActionResult<ItemStack> use(World world, PlayerEntity player, Hand hand) {
		ItemStack stack = player.getStackInHand(hand);
		if (world instanceof ServerWorld sw) {
			if (player.isSneaking()) {
				punch(sw, player);
			} else {
				spear(sw, player);
			}
		}
		return TypedActionResult.success(stack, world.isClient());
	}

	private void spear(ServerWorld world, PlayerEntity player) {
		LivingEntity target = Powers.raycastEntity(player, 30);
		if (target == null) {
			Powers.say(player, "mkheroes.msg.no_target", Formatting.GRAY);
			return;
		}
		if (!Powers.ready(player, "scorpion_spear", 40)) {
			return;
		}
		Powers.beam(world, CHAIN, Powers.hand(player), Powers.center(target), 0.35);
		world.playSound(null, player.getX(), player.getY(), player.getZ(), SoundEvents.ENTITY_FISHING_BOBBER_THROW, SoundCategory.PLAYERS, 1.5f, 0.6f);
		world.playSound(null, target.getX(), target.getY(), target.getZ(), SoundEvents.BLOCK_CHAIN_HIT, SoundCategory.PLAYERS, 1.5f, 1.0f);

		target.damage(player.getDamageSources().playerAttack(player), 3.0f);
		Vec3d diff = player.getPos().subtract(target.getPos());
		double dist = diff.length();
		Vec3d flat = new Vec3d(diff.x, 0, diff.z).normalize();
		double speed = Math.min(0.8 + dist * 0.16, 3.5);
		Powers.velocity(target, new Vec3d(flat.x * speed, 0.35 + Math.max(diff.y, 0) * 0.12, flat.z * speed));
		target.addStatusEffect(new StatusEffectInstance(StatusEffects.SLOWNESS, 30, 2));

		Powers.say(player, "mkheroes.msg.get_over_here", Formatting.GOLD);
		if (target instanceof PlayerEntity victim) {
			Powers.say(victim, "mkheroes.msg.get_over_here", Formatting.GOLD);
		}
	}

	private void punch(ServerWorld world, PlayerEntity player) {
		LivingEntity target = Powers.raycastEntity(player, 5);
		if (target == null) {
			Powers.say(player, "mkheroes.msg.too_far", Formatting.GRAY);
			return;
		}
		if (!Powers.ready(player, "scorpion_punch", 20)) {
			return;
		}
		Vec3d c = Powers.center(target);
		world.spawnParticles(ParticleTypes.FLAME, c.x, c.y, c.z, 40, 0.3, 0.5, 0.3, 0.08);
		world.spawnParticles(ParticleTypes.LAVA, c.x, c.y, c.z, 6, 0.3, 0.3, 0.3, 0);
		world.playSound(null, target.getX(), target.getY(), target.getZ(), SoundEvents.ENTITY_BLAZE_SHOOT, SoundCategory.PLAYERS, 1.2f, 0.7f);
		world.playSound(null, target.getX(), target.getY(), target.getZ(), SoundEvents.ENTITY_PLAYER_ATTACK_CRIT, SoundCategory.PLAYERS, 1.2f, 0.8f);

		target.damage(player.getDamageSources().playerAttack(player), 9.0f);
		target.setOnFireFor(5);
		Vec3d push = target.getPos().subtract(player.getPos()).multiply(1, 0, 1).normalize().multiply(1.6);
		Powers.velocity(target, new Vec3d(push.x, 0.45, push.z));
	}

	@Override
	public boolean postHit(ItemStack stack, LivingEntity target, LivingEntity attacker) {
		target.setOnFireFor(3);
		return true;
	}

	@Override
	public void appendTooltip(ItemStack stack, TooltipContext context, List<Text> tooltip, TooltipType type) {
		tooltip.add(Text.translatable("mkheroes.tooltip.scorpion.1").formatted(Formatting.GOLD));
		tooltip.add(Text.translatable("mkheroes.tooltip.scorpion.2").formatted(Formatting.RED));
	}
}
