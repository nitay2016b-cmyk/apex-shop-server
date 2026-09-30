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
import net.minecraft.util.Formatting;
import net.minecraft.util.Rarity;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public final class ModItems {
	/** Which world (and which hero) each item comes from, shown in its tooltip and used for the creative tabs. */
	public enum Universe {
		MORTAL_KOMBAT("mortal_kombat", Formatting.DARK_RED),
		MARVEL("marvel", Formatting.RED);

		public final String id;
		public final Formatting color;
		public final List<Item> items = new ArrayList<>();

		Universe(String id, Formatting color) {
			this.id = id;
			this.color = color;
		}
	}

	/** Hero name key for every item (e.g. "scorpion"). */
	public static final Map<Item, String> HERO = new HashMap<>();
	public static final Map<Item, Universe> UNIVERSE = new HashMap<>();

	// ---- Mortal Kombat
	public static final Item SCORPION_HANDS = register("scorpion_hands", "scorpion", Universe.MORTAL_KOMBAT, new ScorpionHandsItem(weapon(5, -2.0f)));
	static {
		armorSet("scorpion", Universe.MORTAL_KOMBAT, ModArmorMaterials.SCORPION);
	}
	public static final Item SUBZERO_HANDS = register("subzero_hands", "subzero", Universe.MORTAL_KOMBAT, new SubZeroHandsItem(weapon(5, -2.0f)));
	static {
		armorSet("subzero", Universe.MORTAL_KOMBAT, ModArmorMaterials.SUBZERO);
	}

	// ---- Marvel
	public static final Item INFINITY_GAUNTLET = register("infinity_gauntlet", "thanos", Universe.MARVEL, new InfinityGauntletItem(weapon(8, -2.4f).rarity(Rarity.EPIC)));
	static {
		armorSet("thanos", Universe.MARVEL, ModArmorMaterials.THANOS);
	}
	public static final Item IRON_MAN_GAUNTLET = register("iron_man_gauntlet", "ironman", Universe.MARVEL, new IronManGauntletItem(weapon(5, -2.0f)));
	static {
		armorSet("ironman", Universe.MARVEL, ModArmorMaterials.IRONMAN);
	}
	public static final Item WEB_SHOOTER = register("web_shooter", "spiderman", Universe.MARVEL, new WebShooterItem(weapon(2, -1.6f)));
	static {
		armorSet("spiderman", Universe.MARVEL, ModArmorMaterials.SPIDERMAN);
	}

	private ModItems() {
	}

	private static Item.Settings weapon(int damage, float speed) {
		return new Item.Settings().maxCount(1).fireproof().rarity(Rarity.RARE)
				.attributeModifiers(SwordItem.createAttributeModifiers(ToolMaterials.NETHERITE, damage, speed));
	}

	private static void armorSet(String hero, Universe universe, RegistryEntry<ArmorMaterial> material) {
		register(hero + "_helmet", hero, universe, new ArmorItem(material, ArmorItem.Type.HELMET, armor(ArmorItem.Type.HELMET)));
		register(hero + "_chestplate", hero, universe, new ArmorItem(material, ArmorItem.Type.CHESTPLATE, armor(ArmorItem.Type.CHESTPLATE)));
		register(hero + "_leggings", hero, universe, new ArmorItem(material, ArmorItem.Type.LEGGINGS, armor(ArmorItem.Type.LEGGINGS)));
		register(hero + "_boots", hero, universe, new ArmorItem(material, ArmorItem.Type.BOOTS, armor(ArmorItem.Type.BOOTS)));
	}

	private static Item.Settings armor(ArmorItem.Type type) {
		return new Item.Settings().maxDamage(type.getMaxDamage(40)).fireproof().rarity(Rarity.RARE);
	}

	private static Item register(String name, String hero, Universe universe, Item item) {
		Registry.register(Registries.ITEM, MKHeroes.id(name), item);
		universe.items.add(item);
		HERO.put(item, hero);
		UNIVERSE.put(item, universe);
		return item;
	}

	public static void init() {
	}
}
