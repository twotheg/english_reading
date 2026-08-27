export type PassageInput = {
  title: string;
  levelSlug: string;
  orderIndex: number;
};

const beginnerTopics: string[] = [
  "My Morning Routine",
  "A Day at the Park",
  "My Favorite Animal",
  "Going to School",
  "Eating Breakfast",
  "Playing with Friends",
  "My Family",
  "The Weather Today",
  "A Trip to the Zoo",
  "Buying Groceries",
  "Cooking a Simple Meal",
  "Cleaning My Room",
  "Riding a Bicycle",
  "Swimming in Summer",
  "A Birthday Party",
  "Visiting Grandma",
  "Walking the Dog",
  "Planting Flowers",
  "Drawing Pictures",
  "Reading a Storybook",
  "Flying a Kite",
  "Building a Snowman",
  "Going to the Beach",
  "Watching the Stars",
  "My Favorite Color",
  "The Four Seasons",
  "Farm Animals",
  "Pet Care",
  "A Rainy Day",
  "Playing Soccer",
  "Learning to Share",
  "Helping at Home",
  "The Local Library",
  "Making New Friends",
  "A Picnic Lunch",
  "Camping in the Backyard",
  "Listening to Music",
  "My Favorite Fruit",
  "Going to the Dentist",
  "A Visit to the Doctor",
  "Washing Hands",
  "Brushing Teeth",
  "Getting Dressed",
  "Tying Shoelaces",
  "Packing a School Bag",
  "Doing Homework",
  "A Class Field Trip",
  "Recycling Basics",
  "Saving Money",
  "A Family Dinner",
  "Going to Bed",
  "Dreams at Night",
  "The Sun and Moon",
  "Trees and Leaves",
  "Bugs in the Garden",
  "Birds in the Sky",
  "Fish in the Sea",
  "Trains and Buses",
  "Cars and Trucks",
  "Airplanes in the Sky",
  "Boats on the River",
  "Mountains and Hills",
  "Rivers and Lakes",
  "The Big City",
  "A Small Town",
  "The Countryside",
  "Markets and Shops",
  "Parks and Playgrounds",
  "School Subjects",
  "Numbers and Counting",
  "Colors and Shapes",
  "Days of the Week",
  "Months of the Year",
  "Holidays and Celebrations",
  "Giving Gifts",
  "Saying Thank You",
  "Please and Sorry",
  "Being Kind",
  "Telling the Truth",
  "Working Together",
  "Trying Again",
  "Asking Questions",
  "Listening Carefully",
  "Following Rules",
  "Staying Safe",
  "Crossing the Street",
  "Wearing a Helmet",
  "Fire Safety",
  "Water Safety",
  "Healthy Snacks",
  "Drinking Water",
  "Exercise Every Day",
  "Sleep Well",
  "Feelings and Emotions",
  "When I Am Happy",
  "When I Am Sad",
  "When I Am Scared",
  "When I Am Excited",
  "Making Choices",
  "Setting Goals",
  "Being Brave",
  "Staying Calm",
];

