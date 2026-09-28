package com.apexshop.ghostharvest.client.render;

import com.apexshop.ghostharvest.entity.GhostFollowerEntity;

import net.minecraft.client.render.VertexConsumerProvider;
import net.minecraft.client.render.entity.EntityRenderDispatcher;
import net.minecraft.client.render.entity.EntityRenderer;
import net.minecraft.client.render.entity.EntityRendererFactory;
import net.minecraft.client.util.math.MatrixStack;
import net.minecraft.entity.Entity;
import net.minecraft.entity.EntityType;
import net.minecraft.entity.LivingEntity;
import net.minecraft.util.Identifier;

import java.util.HashMap;
import java.util.Map;

/**
 * Draws a ghost by handing the game's own entity render dispatcher a
 * throwaway ("puppet") instance of the mob it came from, scaled down and
 * glowing. That way we always get the real, correct model/texture/animation
 * for that mob without having to know its model class - see GhostVisuals for
 * how the puppet is picked, and the mod README for why this trades true
 * alpha-transparency for the much simpler/safer "glowing outline" look.
 */
public class GhostFollowerEntityRenderer extends EntityRenderer<GhostFollowerEntity> {

	private static final float SCALE = 0.55f;

	private final EntityRenderDispatcher dispatcher;
	private final Map<EntityType<?>, Entity> puppetCache = new HashMap<>();

	public GhostFollowerEntityRenderer(EntityRendererFactory.Context context) {
		super(context);
		this.dispatcher = context.getRenderDispatcher();
		this.shadowRadius = 0.0f;
	}

	@Override
	public Identifier getTexture(GhostFollowerEntity entity) {
		// Unused: the puppet supplies its own texture through its own
		// renderer, but EntityRenderer requires this method regardless.
		return Identifier.ofVanilla("textures/entity/zombie/zombie.png");
	}

	@Override
	public void render(GhostFollowerEntity ghost, float yaw, float tickDelta, MatrixStack matrices,
						VertexConsumerProvider vertexConsumers, int light) {
		EntityType<?> sourceType = ghost.resolveSourceEntityType();
		if (sourceType == null) {
			return;
		}

		Entity puppet = puppetCache.computeIfAbsent(sourceType, type -> GhostVisuals.createPuppet(type, ghost.getWorld()));
		puppet.copyPositionAndRotation(ghost);
		puppet.age = ghost.age;
		puppet.setGlowing(true);
		if (puppet instanceof LivingEntity livingPuppet) {
			livingPuppet.bodyYaw = ghost.getYaw();
			livingPuppet.prevBodyYaw = ghost.getYaw();
			livingPuppet.headYaw = ghost.getYaw();
			livingPuppet.prevHeadYaw = ghost.getYaw();
		}

		matrices.push();
		matrices.scale(SCALE, SCALE, SCALE);
		dispatcher.render(puppet, 0, 0, 0, yaw, tickDelta, matrices, vertexConsumers, light);
		matrices.pop();
	}
}
