package com.apexshop.ghostharvest.part;

/**
 * A snapshot of one part's remaining count, as sent to the client to build
 * the extraction menu. Not the same object as {@link PartDefinition}: this is
 * just the bits the client needs to draw a button.
 */
public record PartState(String id, String translationKey, int remaining, boolean instantKill) {
}
