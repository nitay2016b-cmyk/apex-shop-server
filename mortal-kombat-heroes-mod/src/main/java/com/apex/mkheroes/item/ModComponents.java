package com.apex.mkheroes.item;

import com.apex.mkheroes.MKHeroes;
import com.mojang.serialization.Codec;
import net.minecraft.component.ComponentType;
import net.minecraft.network.codec.PacketCodecs;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;

public final class ModComponents {
	/** Which Infinity Stone the gauntlet currently uses. */
	public static final ComponentType<Integer> STONE = Registry.register(Registries.DATA_COMPONENT_TYPE, MKHeroes.id("stone"),
			ComponentType.<Integer>builder().codec(Codec.INT).packetCodec(PacketCodecs.VAR_INT).build());

	private ModComponents() {
	}

	public static void init() {
	}
}
