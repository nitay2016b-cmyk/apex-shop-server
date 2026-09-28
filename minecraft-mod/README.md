# Ghost Harvest (mod ID: `ghostharvest`)

מוד ל-Minecraft (Fabric, גרסה 1.21.1) שמחליף את המסחר עם דמויות ("villager trading" style) במנגנון "תפיסה וחילוץ":

1. אוחזים ב**מלקחת חילוץ** (Extraction Hook) ולוחצים קליק ימני על דמות נתמכת (כרגע: Enderman, Blaze, Skeleton, Zombie, Creeper, Spider, Piglin, Witch, Wither Skeleton, Drowned, Guardian, Silverfish) במקום המסחר/אינטראקציה הרגילה שלה.
2. נפתח תפריט עם כל "החלק" שאפשר לחלץ ממנה. לכל דמות יש הגדרה משלה (`MobPartRegistry`):
   - **חלק רגיל** (כמו "עין" אצל אנדרמן) - יש לו כמות (למשל 2), וכל קליק מוריד יחידה אחת. הדמות מתה רק אחרי שכל היחידות של כל החלקים נגמרו (לאנדרמן: 2 קליקים על "עין").
   - **חלק בכמות אקראית** (כמו "מקל אש" אצל בלייז) - הכמות מוגרלת פעם אחת (3-6) בפעם הראשונה שתופסים את הדמות הספציפית הזו, כך שכל בלייז "צריך" מספר פעולות שונה.
   - **חלק שהורג מיידית** (`instantKill`, כמו "ראש"/"גולגולת"/"ליבה") - חילוץ שלו הורג את הדמות מיד, גם אם נשארו לה חלקים אחרים שלא נגמרו. זה המימוש של "לדמות עם ראש כמו אנדרמן אני יכול לבחור להוציא לו את הראש ואז הוא מת מיד".
3. כשדמות מתה דרך המנגנון הזה (ולא דרך פגיעה רגילה), נוצר "רוח רפאים" שקוף-ברוח (Ghost, `GhostFollowerEntity`) שמרחף ומרחף אחרי השחקן שחילץ ממנה, לתמיד (עד שהוא ייעלם/ייסגר השרת), עם דמות המבוססת על הדמות המקורית (מוצג עם אפקט זוהר "glowing" כדי להיראות רוחני; ראו הסתייגות למטה).

כל חלק שנחלץ גם נופל כפריט (Ender Pearl לעין, Blaze Rod למקל, Bone/Skeleton Skull לשלד, Rotten Flesh/Zombie Head לזומבי, Gunpowder לקריפר, String/Spider Eye לעכביש) - ניתן להחליף בקלות ל-item ייעודי חדש דרך `PartDefinition`.

## מבנה הקוד

```
src/main/java/com/apexshop/ghostharvest/
  GhostHarvestMod.java              נקודת כניסה: רישום items/entities/networking, חיבור ה-handlers
  part/PartDefinition.java          תיאור "סוג חלק" (id, כמות מינ/מקס, instantKill, מה נופל)
  part/MobPartRegistry.java         מיפוי EntityType -> רשימת PartDefinition (כאן מוסיפים דמויות חדשות)
  part/ExtractionProgress.java      כמה חלקים כבר חולצו/הוגרלו עבור דמות ספציפית אחת
  part/ExtractionManager.java       טבלה (בזיכרון, לפי UUID) של ExtractionProgress לכל דמות בעולם
  part/PartState.java + PartStateCodec.java   מבנה "מצב תפריט" שנשלח ללקוח + קידוד/פענוח למחרוזת
  entity/GhostFollowerEntity.java   ה"רוח" שמרחפת אחרי השחקן
  entity/GhostHarvestEntities.java  רישום ה-EntityType של הרוח
  item/GhostHarvestItems.java       רישום פריט "מלקחת חילוץ"
  network/*.java                    שני חבילות רשת (C2S: "חילצתי חלק X", S2C: "הנה מצב התפריט")
  interaction/GrabInteractionHandler.java   הלוגיקה בפועל: פתיחת תפריט, ביצוע חילוץ, הריגה + יצירת רוח

src/client/java/com/apexshop/ghostharvest/client/
  GhostHarvestClient.java           נקודת כניסה בצד לקוח: רישום renderer + פתיחת/סגירת התפריט לפי חבילות מהשרת
  gui/ExtractionScreen.java         מסך התפריט עצמו (כפתור לכל חלק)
  render/GhostVisuals.java          מיפוי EntityType -> איזו דמות "בובה" אמיתית להשתמש כדי לצייר את הרוח
  render/GhostFollowerEntityRenderer.java   מצייר את הרוח ע"י שימוש חוזר ב-renderer האמיתי של הדמות המקורית
```

