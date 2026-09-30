package com.apex.mkheroes.item;

import com.apex.mkheroes.power.Powers;
import com.apex.mkheroes.power.SuitPowers;
import net.minecraft.entity.LivingEntity;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.item.Item;
import net.minecraft.item.ItemStack;
import net.minecraft.item.tooltip.TooltipType;
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

import java.util.List;

/**
 * Iron Man's gauntlet.
 * Right click: repulsor blast.
 * Sneak + right click: micro-missile (explodes, does not break blocks).
 * With the full Iron Man suit the blasts are stronger and you can fly (double jump).
 */
public class IronManGauntletItem extends Item {
	public IronManGauntletItem(Settings settings) {
		super(settings);
	}

	@Override
	public TypedActionResult<ItemStack> use(World world, PlayerEntity player, Hand hand) {
		ItemStack stack = player.getStackInHand(hand);
		if (world instanceof ServerWorld sw) {
			if (player.isSneaking()) {
				missile(sw, player);
			} else {
				repulsor(sw, player);
			}
		}
		return TypedActionResult.success(stack, world.isClient());
	}

	private void repulsor(ServerWorld world, PlayerEntity player) {
		if (!Powers.ready(player, "ironman_repulsor", 15)) {
			return;
		}
		boolean suit = SuitPowers.isWearing(player, ModArmorMaterials.IRONMAN);
		LivingEntity target = Powers.raycastEntity(player, 40);
		Vec3d end = target != null ? Powers.center(target) : Powers.aimPoint(player, 40);
		Powers.beam(world, ParticleTypes.END_ROD, Powers.hand(player), end, 0.4);
		Powers.beam(world, ParticleTypes.ELECTRIC_SPARK, Powers.hand(player), end, 0.8);
		world.spawnParticles(ParticleTypes.FIREWORK, end.x, end.y, end.z, 15, 0.2, 0.2, 0.2, 0.1);
		world.playSound(null, player.getX(), player.getY(), player.getZ(), SoundEvents.BLOCK_BEACON_POWER_SELECT, SoundCategory.PLAYERS, 1.0f, 2.0f);
		world.playSound(null, player.getX(), player.getY(), player.getZ(), SoundEvents.ENTITY_BLAZE_SHOOT, SoundCategory.PLAYERS, 0.5f, 1.8f);
		if (target != null) {
			target.damage(player.getDamageSources().playerAttack(player), suit ? 10.0f : 7.0f);
			Vec3d push = player.getRotationVec(1.0f).multiply(suit ? 2.0 : 1.4);
			Powers.velocity(target, new Vec3d(push.x, 0.4 + push.y * 0.3, push.z));
		}
	}

	private void missile(ServerWorld world, PlayerEntity player) {
		boolean suit = SuitPowers.isWearing(player, ModArmorMaterials.IRONMAN);
		Vec3d end = Powers.aimPoint(player, 60);
		if (end.distanceTo(player.getPos()) < 4) {
			Powers.say(player, "mkheroes.msg.too_close", Formatting.GRAY);
			return;
		}
		if (!Powers.ready(player, "ironman_missile", 60)) {
			return;
		}
		Powers.beam(world, ParticleTypes.SMOKE, Powers.hand(player), end, 0.5);
		Powers.beam(world, ParticleTypes.FLAME, Powers.hand(player), end, 1.5);
		world.playSound(null, player.getX(), player.getY(), player.getZ(), SoundEvents.ENTITY_FIREWORK_ROCKET_LAUNCH, SoundCategory.PLAYERS, 1.5f, 0.8f);
		world.createExplosion(player, end.x, end.y, end.z, suit ? 3.5f : 2.5f, false, World.ExplosionSourceType.NONE);
	}

	@Override
	public void appendTooltip(ItemStack stack, TooltipContext context, List<Text> tooltip, TooltipType type) {
		tooltip.add(Text.translatable("mkheroes.tooltip.ironman.1").formatted(Formatting.GOLD));
		tooltip.add(Text.translatable("mkheroes.tooltip.ironman.2").formatted(Formatting.RED));
		tooltip.add(Text.translatable("mkheroes.tooltip.ironman.3").formatted(Formatting.YELLOW));
	}
}
