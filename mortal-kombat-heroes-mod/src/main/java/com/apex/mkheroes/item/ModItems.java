package com.apex.mkheroes.item;

import com.apex.mkheroes.MKHeroes;
import net.minecraft.item.ArmorItem;
import net.minecraft.item.ArmorMaterial;
import net.minecraft.item.Item;
import net.minecraft.item.SwordItem;
import net.minecraft.item.ToolMaterials;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.registry.entry.RegistryEntry;
import net.minecraft.util.Rarity;

import java.util.ArrayList;
import java.util.List;

public final class ModItems {
	public static final List<Item> ALL = new ArrayList<>();

	public static final Item SCORPION_HANDS = register("scorpion_hands", new ScorpionHandsItem(weapon(5, -2.0f)));
	public static final Item SUBZERO_HANDS = register("subzero_hands", new SubZeroHandsItem(weapon(5, -2.0f)));
	public static final Item WEB_SHOOTER = register("web_shooter", new WebShooterItem(weapon(2, -1.6f)));
	public static final Item IRON_MAN_GAUNTLET = register("iron_man_gauntlet", new IronManGauntletItem(weapon(5, -2.0f)));
	public static final Item INFINITY_GAUNTLET = register("infinity_gauntlet", new InfinityGauntletItem(weapon(8, -2.4f).rarity(Rarity.EPIC)));

	static {
		armorSet("scorpion", ModArmorMaterials.SCORPION);
		armorSet("subzero", ModArmorMaterials.SUBZERO);
		armorSet("spiderman", ModArmorMaterials.SPIDERMAN);
		armorSet("ironman", ModArmorMaterials.IRONMAN);
		armorSet("thanos", ModArmorMaterials.THANOS);
	}

	private ModItems() {
	}

	private static Item.Settings weapon(int damage, float speed) {
		return new Item.Settings().maxCount(1).fireproof().rarity(Rarity.RARE)
				.attributeModifiers(SwordItem.createAttributeModifiers(ToolMaterials.NETHERITE, damage, speed));
	}

	private static void armorSet(String name, RegistryEntry<ArmorMaterial> material) {
		register(name + "_helmet", new ArmorItem(material, ArmorItem.Type.HELMET, armor(ArmorItem.Type.HELMET)));
		register(name + "_chestplate", new ArmorItem(material, ArmorItem.Type.CHESTPLATE, armor(ArmorItem.Type.CHESTPLATE)));
		register(name + "_leggings", new ArmorItem(material, ArmorItem.Type.LEGGINGS, armor(ArmorItem.Type.LEGGINGS)));
		register(name + "_boots", new ArmorItem(material, ArmorItem.Type.BOOTS, armor(ArmorItem.Type.BOOTS)));
	}

	private static Item.Settings armor(ArmorItem.Type type) {
		return new Item.Settings().maxDamage(type.getMaxDamage(40)).fireproof().rarity(Rarity.RARE);
	}

	private static Item register(String name, Item item) {
		Registry.register(Registries.ITEM, MKHeroes.id(name), item);
		ALL.add(item);
		return item;
	}

	public static void init() {
	}
}
