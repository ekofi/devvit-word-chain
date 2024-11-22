import { Devvit, useState, useForm } from "@devvit/public-api";

type WordEntry = {
  word: string;
  username: string;
  timestamp: number;
  votes: number;
  memeStatus: number;
  isStartup: boolean;
};

const WordChainGame = (context) => {
  const [currentChain, setCurrentChain] = useState<WordEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const getLastWord = () => {
    return currentChain.length > 0
      ? currentChain[currentChain.length - 1].word
      : "START";
  };

  const getWordScore = (word: string): number => {
    let score = word.length * 5;
    if (/ai|ml|api|saas|cloud/i.test(word)) score += 20;
    if (/scale|enterprise|solution/i.test(word)) score += 15;
    if (/blockchain|crypto|neural|quantum/i.test(word)) score += 25;
    if (/revenue|growth|retention/i.test(word)) score += 15;
    return Math.min(score, 100);
  };

  const validateWord = (word: string): string | null => {
    if (!word || word.length === 0) return "Please enter a word";
    if (!/^[a-zA-Z]+$/.test(word)) return "Word must contain only letters";

    const lastWord = getLastWord();
    if (
      lastWord !== "START" &&
      word[0].toLowerCase() !== lastWord[lastWord.length - 1].toLowerCase()
    ) {
      return `Word must start with "${lastWord[
        lastWord.length - 1
      ].toUpperCase()}"`;
    }

    if (
      currentChain.some(
        (entry) => entry.word.toLowerCase() === word.toLowerCase()
      )
    ) {
      return "This word has already been used";
    }

    return null;
  };

  const submitWord = async (word: string) => {
    if (isSubmitting) return;

    const validationError = validateWord(word);
    if (validationError) {
      context.ui.showToast({ text: validationError, appearance: "error" });
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const user = await context.reddit.getCurrentUser();
      const wordScore = getWordScore(word);

      const newEntry: WordEntry = {
        word: word.toUpperCase(),
        username: user.username,
        timestamp: Date.now(),
        votes: 0,
        memeStatus: wordScore,
        isStartup: /ai|tech|smart|cloud/.test(word.toLowerCase()),
      };

      setCurrentChain((prevChain) => [...prevChain, newEntry]);

      context.ui.showToast({
        text: newEntry.isStartup
          ? "🚀 Successfully disrupted the chain!"
          : "✨ Word added successfully!",
        appearance: "success",
      });
    } catch (e) {
      console.error("Error submitting word:", e);
      setError(
        "Failed to submit word. Please try again or check your connection."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const wordForm = useForm(
    {
      fields: [
        {
          type: "string",
          name: "word",
          label: `Enter a word starting with ${
            getLastWord() === "START"
              ? "any letter"
              : getLastWord()[getLastWord().length - 1].toUpperCase()
          }`,
        },
      ],
    },
    async (values) => {
      await submitWord(values.word.trim());
    }
  );

  return (
    <vstack padding="medium" gap="medium">
      <text size="xxlarge" weight="bold" align="center">
        SaaS Word Chain 🚀
      </text>

      <button
        appearance="primary"
        onPress={() => context.ui.showForm(wordForm)}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Shipping... 🚀" : "Add Word 🚀"}
      </button>

      {error && (
        <text color="red" size="small">
          {error}
        </text>
      )}

      <vstack padding="medium" gap="medium">
        <text>Start the chain by adding a word! 🚀</text>

        {currentChain.map((entry, index) => (
          <vstack
            key={index}
            backgroundColor="secondary"
            padding="medium"
            cornerRadius="medium"
          >
            <text color="white">{entry.word}</text>
            <text color="white">by u/{entry.username}</text>
            <text color="white">Meme Status: {entry.memeStatus}%</text>
          </vstack>
        ))}
      </vstack>
    </vstack>
  );
};

Devvit.configure({
  redditAPI: true,
});

Devvit.addMenuItem({
  label: "Start Word Chain Game",
  location: "subreddit",
  forUserType: "moderator",
  onPress: async (_event, context) => {
    const { reddit } = context;
    const subreddit = await reddit.getCurrentSubreddit();

    await reddit.submitPost({
      title: "🚀 SaaS Word Chain - Build the Next Unicorn!",
      subredditName: subreddit.name,
      preview: (
        <vstack alignment="middle center">
          <text size="large">Initializing your next unicorn... 🦄</text>
        </vstack>
      ),
    });
  },
});

Devvit.addCustomPostType({
  name: "SaaS Word Chain",
  description:
    "A word chain game with a SaaS twist! Connect words where each word starts with the last letter of the previous word. Get bonus points for tech terms!",
  height: "tall",
  defaultQuery: {},
  render: WordChainGame,
});

export default Devvit;
