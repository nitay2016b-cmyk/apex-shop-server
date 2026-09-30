package com.apex.mkheroes.item;

import com.apex.mkheroes.effect.ModEffects;
import com.apex.mkheroes.power.Powers;
import com.apex.mkheroes.power.WebSwing;
import net.minecraft.entity.LivingEntity;
import net.minecraft.entity.effect.StatusEffectInstance;
import net.minecraft.entity.effect.StatusEffects;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.item.Item;
import net.minecraft.item.ItemStack;
import net.minecraft.item.Items;
import net.minecraft.item.tooltip.TooltipType;
import net.minecraft.particle.DustParticleEffect;
import net.minecraft.particle.ItemStackParticleEffect;
import net.minecraft.particle.ParticleTypes;
import net.minecraft.server.world.ServerWorld;
import net.minecraft.sound.SoundCategory;
import net.minecraft.sound.SoundEvents;
import net.minecraft.text.Text;
import net.minecraft.util.Formatting;
import net.minecraft.util.Hand;
import net.minecraft.util.TypedActionResult;
import net.minecraft.util.UseAction;
import net.minecraft.util.hit.BlockHitResult;
import net.minecraft.util.math.Vec3d;
import net.minecraft.world.World;
import org.joml.Vector3f;

import java.util.List;

/**
 * Spider-Man's web shooter.
 * Right click: web blast to the face - the target can't see and can't move for 5 seconds.
 * Sneak + right click (hold): shoot a web line at a block and swing on it. Let go to fly off.
 */
public class WebShooterItem extends Item {
	public static final int WEB_TICKS = 5 * 20;
	private static final DustParticleEffect WEB = new DustParticleEffect(new Vector3f(0.95f, 0.95f, 0.95f), 0.8f);

	public WebShooterItem(Settings settings) {
		super(settings);
	}

	@Override
	public TypedActionResult<ItemStack> use(World world, PlayerEntity player, Hand hand) {
		ItemStack stack = player.getStackInHand(hand);
		if (player.isSneaking()) {
			BlockHitResult hit = Powers.raycastBlock(player, WebSwing.RANGE);
			if (hit == null) {
				if (!world.isClient()) {
					Powers.say(player, "mkheroes.msg.no_block", Formatting.GRAY);
				}
				return TypedActionResult.fail(stack);
			}
			WebSwing.start(player, hit.getPos());
			player.setCurrentHand(hand);
			if (world instanceof ServerWorld sw) {
				Powers.beam(sw, WEB, Powers.hand(player), hit.getPos(), 0.4);
				sw.playSound(null, player.getX(), player.getY(), player.getZ(), SoundEvents.ENTITY_FISHING_BOBBER_THROW, SoundCategory.PLAYERS, 1.0f, 1.6f);
			}
			return TypedActionResult.consume(stack);
		}
		if (world instanceof ServerWorld sw) {
			blast(sw, player);
		}
		return TypedActionResult.success(stack, world.isClient());
	}

	private void blast(ServerWorld world, PlayerEntity player) {
		LivingEntity target = Powers.raycastEntity(player, 30);
		if (target == null) {
			Powers.say(player, "mkheroes.msg.no_target", Formatting.GRAY);
			return;
		}
		if (!Powers.ready(player, "web_blast", 60)) {
			return;
		}
		Powers.beam(world, WEB, Powers.hand(player), target.getEyePos(), 0.3);
		target.addStatusEffect(new StatusEffectInstance(StatusEffects.BLINDNESS, WEB_TICKS, 0, false, false, true));
		target.addStatusEffect(new StatusEffectInstance(StatusEffects.DARKNESS, WEB_TICKS, 0, false, false, false));
		target.addStatusEffect(new StatusEffectInstance(ModEffects.WEBBED, WEB_TICKS, 0, false, true, true));
		Vec3d eye = target.getEyePos();
		world.spawnParticles(new ItemStackParticleEffect(ParticleTypes.ITEM, new ItemStack(Items.COBWEB)), eye.x, eye.y, eye.z, 40, 0.3, 0.3, 0.3, 0.05);
		world.spawnParticles(WEB, target.getX(), target.getY() + 0.5, target.getZ(), 40, 0.4, 0.6, 0.4, 0);
		world.playSound(null, target.getX(), target.getY(), target.getZ(), SoundEvents.ENTITY_SLIME_SQUISH, SoundCategory.PLAYERS, 1.2f, 1.3f);
		world.playSound(null, player.getX(), player.getY(), player.getZ(), SoundEvents.ENTITY_SPIDER_AMBIENT, SoundCategory.PLAYERS, 0.6f, 1.8f);
		Powers.say(player, "mkheroes.msg.webbed", Formatting.WHITE);
		if (target instanceof PlayerEntity victim) {
			Powers.say(victim, "mkheroes.msg.you_are_webbed", Formatting.WHITE);
		}
	}

	@Override
	public void usageTick(World world, LivingEntity user, ItemStack stack, int remainingUseTicks) {
		if (!(user instanceof PlayerEntity player)) {
			return;
		}
		WebSwing.Rope rope = WebSwing.get(player);
		if (world.isClient()) {
			if (rope != null && player.isMainPlayer()) {
				WebSwing.applyPhysics(player, rope);
			}
			return;
		}
		if (rope == null) {
			return;
		}
		player.fallDistance = 0;
		if (player.age % 2 == 0 && world instanceof ServerWorld sw) {
			Powers.beam(sw, WEB, WebSwing.attach(player), rope.anchor, 0.6);
		}
	}

	@Override
	public void onStoppedUsing(ItemStack stack, World world, LivingEntity user, int remainingUseTicks) {
		if (!(user instanceof PlayerEntity player)) {
			return;
		}
		if (world.isClient() && player.isMainPlayer() && WebSwing.get(player) != null) {
			// Let go: fling forward and up like Spider-Man.
			Vec3d look = player.getRotationVector();
			player.addVelocity(look.x * 0.35, 0.45, look.z * 0.35);
		}
		WebSwing.stop(player);
	}

	@Override
	public int getMaxUseTime(ItemStack stack, LivingEntity user) {
		return 72000;
	}

	@Override
	public UseAction getUseAction(ItemStack stack) {
		return UseAction.NONE;
	}

	@Override
	public void appendTooltip(ItemStack stack, TooltipContext context, List<Text> tooltip, TooltipType type) {
		tooltip.add(Text.translatable("mkheroes.tooltip.web.1").formatted(Formatting.WHITE));
		tooltip.add(Text.translatable("mkheroes.tooltip.web.2").formatted(Formatting.RED));
		tooltip.add(Text.translatable("mkheroes.tooltip.web.3").formatted(Formatting.BLUE));
	}
}
