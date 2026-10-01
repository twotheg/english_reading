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
    title: "1. The Three Little Pigs",
    content: "Once upon a time, there were three little pigs. They lived in a beautiful forest but decided it was time to build their own houses. The first little pig was very lazy. He did not want to work hard, so he built his house quickly out of light straw. The second little pig worked a little bit harder, but he also wanted to play. He built his house out of wooden sticks. The third little pig was very smart and hard-working. He worked all day under the hot sun to build a strong house out of heavy bricks. One day, a big bad wolf came to the forest. He went to the straw house and said, 'Little pig, let me in!' The pig said no. So the wolf huffed, and he puffed, and he blew the house down. The pig ran to his brother's stick house. The wolf followed him and blew that house down too! Finally, the two terrified pigs ran to the strong brick house. The angry wolf huffed and puffed as hard as he could, but the brick house did not move at all. The tired wolf gave up and ran away forever."
  },
  {
    title: "2. Cinderella",
    content: "Cinderella was a beautiful and kind-hearted girl. Sadly, her mother passed away, and she had to live with her cruel stepmother and two selfish stepsisters. They forced Cinderella to clean the large house from morning until night, wearing old and dirty clothes. One exciting day, the King announced a grand ball at the palace. He wanted to find a lovely bride for the Prince. The stepsisters bought beautiful new dresses, leaving Cinderella behind to cry in the kitchen. Suddenly, a bright light appeared, and her Fairy Godmother stood before her. With a wave of her magic wand, she turned a pumpkin into a magnificent carriage and Cinderella's rags into a sparkling blue gown with delicate glass slippers. 'You must return before the clock strikes midnight, or the magic will break,' she warned. At the ball, the Prince could not take his eyes off Cinderella. They danced the entire evening. Suddenly, the clock began to strike twelve. Cinderella ran out so fast that she dropped one glass slipper on the stairs. The Prince searched the whole kingdom to find the girl whose foot fit the tiny glass slipper. When it fit Cinderella perfectly, he married her, and they lived happily ever after."
  },
  {
    title: "3. The Ugly Duckling",
    content: "It was a warm summer day on the farm. A mother duck was sitting patiently on her nest, waiting for her eggs to hatch. One by one, the small eggs cracked open, and fluffy, bright yellow ducklings popped out. They were adorable. However, there was one large egg left in the nest. When it finally cracked, out stepped a clumsy, gray bird. He looked completely different from his cute little brothers and sisters. All the other animals on the farm pointed and laughed at him. 'You are so strange and ugly!' they quacked cruelly. The poor duckling felt incredibly lonely and heartbroken, so he decided to run away from the farm. He wandered alone through the dangerous forest. Winter came, and the weather turned freezing cold. The duckling had to hide in the icy reeds to survive. Months passed, and finally, the bright spring sun melted the ice. The duckling stretched his wings and flew to a clear blue pond. He looked down at his reflection in the smooth water and gasped in surprise. He was no longer an ugly gray bird. He had grown into a majestic, beautiful white swan. The other swans quickly swam over to welcome him into their family."
  },
  {
    title: "4. Snow White",
    content: "Deep in a faraway kingdom lived a princess named Snow White. She was famous for having skin as white as winter snow, hair as black as midnight, and lips as red as a blooming rose. Her stepmother, the wicked Queen, was terribly vain. Every single morning, the Queen asked her magic mirror, 'Mirror, mirror, on the wall, who is the fairest of them all?' The mirror always answered that the Queen was the most beautiful. But as Snow White grew older, she became even more beautiful than the Queen. One day, the magic mirror told the Queen the truth. Furious and jealous, the Queen ordered her huntsman to take Snow White into the dark forest and leave her there. Lost and terrified, Snow White ran until she discovered a tiny, cozy cottage. Inside, everything was incredibly small. She cleaned the messy house and fell fast asleep across seven little beds. When the seven dwarfs returned from working in the diamond mines, they were surprised but happy to let her stay. However, the evil Queen discovered Snow White was still alive. Disguised as an old woman, she tricked the innocent princess into eating a poisonous red apple."
  },
  {
    title: "5. Little Red Riding Hood",
    content: "There was once a sweet little girl who was loved by everyone who knew her. Her grandmother made her a beautiful red velvet cape with a hood, and she wore it so often that people called her Little Red Riding Hood. One sunny morning, her mother packed a basket with fresh bread and sweet butter. 'Take this to your grandmother because she is feeling sick,' her mother instructed. 'Walk straight there and do not talk to strangers in the woods.' Red Riding Hood skipped cheerfully into the forest. Soon, a large, cunning wolf approached her. 'Where are you going, sweet girl?' the wolf asked politely. Forgetting her mother's warning, she told him exactly where her grandmother lived. The sneaky wolf took a shortcut and arrived at the cottage first. He locked the poor grandmother in a tall closet, dressed in her nightgown, and climbed into her bed. When Red Riding Hood arrived, she noticed her grandmother looked very strange. 'Grandma, what big ears you have!' she said. 'The better to hear you with, my dear,' the wolf replied. 'Grandma, what big teeth you have!' she shouted. 'The better to eat you with!' the wolf roared, jumping out of bed."
  },
  {
    title: "6. The Boy Who Cried Wolf",
    content: "There was a young shepherd boy who lived in a quiet village at the bottom of a large mountain. Every day, his job was to take the village sheep up the grassy hill to eat. It was a very boring and lonely job. The boy had nothing to do but watch the fluffy sheep chew grass all day long. One afternoon, he decided to play a trick to make things exciting. He took a deep breath and screamed as loudly as he could, 'Wolf! Wolf! A big wolf is chasing the sheep!' The hardworking villagers dropped their tools and ran quickly up the steep hill to save the sheep. When they arrived, they saw the boy laughing loudly. There was no wolf at all. The villagers were very angry and went back to work. A few days later, the naughty boy played the exact same trick again. Once more, the villagers rushed up the hill, only to find the boy laughing. But the very next week, a real, hungry wolf came out of the dark forest and started chasing the sheep. The terrified boy screamed, 'Wolf! Wolf! Help me!' But this time, nobody came. They all thought it was just another silly trick."
  },
  {
    title: "7. The Ant and the Grasshopper",
    content: "During a beautifully warm and sunny summer, a green grasshopper was hopping about in the field. He was chirping and singing to his heart's content, enjoying the beautiful weather without a single care in the world. As he played his musical violin, he saw a tiny black ant walking past. The ant was sweating and struggling to carry a heavy piece of corn back to his nest. 'Why are you working so hard on such a lovely day?' asked the lazy grasshopper. 'Come and sing with me instead!' The ant wiped his forehead and replied, 'I am collecting and storing food for the freezing winter. I strongly suggest you do the same.' The grasshopper just laughed loudly. 'Why worry about winter? We have plenty of food right now!' he said, and went back to his joyful singing. Months passed, and the harsh, snowy winter finally arrived. The ground was covered in thick, white snow, and there was absolutely nothing left to eat. The starving grasshopper dragged himself to the ant's warm house and begged for a tiny crumb of food. The ant looked at him and said, 'If you had worked hard during the summer, you would not be hungry today.'"
  },
  {
    title: "8. Jack and the Beanstalk",
    content: "Jack was a poor young boy who lived with his widowed mother. They were so poor that they had no money left to buy bread. One morning, his mother told him to take their only cow to the market and sell it for a good price. On his way to the market, Jack met a mysterious old man who offered to trade the cow for five magic beans. Jack foolishly agreed and brought the beans home. His mother was so furious that she threw the worthless beans out the window and sent Jack to bed without any dinner. The next morning, Jack woke up and looked outside. To his absolute amazement, a gigantic green beanstalk had grown overnight, reaching high into the fluffy white clouds. Jack bravely climbed up the enormous plant. At the very top, he found a magical castle belonging to a scary, booming giant. While the giant was sleeping, Jack quietly snuck inside. He managed to steal a heavy bag of shiny gold coins, a magical goose that laid solid golden eggs, and a beautiful golden harp that played sweet music all by itself. Jack climbed down quickly and chopped down the beanstalk, saving himself and his mother from poverty forever."
  },
  {
    title: "9. Goldilocks and the Three Bears",
    content: "Once upon a time, there was a little girl with curly blonde hair named Goldilocks. One morning, she went for a walk in the forest and got completely lost. Soon, she came upon a lovely little house and knocked on the door. When no one answered, she boldly walked right in. On the kitchen table, there were three bowls of hot porridge. Goldilocks tasted the porridge from the largest bowl, but it was much too hot. She tasted the medium bowl, but it was freezing cold. Then she tasted the smallest bowl, and it was absolutely perfect, so she ate it all up. Feeling tired, she walked into the living room and saw three chairs. She sat in the giant chair, but it was too hard. The medium chair was too soft. But the smallest chair was just right—until it suddenly broke into pieces! Finally, she went upstairs to the bedroom. She lay down in the tiny bed, pulled up the warm blankets, and fell fast asleep. Just then, the three bears who lived in the house returned from their morning walk. The angry baby bear cried, 'Someone has eaten my porridge, broken my chair, and is sleeping in my bed!' Goldilocks woke up, screamed, and ran out of the house as fast as her legs could carry her."
  },
  {
    title: "10. The Frog Prince",
    content: "A long time ago, there lived a beautiful princess who had a favorite golden ball. One sunny afternoon, she was playing near a deep, dark pond in the royal garden. Suddenly, the golden ball slipped from her delicate hands and rolled straight into the deep water. The princess began to cry loudly because she could not reach it. Suddenly, a slimy, green frog popped his head out of the water. 'I will dive down and get your shiny ball,' the frog promised, 'but only if you promise to let me eat from your golden plate and sleep in your comfortable bed.' The princess quickly agreed, secretly thinking a silly frog could never live in a grand palace. The frog dove deep, retrieved the ball, and tossed it onto the grass. The princess grabbed her toy and ran back to the castle, completely ignoring the poor frog. That evening, during a fancy royal dinner, there was a loud knock at the heavy wooden door. It was the green frog! The strict King heard the story and commanded his daughter to keep her promise. The reluctant princess shared her delicious dinner and let the frog sleep on her soft pillow. The next morning, the ugly frog magically transformed into a handsome prince."
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
