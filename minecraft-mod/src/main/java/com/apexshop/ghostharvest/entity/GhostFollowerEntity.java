package com.apexshop.ghostharvest.entity;

import net.minecraft.entity.Entity;
import net.minecraft.entity.EntityType;
import net.minecraft.entity.data.DataTracker;
import net.minecraft.entity.data.TrackedData;
import net.minecraft.entity.data.TrackedDataHandlerRegistry;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.nbt.NbtCompound;
import net.minecraft.registry.Registries;
import net.minecraft.util.Identifier;
import net.minecraft.util.math.Vec3d;
import net.minecraft.world.World;

import org.jetbrains.annotations.Nullable;

import java.util.UUID;

/**
 * The translucent "trophy" that appears once a mob has been fully harvested
 * and starts drifting behind whoever harvested it. Deliberately a plain
 * {@link Entity} (not a {@link net.minecraft.entity.mob.MobEntity}): it has
 * no AI, no health and can't be attacked, it just eases toward a point
 * behind its owner every tick. See GhostFollowerEntityRenderer (client) for
 * how it borrows the source mob's own model to draw itself.
 */
public class GhostFollowerEntity extends Entity {

	private static final TrackedData<String> SOURCE_TYPE =
			DataTracker.registerData(GhostFollowerEntity.class, TrackedDataHandlerRegistry.STRING);

	@Nullable
	private UUID ownerUuid;
	private float bobTime;

	public GhostFollowerEntity(EntityType<?> entityType, World world) {
		super(entityType, world);
		this.noClip = true;
		this.setNoGravity(true);
	}

	@Override
	protected void initDataTracker(DataTracker.Builder builder) {
		builder.add(SOURCE_TYPE, EntityType.PIG.toString());
	}

	public void setSourceType(EntityType<?> sourceType) {
		this.dataTracker.set(SOURCE_TYPE, EntityType.getId(sourceType).toString());
	}

	@Nullable
	public Identifier getSourceTypeId() {
		return Identifier.tryParse(this.dataTracker.get(SOURCE_TYPE));
	}

	@Nullable
	public EntityType<?> resolveSourceEntityType() {
		Identifier id = getSourceTypeId();
		return id == null ? null : Registries.ENTITY_TYPE.get(id);
	}

	public void setOwner(PlayerEntity owner) {
		this.ownerUuid = owner.getUuid();
	}

	@Nullable
	private PlayerEntity resolveOwner() {
		if (ownerUuid == null) {
			return null;
		}
		return getWorld().getPlayers().stream()
				.filter(player -> player.getUuid().equals(ownerUuid))
				.findFirst()
				.orElse(null);
	}

	@Override
	public void tick() {
		super.tick();
		if (getWorld().isClient) {
			return;
		}

		PlayerEntity owner = resolveOwner();
		if (owner == null || !owner.isAlive()) {
			discard();
			return;
		}

		bobTime += 0.1f;
		Vec3d behind = Vec3d.fromPolar(0, owner.getYaw() + 180.0f).multiply(1.6);
		double bob = Math.sin(bobTime) * 0.12;
		Vec3d target = owner.getPos().add(behind).add(0, owner.getStandingEyeHeight() * 0.6 + bob, 0);
		Vec3d next = getPos().lerp(target, 0.12);

		setPosition(next.x, next.y, next.z);
		setYaw(owner.getYaw());
		setPitch(0);
	}

	@Override
	protected void writeCustomDataToNbt(NbtCompound nbt) {
		if (ownerUuid != null) {
			nbt.putUuid("Owner", ownerUuid);
		}
		Identifier sourceType = getSourceTypeId();
		if (sourceType != null) {
			nbt.putString("SourceType", sourceType.toString());
		}
	}

	@Override
	protected void readCustomDataFromNbt(NbtCompound nbt) {
		if (nbt.containsUuid("Owner")) {
			ownerUuid = nbt.getUuid("Owner");
		}
		if (nbt.contains("SourceType")) {
			this.dataTracker.set(SOURCE_TYPE, nbt.getString("SourceType"));
		}
	}

	@Override
	public boolean isPushable() {
		return false;
	}

	@Override
	public boolean shouldRender(double distance) {
		return distance < 4096.0;
	}
}
