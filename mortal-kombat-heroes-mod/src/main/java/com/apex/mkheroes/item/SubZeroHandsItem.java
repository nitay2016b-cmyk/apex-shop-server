package com.apex.mkheroes.item;

import com.apex.mkheroes.effect.ModEffects;
import com.apex.mkheroes.power.Powers;
import net.minecraft.block.Blocks;
import net.minecraft.entity.LivingEntity;
import net.minecraft.entity.effect.StatusEffectInstance;
import net.minecraft.entity.effect.StatusEffects;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.item.Item;
import net.minecraft.item.ItemStack;
import net.minecraft.item.tooltip.TooltipType;
import net.minecraft.particle.BlockStateParticleEffect;
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
 * Sub-Zero's hands.
 * Right click: ice blast - freezes the target solid for 5 seconds.
 * Sneak + right click: ice dagger stab - takes 5 hearts from the target.
 */
public class SubZeroHandsItem extends Item {
	public static final int FREEZE_TICKS = 5 * 20;
	public static final float STAB_DAMAGE = 10.0f; // 5 hearts

	public SubZeroHandsItem(Settings settings) {
		super(settings);
	}

	@Override
	public TypedActionResult<ItemStack> use(World world, PlayerEntity player, Hand hand) {
		ItemStack stack = player.getStackInHand(hand);
		if (world instanceof ServerWorld sw) {
			if (player.isSneaking()) {
				stab(sw, player);
			} else {
				freeze(sw, player);
			}
		}
		return TypedActionResult.success(stack, world.isClient());
	}

	public static void freezeEntity(ServerWorld world, LivingEntity target) {
		target.addStatusEffect(new StatusEffectInstance(ModEffects.FROZEN, FREEZE_TICKS, 0, false, true, true));
		target.addStatusEffect(new StatusEffectInstance(StatusEffects.MINING_FATIGUE, FREEZE_TICKS, 3, false, false, false));
		Vec3d c = Powers.center(target);
		world.spawnParticles(new BlockStateParticleEffect(ParticleTypes.BLOCK, Blocks.ICE.getDefaultState()), c.x, c.y, c.z, 60, 0.4, 0.8, 0.4, 0.1);
		world.spawnParticles(ParticleTypes.SNOWFLAKE, c.x, c.y, c.z, 40, 0.5, 0.8, 0.5, 0.02);
		world.playSound(null, target.getX(), target.getY(), target.getZ(), SoundEvents.BLOCK_GLASS_BREAK, SoundCategory.PLAYERS, 1.0f, 0.5f);
		world.playSound(null, target.getX(), target.getY(), target.getZ(), SoundEvents.ENTITY_PLAYER_HURT_FREEZE, SoundCategory.PLAYERS, 1.0f, 1.0f);
	}

	private void freeze(ServerWorld world, PlayerEntity player) {
		LivingEntity target = Powers.raycastEntity(player, 25);
		if (target == null) {
			Powers.say(player, "mkheroes.msg.no_target", Formatting.GRAY);
			return;
		}
		if (!Powers.ready(player, "subzero_freeze", 60)) {
			return;
		}
		Powers.beam(world, ParticleTypes.SNOWFLAKE, Powers.hand(player), Powers.center(target), 0.3);
		freezeEntity(world, target);
		Powers.say(player, "mkheroes.msg.frozen", Formatting.AQUA);
		if (target instanceof PlayerEntity victim) {
			Powers.say(victim, "mkheroes.msg.you_are_frozen", Formatting.AQUA);
		}
	}

	private void stab(ServerWorld world, PlayerEntity player) {
		LivingEntity target = Powers.raycastEntity(player, 5);
		if (target == null) {
			Powers.say(player, "mkheroes.msg.too_far", Formatting.GRAY);
			return;
		}
		if (!Powers.ready(player, "subzero_stab", 30)) {
			return;
		}
		Vec3d c = Powers.center(target);
		world.spawnParticles(new BlockStateParticleEffect(ParticleTypes.BLOCK, Blocks.PACKED_ICE.getDefaultState()), c.x, c.y, c.z, 30, 0.2, 0.3, 0.2, 0.2);
		world.spawnParticles(ParticleTypes.CRIT, c.x, c.y, c.z, 20, 0.3, 0.3, 0.3, 0.3);
		world.playSound(null, target.getX(), target.getY(), target.getZ(), SoundEvents.ITEM_TRIDENT_HIT, SoundCategory.PLAYERS, 1.2f, 1.4f);
		world.playSound(null, target.getX(), target.getY(), target.getZ(), SoundEvents.BLOCK_GLASS_BREAK, SoundCategory.PLAYERS, 0.8f, 1.6f);

		// Magic damage ignores armor, so the ice dagger always takes exactly 5 hearts.
		target.timeUntilRegen = 0;
		target.damage(player.getDamageSources().indirectMagic(player, player), STAB_DAMAGE);
		target.addStatusEffect(new StatusEffectInstance(StatusEffects.SLOWNESS, 40, 1));
	}

	@Override
	public boolean postHit(ItemStack stack, LivingEntity target, LivingEntity attacker) {
		target.addStatusEffect(new StatusEffectInstance(StatusEffects.SLOWNESS, 40, 1));
		target.setFrozenTicks(Math.max(target.getFrozenTicks(), 100));
		return true;
	}

	@Override
	public void appendTooltip(ItemStack stack, TooltipContext context, List<Text> tooltip, TooltipType type) {
		tooltip.add(Text.translatable("mkheroes.tooltip.subzero.1").formatted(Formatting.AQUA));
		tooltip.add(Text.translatable("mkheroes.tooltip.subzero.2").formatted(Formatting.BLUE));
	}
}
