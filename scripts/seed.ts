import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { levels, passages } from "@/db/schema";
import { generateAllPassages, buildPassage } from "@/lib/passage-generator";

const levelData = [
  {
    slug: "beginner",
    name: "Beginner",
    description: "Simple fairy tales for starting your English reading journey.",
    color: "#22c55e",
    icon: "sprout",
    orderIndex: 1,
  },
  {
    slug: "intermediate",
    name: "Intermediate",
    description: "Longer texts with richer vocabulary and more complex ideas.",
    color: "#3b82f6",
    icon: "book-open",
    orderIndex: 2,
  },
  {
    slug: "advanced",
    name: "Advanced",
    description: "Sophisticated articles on academic, professional, and abstract topics.",
    color: "#a855f7",
    icon: "graduation-cap",
    orderIndex: 3,
  },
];

// 초보자용 길어진 명작 동화 10개 (이 배열 아래에 같은 형식으로 90개를 더 추가하시면 100개가 완성됩니다.)
const beginnerFairyTales = [
  {
    title: "The Three Little Pigs",
    content: "Once upon a time, there were three little pigs. They lived in a beautiful forest but decided it was time to build their own houses. The first little pig was very lazy. He did not want to work hard, so he built his house quickly out of light straw. The second little pig worked a little bit harder, but he also wanted to play. He built his house out of wooden sticks. The third little pig was very smart and hard-working. He worked all day under the hot sun to build a strong house out of heavy bricks. One day, a big bad wolf came to the forest. He went to the straw house and said, 'Little pig, let me in!' The pig said no. So the wolf huffed, and he puffed, and he blew the house down. The pig ran to his brother's stick house. The wolf followed him and blew that house down too! Finally, the two terrified pigs ran to the strong brick house. The angry wolf huffed and puffed as hard as he could, but the brick house did not move at all. The tired wolf gave up and ran away forever."
  },
  {
    title: "Cinderella",
    content: "Cinderella was a beautiful and kind-hearted girl. Sadly, her mother passed away, and she had to live with her cruel stepmother and two selfish stepsisters. They forced Cinderella to clean the large house from morning until night, wearing old and dirty clothes. One exciting day, the King announced a grand ball at the palace. He wanted to find a lovely bride for the Prince. The stepsisters bought beautiful new dresses, leaving Cinderella behind to cry in the kitchen. Suddenly, a bright light appeared, and her Fairy Godmother stood before her. With a wave of her magic wand, she turned a pumpkin into a magnificent carriage and Cinderella's rags into a sparkling blue gown with delicate glass slippers. 'You must return before the clock strikes midnight, or the magic will break,' she warned. At the ball, the Prince could not take his eyes off Cinderella. They danced the entire evening. Suddenly, the clock began to strike twelve. Cinderella ran out so fast that she dropped one glass slipper on the stairs. The Prince searched the whole kingdom to find the girl whose foot fit the tiny glass slipper. When it fit Cinderella perfectly, he married her, and they lived happily ever after."
  },
  {
    title: "The Ugly Duckling",
    content: "It was a warm summer day on the farm. A mother duck was sitting patiently on her nest, waiting for her eggs to hatch. One by one, the small eggs cracked open, and fluffy, bright yellow ducklings popped out. They were adorable. However, there was one large egg left in the nest. When it finally cracked, out stepped a clumsy, gray bird. He looked completely different from his cute little brothers and sisters. All the other animals on the farm pointed and laughed at him. 'You are so strange and ugly!' they quacked cruelly. The poor duckling felt incredibly lonely and heartbroken, so he decided to run away from the farm. He wandered alone through the dangerous forest. Winter came, and the weather turned freezing cold. The duckling had to hide in the icy reeds to survive. Months passed, and finally, the bright spring sun melted the ice. The duckling stretched his wings and flew to a clear blue pond. He looked down at his reflection in the smooth water and gasped in surprise. He was no longer an ugly gray bird. He had grown into a majestic, beautiful white swan. The other swans quickly swam over to welcome him into their family."
  },
  {
    title: "Snow White",
    content: "Deep in a faraway kingdom lived a princess named Snow White. She was famous for having skin as white as winter snow, hair as black as midnight, and lips as red as a blooming rose. Her stepmother, the wicked Queen, was terribly vain. Every single morning, the Queen asked her magic mirror, 'Mirror, mirror, on the wall, who is the fairest of them all?' The mirror always answered that the Queen was the most beautiful. But as Snow White grew older, she became even more beautiful than the Queen. One day, the magic mirror told the Queen the truth. Furious and jealous, the Queen ordered her huntsman to take Snow White into the dark forest and leave her there. Lost and terrified, Snow White ran until she discovered a tiny, cozy cottage. Inside, everything was incredibly small. She cleaned the messy house and fell fast asleep across seven little beds. When the seven dwarfs returned from working in the diamond mines, they were surprised but happy to let her stay. However, the evil Queen discovered Snow White was still alive. Disguised as an old woman, she tricked the innocent princess into eating a poisonous red apple."
  },
  {
    title: "Little Red Riding Hood",
    content: "There was once a sweet little girl who was loved by everyone who knew her. Her grandmother made her a beautiful red velvet cape with a hood, and she wore it so often that people called her Little Red Riding Hood. One sunny morning, her mother packed a basket with fresh bread and sweet butter. 'Take this to your grandmother because she is feeling sick,' her mother instructed. 'Walk straight there and do not talk to strangers in the woods.' Red Riding Hood skipped cheerfully into the forest. Soon, a large, cunning wolf approached her. 'Where are you going, sweet girl?' the wolf asked politely. Forgetting her mother's warning, she told him exactly where her grandmother lived. The sneaky wolf took a shortcut and arrived at the cottage first. He locked the poor grandmother in a tall closet, dressed in her nightgown, and climbed into her bed. When Red Riding Hood arrived, she noticed her grandmother looked very strange. 'Grandma, what big ears you have!' she said. 'The better to hear you with, my dear,' the wolf replied. 'Grandma, what big teeth you have!' she shouted. 'The better to eat you with!' the wolf roared, jumping out of bed."
  },
  {
    title: "The Boy Who Cried Wolf",
    content: "There was a young shepherd boy who lived in a quiet village at the bottom of a large mountain. Every day, his job was to take the village sheep up the grassy hill to eat. It was a very boring and lonely job. The boy had nothing to do but watch the fluffy sheep chew grass all day long. One afternoon, he decided to play a trick to make things exciting. He took a deep breath and screamed as loudly as he could, 'Wolf! Wolf! A big wolf is chasing the sheep!' The hardworking villagers dropped their tools and ran quickly up the steep hill to save the sheep. When they arrived, they saw the boy laughing loudly. There was no wolf at all. The villagers were very angry and went back to work. A few days later, the naughty boy played the exact same trick again. Once more, the villagers rushed up the hill, only to find the boy laughing. But the very next week, a real, hungry wolf came out of the dark forest and started chasing the sheep. The terrified boy screamed, 'Wolf! Wolf! Help me!' But this time, nobody came. They all thought it was just another silly trick."
  },
  {
    title: "The Ant and the Grasshopper",
    content: "During a beautifully warm and sunny summer, a green grasshopper was hopping about in the field. He was chirping and singing to his heart's content, enjoying the beautiful weather without a single care in the world. As he played his musical violin, he saw a tiny black ant walking past. The ant was sweating and struggling to carry a heavy piece of corn back to his nest. 'Why are you working so hard on such a lovely day?' asked the lazy grasshopper. 'Come and sing with me instead!' The ant wiped his forehead and replied, 'I am collecting and storing food for the freezing winter. I strongly suggest you do the same.' The grasshopper just laughed loudly. 'Why worry about winter? We have plenty of food right now!' he said, and went back to his joyful singing. Months passed, and the harsh, snowy winter finally arrived. The ground was covered in thick, white snow, and there was absolutely nothing left to eat. The starving grasshopper dragged himself to the ant's warm house and begged for a tiny crumb of food. The ant looked at him and said, 'If you had worked hard during the summer, you would not be hungry today.'"
  },
  {
    title: "Jack and the Beanstalk",
    content: "Jack was a poor young boy who lived with his widowed mother. They were so poor that they had no money left to buy bread. One morning, his mother told him to take their only cow to the market and sell it for a good price. On his way to the market, Jack met a mysterious old man who offered to trade the cow for five magic beans. Jack foolishly agreed and brought the beans home. His mother was so furious that she threw the worthless beans out the window and sent Jack to bed without any dinner. The next morning, Jack woke up and looked outside. To his absolute amazement, a gigantic green beanstalk had grown overnight, reaching high into the fluffy white clouds. Jack bravely climbed up the enormous plant. At the very top, he found a magical castle belonging to a scary, booming giant. While the giant was sleeping, Jack quietly snuck inside. He managed to steal a heavy bag of shiny gold coins, a magical goose that laid solid golden eggs, and a beautiful golden harp that played sweet music all by itself. Jack climbed down quickly and chopped down the beanstalk, saving himself and his mother from poverty forever."
  },
  {
    title: "Goldilocks and the Three Bears",
    content: "Once upon a time, there was a little girl with curly blonde hair named Goldilocks. One morning, she went for a walk in the forest and got completely lost. Soon, she came upon a lovely little house and knocked on the door. When no one answered, she boldly walked right in. On the kitchen table, there were three bowls of hot porridge. Goldilocks tasted the porridge from the largest bowl, but it was much too hot. She tasted the medium bowl, but it was freezing cold. Then she tasted the smallest bowl, and it was absolutely perfect, so she ate it all up. Feeling tired, she walked into the living room and saw three chairs. She sat in the giant chair, but it was too hard. The medium chair was too soft. But the smallest chair was just right—until it suddenly broke into pieces! Finally, she went upstairs to the bedroom. She lay down in the tiny bed, pulled up the warm blankets, and fell fast asleep. Just then, the three bears who lived in the house returned from their morning walk. The angry baby bear cried, 'Someone has eaten my porridge, broken my chair, and is sleeping in my bed!' Goldilocks woke up, screamed, and ran out of the house as fast as her legs could carry her."
  },
  {
    title: "The Frog Prince",
    content: "A long time ago, there lived a beautiful princess who had a favorite golden ball. One sunny afternoon, she was playing near a deep, dark pond in the royal garden. Suddenly, the golden ball slipped from her delicate hands and rolled straight into the deep water. The princess began to cry loudly because she could not reach it. Suddenly, a slimy, green frog popped his head out of the water. 'I will dive down and get your shiny ball,' the frog promised, 'but only if you promise to let me eat from your golden plate and sleep in your comfortable bed.' The princess quickly agreed, secretly thinking a silly frog could never live in a grand palace. The frog dove deep, retrieved the ball, and tossed it onto the grass. The princess grabbed her toy and ran back to the castle, completely ignoring the poor frog. That evening, during a fancy royal dinner, there was a loud knock at the heavy wooden door. It was the green frog! The strict King heard the story and commanded his daughter to keep her promise. The reluctant princess shared her delicious dinner and let the frog sleep on her soft pillow. The next morning, the ugly frog magically transformed into a handsome prince."
  },
  {
    title: "Hansel and Gretel",
    content: "Hansel and Gretel were a young brother and sister who lived near a dark forest with their father and stepmother. Times were very hard, and there was not enough food to eat. Their cruel stepmother convinced their father to leave the children deep in the woods so they would not starve together. Clever Hansel overheard the plan and secretly filled his pockets with white pebbles. When they were left in the forest, he dropped the pebbles along the path, and they found their way home by the moonlight. A few weeks later, the stepmother tried again. This time, Hansel only had a piece of bread and dropped breadcrumbs. But hungry birds ate all the crumbs, and the children were completely lost. They wandered until they found a magical house made entirely of gingerbread, chocolate, and candy. They started eating the sweet house when an old witch came out. She invited them inside but locked Hansel in a cage to fatten him up. Gretel was forced to clean the house. One day, the witch told Gretel to check the hot oven. Brave Gretel pushed the wicked witch inside and locked the door. The children found a chest full of jewels and returned home to their loving father."
  },
  {
    title: "Pinocchio",
    content: "Geppetto was an old, lonely woodcarver. One day, he carved a beautiful wooden puppet out of a magical piece of pine wood. He named the puppet Pinocchio and wished with all his heart that the puppet could be a real boy. That night, the Blue Fairy visited Geppetto's workshop. She touched the wooden puppet with her wand and brought him to life. 'You must prove yourself to be brave, truthful, and unselfish to become a real boy,' the Fairy told Pinocchio. She also assigned Jiminy Cricket to be his conscience. The next morning, Geppetto sent Pinocchio to school, but the naughty puppet got distracted. He joined a puppet show, got tricked by a sneaky fox and a greedy cat, and even traveled to Pleasure Island, where bad boys were turned into donkeys. Every time Pinocchio told a lie to get out of trouble, his wooden nose grew longer and longer! Finally, Pinocchio learned that Geppetto had been swallowed by a giant whale while searching for him. Pinocchio bravely jumped into the ocean, found the whale, and saved his father. Because of his great courage and love, the Blue Fairy finally turned him into a real human boy."
  },
  {
    title: "The Little Mermaid",
    content: "Deep beneath the sparkling blue ocean lived a beautiful little mermaid with a voice as sweet as an angel. She had six older sisters, but she was the only one fascinated by the human world above the waves. On her fifteenth birthday, she was finally allowed to swim to the surface. There, she saw a handsome prince on a large wooden ship. Suddenly, a terrible storm hit, and the ship sank. The brave mermaid saved the drowning prince and brought him safely to the sandy shore. She quickly hid behind a rock as a human girl found him. The prince thought the human girl had saved him. The heartbroken mermaid went to the frightening Sea Witch to ask for human legs. The witch agreed but demanded the mermaid's beautiful voice as payment. 'If the prince marries someone else, you will turn into sea foam,' the witch warned. The mermaid drank the potion and gained legs, though walking caused her terrible pain. The prince loved the silent girl, but he still believed the other girl had saved him. When he married the other girl, the mermaid's sisters brought her a magic knife to save herself. But she chose love, threw the knife away, and became a spirit of the air."
  },
  {
    title: "Beauty and the Beast",
    content: "A wealthy merchant lived in a large house with his three daughters. The youngest daughter was named Beauty because she was lovely both inside and out. One day, the merchant got lost in a dark forest and found shelter in a magnificent, enchanted castle. Before leaving, he picked a single red rose from the garden for Beauty. Suddenly, a terrifying Beast appeared and demanded the merchant's life for stealing the rose. The Beast finally agreed to let him go if one of his daughters came to live in the castle forever. Brave Beauty volunteered to take her father's place. At first, she was terrified of the hideous Beast. But over time, she realized he was actually very gentle, kind, and intelligent. They spent hours reading books and walking in the beautiful gardens together. The Beast asked Beauty to marry him every night, but she always said no. One day, Beauty saw in a magic mirror that her father was very sick. The Beast sadly let her go home. After many days, she had a terrible dream that the Beast was dying. She rushed back to the castle, crying and saying she loved him. Instantly, the terrifying Beast transformed into a handsome prince."
  },
  {
    title: "Aladdin and the Magic Lamp",
    content: "Aladdin was a poor young boy who lived in an ancient desert city. One day, a wicked magician tricked Aladdin into entering a dangerous, hidden cave to fetch an old, dusty oil lamp. When the cave collapsed, Aladdin was trapped inside. Feeling scared in the dark, he accidentally rubbed the dirty lamp. In a flash of colorful smoke, a massive, powerful Genie appeared! 'Your wish is my command, Master,' the Genie boomed. Aladdin wished to escape the cave and return home safely. With the Genie's incredible magic, Aladdin became a very wealthy and powerful prince. He won the heart of the beautiful Princess Jasmine and married her. They lived happily in a magnificent magical palace built by the Genie. But the wicked magician found out about Aladdin's success. While Aladdin was away hunting, the magician tricked the princess by offering to trade new lamps for old ones. He stole the magic lamp and ordered the Genie to move the entire palace to a faraway land. Aladdin was devastated but did not give up. Using a magic ring, he traveled to the distant land, tricked the magician, got his lamp back, and brought his lovely princess home."
  },
  {
    title: "Peter Pan",
    content: "Wendy, John, and Michael were three siblings who lived in a quiet house in London. Every night, Wendy told her brothers exciting stories about a magical boy named Peter Pan, who never grew up. One starry night, Peter Pan actually flew through their open bedroom window, chasing his mischievous shadow. He was accompanied by a tiny, glowing fairy named Tinker Bell. Peter taught the children how to fly using happy thoughts and a sprinkle of magical pixie dust. Together, they flew out the window and soared all the way to Neverland. In Neverland, they met the Lost Boys, beautiful mermaids, and brave Native Americans. But Neverland was also home to the villainous Captain Hook and his pirate crew. Captain Hook hated Peter Pan because Peter had fed Hook's hand to a ticking crocodile. Hook captured Wendy and the boys, planning to make them walk the plank. Peter Pan flew to the rescue, fighting Captain Hook in an exciting sword duel. The cowardly Hook fell into the water and swam away, chased by the hungry ticking crocodile. After the grand adventure, Peter flew the children safely back to their warm beds in London."
  },
  {
    title: "The Princess and the Pea",
    content: "There was once a handsome prince who wanted to marry a real, perfect princess. He traveled all over the world searching for one, but every princess he met had something slightly wrong. One was too loud, another was too rude, and none of them felt quite right. Disappointed, the prince returned to his quiet castle. One dark and stormy night, there was a loud knock at the heavy castle door. The old King opened it to find a young woman standing in the pouring rain. Her clothes were soaking wet, and water was running out of her shoes, but she confidently claimed to be a real princess. The clever Queen decided to test her. Without telling anyone, the Queen placed a single, tiny green pea on the wooden bed frame. Then, she stacked twenty soft mattresses and twenty thick feather beds right on top of the pea. The young woman slept there for the night. The next morning, the Queen asked how she had slept. 'Terribly!' the woman complained. 'There was something extremely hard in my bed, and I am black and blue all over!' The Queen smiled happily. Only a real, delicate princess could feel a tiny pea through twenty mattresses."
  },
  {
    title: "Rumpelstiltskin",
    content: "A foolish miller wanted to impress the greedy King, so he lied and said his beautiful daughter could spin ordinary straw into pure gold. The King locked the poor girl in a tower full of straw and ordered her to spin it into gold by morning, or she would die. The girl sat and cried because she had no idea how to do such magic. Suddenly, a strange little man appeared. He promised to spin the straw into gold in exchange for her necklace. The next night, the King brought more straw, and the little man spun it for her ring. On the third night, the girl had nothing left to give. The little man demanded her firstborn child, and out of fear, she agreed. The King was thrilled with the gold and married the miller's daughter. A year later, she had a beautiful baby, and the strange little man returned to claim his prize. The new Queen begged and cried. The man finally said, 'If you can guess my true name in three days, you can keep the child.' She tried hundreds of names, but none were right. On the third night, a messenger heard the little man dancing and singing his name in the forest. When the Queen guessed 'Rumpelstiltskin,' the little man stomped his feet in anger and disappeared forever."
  },
  {
    title: "The Sleeping Beauty",
    content: "A long-awaited baby princess was born to a very happy King and Queen. They threw a magnificent feast and invited all the magical fairies in the land to bless the child. The fairies gave her gifts of beauty, grace, and a wonderful singing voice. But they forgot to invite one wicked, old fairy. The angry old fairy stormed into the grand hall and cast a terrible curse: 'Before the sun sets on her sixteenth birthday, she shall prick her finger on a spinning wheel and die!' Luckily, one good fairy had not yet given her gift. She could not undo the curse entirely, but she softened it. 'She will not die, but fall into a deep sleep for a hundred years, until awakened by true love's kiss.' The terrified King ordered every spinning wheel in the kingdom to be burned. But on her sixteenth birthday, the curious princess found an old woman spinning thread in a tall, dusty tower. She reached out, pricked her delicate finger, and instantly fell asleep. The entire castle fell asleep with her, and a thick forest of thorny briars grew around the walls. One hundred years later, a brave prince cut through the thorns, found the sleeping princess, and kissed her. The whole castle woke up, and they were married in joy."
  },
  {
    title: "Rapunzel",
    content: "A lonely husband and wife lived next door to a powerful witch's beautiful garden. The pregnant wife craved a green plant called rapunzel that grew in the garden. The husband sneaked in to steal some, but the angry witch caught him. She agreed to let him go only if he gave her the baby when it was born. The witch took the baby girl, named her Rapunzel, and locked her away in a very tall tower in the middle of the woods. The tower had no doors and no stairs. When the witch wanted to visit, she would call out, 'Rapunzel, Rapunzel, let down your hair!' Rapunzel would drop her incredibly long, golden braided hair out the window, and the witch would climb up. One day, a handsome young prince heard Rapunzel singing beautifully from the tower. He watched the witch climb up and learned the secret. When the witch left, he called for Rapunzel to let down her hair. They fell deeply in love and planned to escape. But Rapunzel accidentally told the witch about the prince. Furious, the witch cut off Rapunzel's beautiful hair and sent her far away. When the prince returned, the witch tricked him, and he fell into thorny bushes, blinding himself. After wandering blindly for months, he heard Rapunzel's sweet voice. Her magical tears fell into his eyes, restoring his sight, and they returned to his kingdom to live happily."
  }
];