const intermediateTopics: string[] = [
  "The History of Transportation",
  "How Computers Work",
  "Famous Scientists",
  "Healthy Eating Habits",
  "Traveling Abroad",
  "Learning a New Language",
  "The Importance of Sleep",
  "Climate Change Basics",
  "Art and Culture",
  "Music Around the World",
  "The Water Cycle",
  "Renewable Energy",
  "Space Exploration",
  "The Human Body",
  "World Geography",
  "Ancient Civilizations",
  "The Internet Today",
  "Social Media Effects",
  "Modern Education",
  "Job Skills for the Future",
  "Money Management",
  "Starting a Business",
  "Volunteering in Community",
  "Public Transportation",
  "City Planning",
  "Gardening for Beginners",
  "Photography Tips",
  "Cooking Around the World",
  "Sports and Health",
  "Mental Fitness",
  "Reading Strategies",
  "Writing Skills",
  "Listening Skills",
  "Presentation Tips",
  "Teamwork at Work",
  "Time Management",
  "Goal Setting",
  "Problem Solving",
  "Critical Thinking",
  "Creative Thinking",
  "Stress Management",
  "Building Confidence",
  "Making Decisions",
  "Conflict Resolution",
  "Cultural Differences",
  "Etiquette Around the World",
  "Food and Health",
  "Exercise Science",
  "Sleep and Learning",
  "Memory Techniques",
  "Note Taking Methods",
  "Test Preparation",
  "Online Learning",
  "Remote Work Life",
  "Digital Security",
  "Privacy Online",
  "Fake News Awareness",
  "Advertising Tricks",
  "Consumer Choices",
  "Saving the Environment",
  "Recycling Systems",
  "Ocean Pollution",
  "Protecting Forests",
  "Wildlife Conservation",
  "Endangered Species",
  "Natural Disasters",
  "Weather Forecasting",
  "Earthquakes and Safety",
  "Volcanoes and Islands",
  "Rivers and Civilization",
  "Deserts of the World",
  "Rainforest Ecosystems",
  "Polar Regions",
  "Coral Reefs",
  "Mountains and People",
  "Islands and Culture",
  "Migration Patterns",
  "Population Growth",
  "Urban Challenges",
  "Rural Life Today",
  "Farming Technology",
  "Food Supply Chains",
  "Global Trade",
  "Tourism Industry",
  "Hotel Hospitality",
  "Restaurant Business",
  "Customer Service",
  "Marketing Basics",
  "Product Design",
  "Engineering Marvels",
  "Medical Advances",
  "Pharmaceutical Research",
  "Public Health",
  "Disease Prevention",
  "First Aid Skills",
  "Emergency Preparedness",
];

const advancedTopics: string[] = [
  "The Philosophy of Mind",
  "Global Economic Trends",
  "Quantum Mechanics Explained",
  "Constitutional Law and Society",
  "Artificial Intelligence Ethics",
  "Modern Architecture",
  "Neuroscience of Decision Making",
  "International Diplomacy",
  "Renaissance Literature",
  "Sustainable Urban Planning",
  "Behavioral Economics",
  "Cognitive Dissonance",
  "The Future of Democracy",
  "Genetic Engineering",
  "Climate Policy Challenges",
  "Macroeconomic Theories",
  "Microeconomics in Action",
  "Sociological Perspectives",
  "Anthropology of Ritual",
  "Linguistic Relativity",
  "Psycholinguistics",
  "Computational Linguistics",
  "Machine Learning Basics",
  "Deep Learning Revolution",
  "Cybersecurity Threats",
  "Cryptography Principles",
  "Blockchain Applications",
  "Financial Markets Analysis",
  "Investment Strategies",
  "Risk Management",
  "Corporate Governance",
  "Entrepreneurship Theory",
  "Innovation Management",
  "Supply Chain Dynamics",
  "Operations Research",
  "Game Theory Concepts",
  "Statistical Inference",
  "Data Visualization",
  "Research Methodology",
  "Academic Writing",
  "Peer Review Process",
  "Intellectual Property Law",
  "Human Rights Frameworks",
  "International Trade Law",
  "Environmental Law",
  "Labor Market Dynamics",
  "Educational Psychology",
  "Curriculum Design",
  "Assessment and Evaluation",
  "Leadership Theories",
  "Organizational Culture",
  "Change Management",
  "Strategic Planning",
  "Public Policy Analysis",
  "Health Economics",
  "Epidemiology Basics",
  "Bioinformatics",
  "Nanotechnology",
  "Robotics Engineering",
  "Aerospace Engineering",
  "Civil Engineering Challenges",
  "Materials Science",
  "Energy Storage Systems",
  "Nuclear Energy Debate",
  "Carbon Capture Technology",
  "Biodiversity and Ecosystem Services",
  "Conservation Biology",
  "Evolutionary Biology",
  "Astrobiology",
  "Cosmology Frontiers",
  "Particle Physics",
  "Thermodynamics Principles",
  "Relativity Theory",
  "Mathematical Modeling",
  "Optimization Techniques",
  "Ethical Theories",
  "Political Philosophy",
  "Aesthetics and Art Theory",
  "Media Studies",
  "Journalism Ethics",
  "Propaganda Analysis",
  "Public Relations Strategy",
  "Brand Management",
  "Consumer Behavior",
  "Market Research Methods",
  "Product Lifecycle",
  "Quality Management",
  "Project Management",
  "Agile Methodologies",
  "Software Architecture",
  "Database Design",
  "Cloud Computing",
  "Distributed Systems",
  "Human Computer Interaction",
  "User Experience Design",
  "Information Architecture",
];