## הרחבה לדמויות נוספות

1. `MobPartRegistry`: הוסיפו שורה חדשה עם `EntityType` והרשימת `PartDefinition` שלו (`fixed`/`ranged`/`instantKill`).
2. `GhostVisuals` (בצד הלקוח): הוסיפו איך לבנות "בובה" של אותה דמות (בדרך כלל `new XyzEntity(EntityType.XYZ, world)`).
3. הוסיפו תרגומים ל-`assets/ghostharvest/lang/*.json` עבור כל `translationKey` חדש.

אין הגבלה אמיתית על כמות סוגי החלקים לדמות מלבד זו שנוצרת מקידוד ה-state כמחרוזת (`PartStateCodec`) - אין הגבלה קשיחה כי זו רשימה דינמית, לא שדות קבועים.

## הסתייגות חשובה על התצוגה של ה"רוח"

התיאור המקורי מדבר על "ראש שקוף שמרחף" - שקיפות אמיתית (alpha blending) לדמות שרירותית ב-Minecraft דורשת בפועל Mixin שמחליף את שכבת הרינדור (`RenderLayer`) של אותה דמות ל-translucent, כי מודלים של יצורים לרוב מצוירים בשכבת cutout/solid שלא תומכת ב-alpha חלק. כדי לא להסתמך על Mixin (ולא להמר על שמות מדויקים של מחלקות מודל פנימיות שלא הצלחתי לאמת מול קוד אמיתי - ראו "מגבלות הסביבה" למטה), הרוח כרגע מיוצגת כ:

- עותק מוקטן (0.55x) **מלא** של הדמות המקורית (לא רק ראש) עם אפקט **Glowing** (קו מתאר זוהר, נראה גם דרך קירות) - לא שקיפות אמיתית.

זו נקודת התחלה סבירה שבטוח תעבוד; אם תרצו שקיפות אמיתית או ראש-בלבד, הדרך הטבעית היא Mixin ל-`LivingEntityRenderer` שבודק `instanceof` marker interface ומחליף `RenderLayer` + אלפא - אפשר לבקש ממני להוסיף את זה כשלב הבא (ואז יהיה אפשר גם לבדוק את זה בפועל מול קליינט אמיתי).

## מגבלות הסביבה שבה זה נכתב - חשוב לדעת

הסביבה שבה נכתב הקוד הזה **חסומה לאינטרנט** כלפי maven.fabricmc.net / piston-meta.mojang.com וכו', ולכן **לא הצלחתי להריץ בפועל `gradle build`** ולוודא שהכל מתקמפל מול ה-Yarn mappings האמיתיים. כתבתי את הקוד בזהירות רבה לפי דפוסים סטנדרטיים ויציבים של Fabric API ל-1.21.1, אבל יש כמה נקודות שכדאי לבדוק ראשונות אם תיפתח שגיאת קומפילציה:

- שמות מדויקים של מתודות על `Entity`/`LivingEntity` (`kill(ServerWorld)`, `copyPositionAndRotation`, `writeCustomDataToNbt`/`readCustomDataFromNbt`, `setGlowing`).
- חתימת `EntityType.Builder.build(RegistryKey)`.
- גרסאות מדויקות ב-`gradle.properties` (`yarn_mappings`, `fabric_version`, `loader_version`) - מסומן בהערה לבדוק מול https://fabricmc.net/develop.

ברוב המקרים אלו שגיאות "שינוי שם" קטנות שכל IDE עם Fabric Loom (IntelliJ + Minecraft Development plugin, אחרי `./gradlew genSources` או Reload Gradle Project) יראה מיד עם קו אדום ואפשר לתקן ב-2 דקות.

