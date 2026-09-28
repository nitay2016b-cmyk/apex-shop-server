package com.apexshop.ghostharvest.network;

import net.minecraft.network.RegistryByteBuf;
import net.minecraft.network.codec.PacketCodec;
import net.minecraft.network.codec.PacketCodecs;
import net.minecraft.network.packet.CustomPayload;
import net.minecraft.util.Identifier;

/**
 * Client -> server: "I clicked the button for this part on this mob."
 */
public record ExtractPartC2SPayload(int entityId, String partId) implements CustomPayload {

	public static final CustomPayload.Id<ExtractPartC2SPayload> ID =
			new CustomPayload.Id<>(Identifier.of("ghostharvest", "extract_part"));

	public static final PacketCodec<RegistryByteBuf, ExtractPartC2SPayload> CODEC = PacketCodec.tuple(
			PacketCodecs.VAR_INT, ExtractPartC2SPayload::entityId,
			PacketCodecs.STRING, ExtractPartC2SPayload::partId,
			ExtractPartC2SPayload::new
	);

	@Override
	public CustomPayload.Id<? extends CustomPayload> getId() {
		return ID;
	}
}