async function seed() {
  console.log("Seeding levels...");
  await db.insert(levels).values(levelData).onConflictDoNothing();

  const levelRows = await db.select().from(levels);
  const levelMap = new Map(levelRows.map((l) => [l.slug, l.id]));

  console.log("Clearing existing passages...");
  await db.execute(sql`TRUNCATE TABLE passages RESTART IDENTITY CASCADE`);

  console.log("Generating passages...");
  
  const inputs = generateAllPassages();
  
  const values = inputs.map((input) => {
    const levelId = levelMap.get(input.levelSlug);
    if (!levelId) throw new Error(`Missing level ${input.levelSlug}`);
    
    const built = buildPassage(input);
    
    return {
      levelId,
      title: built.title,
      content: built.content,
      durationMinutes: built.durationMinutes,
      wordCount: built.wordCount,
      orderIndex: input.orderIndex,
      isBeginner: input.levelSlug === "beginner"
    };
  }).filter(v => !v.isBeginner); 

  const beginnerLevelId = levelMap.get("beginner");
  beginnerFairyTales.forEach((tale, index) => {
    const wordCount = tale.content.split(/\s+/).length;
    values.push({
      levelId: beginnerLevelId!,
      title: tale.title,
      content: tale.content, 
      durationMinutes: Math.max(1, Math.ceil(wordCount / 100)), 
      wordCount: wordCount,
      orderIndex: index + 1,
      isBeginner: true 
    });
  });

  const finalValues = values.map(({ isBeginner, ...rest }) => rest);

  console.log(`Inserting ${finalValues.length} passages...`);
  const batchSize = 50;
  for (let i = 0; i < finalValues.length; i += batchSize) {
    const batch = finalValues.slice(i, i + batchSize);
    await db.insert(passages).values(batch).onConflictDoNothing();
    console.log(`Inserted batch ${i / batchSize + 1}/${Math.ceil(finalValues.length / batchSize)}`);
  }

  console.log("Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