## בנייה והתקנה מקומית - צעד אחר צעד

זה חייב לקרות על המחשב שלכם (עם אינטרנט רגיל וכרטיס מסך) - לא ניתן להריץ/לשחק בתוך סביבת הענן שבה נכתב הקוד הזה.

### 0. דרישות מקדימות

- **JDK 21** מותקן (`java -version` צריך להראות 21). למשל [Adoptium Temurin 21](https://adoptium.net/).
- **Git**.
- מומלץ מאוד: **IntelliJ IDEA** (גרסת Community החינמית מספיקה) + תוסף **Minecraft Development** - זה מה שיתקן לבד כל שגיאת קומפילציה קטנה (ראו "מגבלות הסביבה" למעלה).
- **לא** צריך חשבון Minecraft אמיתי כדי רק לבנות/לבדוק בפיתוח (שלב 2) - רק כדי להתקין בלאנצ'ר הרגיל (שלב 3).

### 1. משיכת הקוד

```bash
git clone https://github.com/nitay2016b-cmyk/apex-shop-server.git
cd apex-shop-server
git checkout claude/bold-gates-soz333
cd minecraft-mod
```

### 2. בנייה + בדיקה מהירה בקליינט פיתוח (בלי צורך בחשבון אמיתי)

```bash
gradle wrapper --gradle-version 8.8   # פעם אחת בלבד, יוצר את gradlew
./gradlew build
```

אם יש שגיאות קומפילציה - זה צפוי (ראו "מגבלות הסביבה" למעלה); הכי מהיר לתקן דרך IntelliJ (Open → בחרו את תיקיית `minecraft-mod`, תנו ל-Gradle לסנכרן) שיראה בדיוק את השורה הבעייתית עם הצעת תיקון. אפשר גם להדביק לי את הודעת השגיאה המדויקת ואני אתקן.

ברגע שזה מתקמפל, אפשר לבדוק מיד עם קליינט Minecraft שנפתח אוטומטית במצב פיתוח (לא דורש התחברות עם חשבון אמיתי):

```bash
./gradlew runClient
```

זה פותח עולם יצירה עם המוד כבר טעון. תנו לעצמכם את הפריט ותבדקו:

```
/give @s ghostharvest:extraction_hook
```

וקליק ימני על אנדרמן/בלייז/שלד/זומבי/קריפר/עכביש/פיגלין/מכשפה/שלד ווית'ר/טובע/שומר/דג כסף.

### 3. התקנה בלאנצ'ר הרגיל של Minecraft (עם החשבון האמיתי שלכם)

1. הריצו `./gradlew build` - ה-jar המוכן ייווצר תחת `build/libs/ghostharvest-1.0.0.jar` (לא הקבצים `-sources` או `-dev`).
2. התקינו את **Fabric Loader** לגרסת 1.21.1 דרך המתקין הרשמי: https://fabricmc.net/use - זה יוצר פרופיל חדש בלאנצ'ר הרשמי של Minecraft.
3. הורידו את מוד **Fabric API** (גרסה שמתאימה ל-1.21.1) מ-Modrinth או CurseForge.
4. שימו את שני קבצי ה-jar (Fabric API + `ghostharvest-1.0.0.jar`) בתיקיית ה-`mods` של Minecraft:
   - Windows: `%appdata%\.minecraft\mods`
   - macOS: `~/Library/Application Support/minecraft/mods`
   - Linux: `~/.minecraft/mods`
5. פתחו את הלאנצ'ר הרשמי, בחרו את הפרופיל `fabric-loader-1.21.1`, ולחצו Play.

### אם משהו לא מתקמפל / לא עובד

הפרויקט נכתב בסביבה חסומת-אינטרנט בלי אפשרות להריץ בפועל build אמיתי מול Minecraft/Fabric - ראו את הסעיף "מגבלות הסביבה שבה זה נכתב" למעלה לרשימת הנקודות המדויקות שכדאי לבדוק ראשונות. הדביקו לי כל שגיאת קומפילציה או Exception מה-log ואני אתקן.

## רישיון

MIT (ראו `fabric.mod.json`) - שנו כרצונכם.
