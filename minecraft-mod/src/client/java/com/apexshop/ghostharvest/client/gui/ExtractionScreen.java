package com.apexshop.ghostharvest.client.gui;

import com.apexshop.ghostharvest.network.ExtractPartC2SPayload;
import com.apexshop.ghostharvest.part.PartState;

import net.fabricmc.fabric.api.client.networking.v1.ClientPlayNetworking;
import net.minecraft.client.gui.DrawContext;
import net.minecraft.client.gui.screen.Screen;
import net.minecraft.client.gui.widget.ButtonWidget;
import net.minecraft.text.Text;

import java.util.List;

/**
 * The "what do you want to take?" menu that opens instead of a trade screen.
 * One button per part the mob currently has left; instant-kill parts are
 * labelled as such. Every click just fires a request at the server - all the
 * actual bookkeeping (and re-rolling this screen with fresh numbers, or
 * closing it once the mob dies) happens server-side.
 */
public class ExtractionScreen extends Screen {

	private static final int BUTTON_WIDTH = 220;
	private static final int BUTTON_HEIGHT = 20;
	private static final int BUTTON_GAP = 4;

	private final int entityId;
	private final List<PartState> parts;

	public ExtractionScreen(int entityId, String mobTranslationKey, List<PartState> parts) {
		super(Text.translatable(mobTranslationKey));
		this.entityId = entityId;
		this.parts = parts;
	}

	public int getEntityId() {
		return entityId;
	}

	@Override
	protected void init() {
		int startY = this.height / 2 - (parts.size() * (BUTTON_HEIGHT + BUTTON_GAP)) / 2;

		for (int i = 0; i < parts.size(); i++) {
			PartState part = parts.get(i);
			boolean depleted = !part.instantKill() && part.remaining() <= 0;

			Text label = part.instantKill()
					? Text.translatable(part.translationKey())
							.append(Text.literal(" (")).append(Text.translatable("gui.ghostharvest.instant_kill")).append(Text.literal(")"))
					: Text.translatable(part.translationKey()).append(Text.literal(" x" + part.remaining()));

			ButtonWidget button = ButtonWidget.builder(label, btn -> onPartChosen(part))
					.dimensions(this.width / 2 - BUTTON_WIDTH / 2, startY + i * (BUTTON_HEIGHT + BUTTON_GAP), BUTTON_WIDTH, BUTTON_HEIGHT)
					.build();
			button.active = !depleted;
			this.addDrawableChild(button);
		}
	}

	private void onPartChosen(PartState part) {
		ClientPlayNetworking.send(new ExtractPartC2SPayload(entityId, part.id()));
	}

	@Override
	public boolean shouldPause() {
		return false;
	}

	@Override
	public void render(DrawContext context, int mouseX, int mouseY, float delta) {
		this.renderBackground(context, mouseX, mouseY, delta);
		super.render(context, mouseX, mouseY, delta);
		context.drawCenteredTextWithShadow(this.textRenderer, this.title, this.width / 2, 20, 0xFFFFFF);
	}
}