const beginnerDetails = [
  "smiling faces",
  "sunny days",
  "fresh air",
  "good food",
  "nice people",
  "small surprises",
  "happy moments",
  "kind words",
  "warm feelings",
  "bright colors",
  "quiet mornings",
  "cozy rooms",
  "green grass",
  "blue skies",
  "friendly animals",
];

const intermediateDetails = [
  "historical records",
  "scientific studies",
  "cultural traditions",
  "economic factors",
  "social networks",
  "technological tools",
  "environmental changes",
  "political decisions",
  "educational methods",
  "health outcomes",
  "community support",
  "global connections",
  "local resources",
  "personal experiences",
  "future possibilities",
];

const advancedDetails = [
  "empirical evidence",
  "theoretical frameworks",
  "methodological rigor",
  "interdisciplinary approaches",
  "societal implications",
  "ethical considerations",
  "policy recommendations",
  "comparative analyses",
  "longitudinal studies",
  "qualitative insights",
  "quantitative models",
  "systemic interactions",
  "historical precedents",
  "conceptual distinctions",
  "practical applications",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getBeginnerTemplates(topic: string): string[] {
  return [
    `Many people like ${topic} because it is fun and easy.`,
    `When we talk about ${topic}, we often think of happy times.`,
    `${topic} is something that everyone can enjoy.`,
    `One good thing about ${topic} is that it helps us learn.`,
    `I think ${topic} is important for our daily life.`,
    `You can see ${topic} almost everywhere you go.`,
    `Learning about ${topic} can make us smile.`,
    `Some children love ${topic} very much.`,
    `When I think of ${topic}, I feel warm inside.`,
    `${topic} teaches us to be kind and careful.`,
    `We can share ${topic} with our family and friends.`,
    `A small moment of ${topic} can make a big difference.`,
    `Sometimes ${topic} is simple, but it still matters.`,
    `Everyone has their own way to enjoy ${topic}.`,
    `If you try ${topic}, you might find something new.`,
  ];
}

function getIntermediateTemplates(topic: string): string[] {
  return [
    `${topic} has become an important part of modern life.`,
    `Understanding ${topic} helps us make better decisions.`,
    `Many experts study ${topic} to find useful answers.`,
    `There are several reasons why ${topic} matters today.`,
    `When people learn about ${topic}, they often change their habits.`,
    `${topic} connects different areas such as science, culture, and economics.`,
    `One interesting fact about ${topic} is that it affects everyone.`,
    `The history of ${topic} shows how much society has changed.`,
    `In many countries, ${topic} is taught in schools and universities.`,
    `Technology has changed the way we think about ${topic}.`,
    `People who work in ${topic} need both knowledge and skill.`,
    `Research about ${topic} continues to bring new surprises.`,
    `Some challenges related to ${topic} are still difficult to solve.`,
    `By studying ${topic}, we can improve our daily lives.`,
    `The future of ${topic} will depend on cooperation and innovation.`,
  ];
}

function getAdvancedTemplates(topic: string): string[] {
  return [
    `${topic} represents one of the most complex domains in contemporary scholarship.`,
    `A rigorous analysis of ${topic} requires careful attention to theoretical assumptions.`,
    `Scholars have long debated the fundamental mechanisms underlying ${topic}.`,
    `The interdisciplinary nature of ${topic} demands integration across multiple fields.`,
    `Empirical investigations into ${topic} have yielded both consensus and controversy.`,
    `Conceptual clarity is essential when discussing ${topic} in academic contexts.`,
    `Practitioners and researchers alike must navigate ethical dimensions within ${topic}.`,
    `Methodological choices significantly shape the conclusions drawn about ${topic}.`,
    `Historical developments continue to influence contemporary approaches to ${topic}.`,
    `Policy implications of ${topic} extend beyond narrowly defined disciplinary boundaries.`,
    `The relationship between theory and practice in ${topic} remains dynamically evolving.`,
    `Comparative studies have illuminated cultural variations within ${topic}.`,
    `Longitudinal research provides valuable insights into temporal dynamics of ${topic}.`,
    `Stakeholder engagement is increasingly recognized as vital for advancing ${topic}.`,
    `Synthesizing diverse perspectives remains a central challenge in ${topic}.`,
  ];
}

function makeParagraph(
  topic: string,
  level: "beginner" | "intermediate" | "advanced",
  paragraphIndex: number
): string {
  const templates =
    level === "beginner"
      ? getBeginnerTemplates(topic)
      : level === "intermediate"
      ? getIntermediateTemplates(topic)
      : getAdvancedTemplates(topic);

  const details =
    level === "beginner"
      ? beginnerDetails
      : level === "intermediate"
      ? intermediateDetails
      : advancedDetails;

  const detailPatterns = [
    (d: string) => `, especially when we see ${d}`,
    (d: string) => `, which often includes ${d}`,
    (d: string) => `; for example, ${d} is a common part of it`,
    (d: string) => `, and this reminds us of ${d}`,
    (d: string) => `. One clear example is ${d}`,
    (d: string) => `, while others focus on ${d}`,
  ];

  const sentences: string[] = [];
  const count = 5 + (paragraphIndex % 3);

  for (let i = 0; i < count; i++) {
    let sentence = pick(templates);
    if (Math.random() > 0.35) {
      const detail = pick(details);
      const pattern = pick(detailPatterns);
      const suffix = pattern(detail);
      if (Math.random() > 0.5) {
        sentence = sentence.replace(/\.$/, `${suffix}.`);
      } else {
        sentence = `${sentence} ${suffix}.`;
      }
    }
    sentences.push(sentence);
  }

  return sentences.join(" ");
}

function generatePassageContent(
  topic: string,
  level: "beginner" | "intermediate" | "advanced"
): string {
  const paragraphs: string[] = [];
  for (let i = 0; i < 12; i++) {
    paragraphs.push(makeParagraph(topic, level, i));
  }
  return paragraphs.join("\n\n");
}

function levelForSlug(slug: string): "beginner" | "intermediate" | "advanced" {
  if (slug === "intermediate") return "intermediate";
  if (slug === "advanced") return "advanced";
  return "beginner";
}

export function generateAllPassages(): PassageInput[] {
  const result: PassageInput[] = [];

  beginnerTopics.forEach((title, i) => {
    result.push({
      title,
      levelSlug: "beginner",
      orderIndex: i + 1,
    });
  });

  intermediateTopics.forEach((title, i) => {
    result.push({
      title,
      levelSlug: "intermediate",
      orderIndex: i + 1,
    });
  });

  advancedTopics.forEach((title, i) => {
    result.push({
      title,
      levelSlug: "advanced",
      orderIndex: i + 1,
    });
  });

  return result;
}

export function buildPassage(input: PassageInput): {
  title: string;
  content: string;
  durationMinutes: number;
  wordCount: number;
} {
  const level = levelForSlug(input.levelSlug);
  const content = generatePassageContent(input.title, level);
  const wordCount = content
    .trim()
    .split(/\s+/)
    .filter((w) => /[a-zA-Z0-9]/.test(w)).length;
  return {
    title: input.title,
    content,
    durationMinutes: 10,
    wordCount,
  };
}
