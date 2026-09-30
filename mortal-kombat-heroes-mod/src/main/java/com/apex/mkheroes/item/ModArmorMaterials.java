package com.apex.mkheroes.item;

import com.apex.mkheroes.MKHeroes;
import net.minecraft.item.ArmorItem;
import net.minecraft.item.ArmorMaterial;
import net.minecraft.item.Item;
import net.minecraft.item.Items;
import net.minecraft.recipe.Ingredient;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.registry.entry.RegistryEntry;
import net.minecraft.sound.SoundEvent;
import net.minecraft.sound.SoundEvents;

import java.util.EnumMap;
import java.util.List;

public final class ModArmorMaterials {
	public static final RegistryEntry<ArmorMaterial> SCORPION = register("scorpion", 3, 7, 5, 3, 2.0f, 0.0f, Items.BLAZE_ROD, SoundEvents.ITEM_ARMOR_EQUIP_LEATHER);
	public static final RegistryEntry<ArmorMaterial> SUBZERO = register("subzero", 3, 7, 5, 3, 2.0f, 0.0f, Items.BLUE_ICE, SoundEvents.ITEM_ARMOR_EQUIP_LEATHER);
	public static final RegistryEntry<ArmorMaterial> SPIDERMAN = register("spiderman", 2, 6, 5, 2, 1.0f, 0.0f, Items.COBWEB, SoundEvents.ITEM_ARMOR_EQUIP_LEATHER);
	public static final RegistryEntry<ArmorMaterial> IRONMAN = register("ironman", 3, 8, 6, 3, 3.0f, 0.1f, Items.IRON_BLOCK, SoundEvents.ITEM_ARMOR_EQUIP_NETHERITE);
	public static final RegistryEntry<ArmorMaterial> THANOS = register("thanos", 4, 9, 7, 4, 4.0f, 0.2f, Items.GOLD_BLOCK, SoundEvents.ITEM_ARMOR_EQUIP_GOLD);

	private ModArmorMaterials() {
	}

	private static RegistryEntry<ArmorMaterial> register(String name, int boots, int chest, int legs, int helmet,
			float toughness, float knockbackResistance, Item repair, RegistryEntry<SoundEvent> sound) {
		EnumMap<ArmorItem.Type, Integer> defense = new EnumMap<>(ArmorItem.Type.class);
		defense.put(ArmorItem.Type.BOOTS, boots);
		defense.put(ArmorItem.Type.LEGGINGS, legs);
		defense.put(ArmorItem.Type.CHESTPLATE, chest);
		defense.put(ArmorItem.Type.HELMET, helmet);
		defense.put(ArmorItem.Type.BODY, chest);
		ArmorMaterial material = new ArmorMaterial(defense, 20, sound, () -> Ingredient.ofItems(repair),
				List.of(new ArmorMaterial.Layer(MKHeroes.id(name))), toughness, knockbackResistance);
		return Registry.registerReference(Registries.ARMOR_MATERIAL, MKHeroes.id(name), material);
	}

	public static void init() {
	}
}
