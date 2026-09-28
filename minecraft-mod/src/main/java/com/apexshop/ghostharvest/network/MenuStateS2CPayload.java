package com.apexshop.ghostharvest.network;

import net.minecraft.network.RegistryByteBuf;
import net.minecraft.network.codec.PacketCodec;
import net.minecraft.network.codec.PacketCodecs;
import net.minecraft.network.packet.CustomPayload;
import net.minecraft.util.Identifier;

/**
 * Server -> client: open/refresh/close the extraction menu for one mob.
 * {@code encodedParts} is a {@link com.apexshop.ghostharvest.part.PartStateCodec}
 * blob; {@code entityAlive} false means "close the menu, it's dead".
 */
public record MenuStateS2CPayload(int entityId, String mobTranslationKey, String encodedParts, boolean entityAlive)
		implements CustomPayload {

	public static final CustomPayload.Id<MenuStateS2CPayload> ID =
			new CustomPayload.Id<>(Identifier.of("ghostharvest", "menu_state"));

	public static final PacketCodec<RegistryByteBuf, MenuStateS2CPayload> CODEC = PacketCodec.tuple(
			PacketCodecs.VAR_INT, MenuStateS2CPayload::entityId,
			PacketCodecs.STRING, MenuStateS2CPayload::mobTranslationKey,
			PacketCodecs.STRING, MenuStateS2CPayload::encodedParts,
			PacketCodecs.BOOLEAN, MenuStateS2CPayload::entityAlive,
			MenuStateS2CPayload::new
	);

	@Override
	public CustomPayload.Id<? extends CustomPayload> getId() {
		return ID;
	}
}
