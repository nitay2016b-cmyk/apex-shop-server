package com.apex.mkheroes.effect;

import com.apex.mkheroes.MKHeroes;
import net.minecraft.entity.LivingEntity;
import net.minecraft.entity.attribute.EntityAttributeModifier;
import net.minecraft.entity.attribute.EntityAttributes;
import net.minecraft.entity.effect.StatusEffect;
import net.minecraft.entity.effect.StatusEffectCategory;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.registry.entry.RegistryEntry;

public final class ModEffects {
	/** Sub-Zero's ice: the target cannot move or jump. */
	public static final RegistryEntry<StatusEffect> FROZEN = register("frozen", new ImmobilizedEffect(0x9BE7FF, true));
	/** Spider-Man's web: the target cannot move or jump. */
	public static final RegistryEntry<StatusEffect> WEBBED = register("webbed", new ImmobilizedEffect(0xEEEEEE, false));

	private ModEffects() {
	}

	private static RegistryEntry<StatusEffect> register(String name, StatusEffect effect) {
		effect.addAttributeModifier(EntityAttributes.GENERIC_MOVEMENT_SPEED, MKHeroes.id(name + "_speed"), -1.0, EntityAttributeModifier.Operation.ADD_MULTIPLIED_TOTAL)
				.addAttributeModifier(EntityAttributes.GENERIC_JUMP_STRENGTH, MKHeroes.id(name + "_jump"), -1.0, EntityAttributeModifier.Operation.ADD_MULTIPLIED_TOTAL)
				.addAttributeModifier(EntityAttributes.GENERIC_FLYING_SPEED, MKHeroes.id(name + "_fly"), -1.0, EntityAttributeModifier.Operation.ADD_MULTIPLIED_TOTAL);
		return Registry.registerReference(Registries.STATUS_EFFECT, MKHeroes.id(name), effect);
	}

	public static void init() {
	}

	public static class ImmobilizedEffect extends StatusEffect {
		private final boolean icy;

		public ImmobilizedEffect(int color, boolean icy) {
			super(StatusEffectCategory.HARMFUL, color);
			this.icy = icy;
		}

		@Override
		public boolean canApplyUpdateEffect(int duration, int amplifier) {
			return true;
		}

		@Override
		public boolean applyUpdateEffect(LivingEntity entity, int amplifier) {
			// Stop any sliding and show the frost overlay (kept below the freeze-damage threshold).
			entity.setVelocity(0, Math.min(entity.getVelocity().y, 0), 0);
			if (icy) {
				entity.setFrozenTicks(Math.max(entity.getFrozenTicks(), 135));
			}
			return true;
		}
	}
}
