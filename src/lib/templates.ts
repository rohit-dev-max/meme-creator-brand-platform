export interface MemeTemplate {
  id: string;
  name: string;
  imageUrl: string;
  defaultTop: string;
  defaultBottom: string;
  category: string;
}

export const MEME_TEMPLATES: MemeTemplate[] = [
  {
    id: "grumpy-cat",
    name: "Grumpy Tabby",
    imageUrl:
      "https://images.pexels.com/photos/16417902/pexels-photo-16417902.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    defaultTop: "MONDAY MEETINGS",
    defaultBottom: "COULD HAVE BEEN AN EMAIL",
    category: "Cats",
  },
  {
    id: "scream-cat",
    name: "Screaming Cat",
    imageUrl:
      "https://images.pexels.com/photos/16667961/pexels-photo-16667961.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    defaultTop: "POV: PROD IS DOWN",
    defaultBottom: "AND YOU JUST DEPLOYED",
    category: "Cats",
  },
  {
    id: "vampire-cat",
    name: "Vampire Kitty",
    imageUrl:
      "https://images.pexels.com/photos/9820722/pexels-photo-9820722.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    defaultTop: "ME SEEING",
    defaultBottom: "THE WIFI PASSWORD CHANGED",
    category: "Cats",
  },
  {
    id: "cozy-cat",
    name: "Cozy Drip Cat",
    imageUrl:
      "https://images.pexels.com/photos/6022292/pexels-photo-6022292.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    defaultTop: "WHEN THE FIT",
    defaultBottom: "IS IMMACULATE",
    category: "Cats",
  },
  {
    id: "blep-cat",
    name: "Blep Cat",
    imageUrl:
      "https://images.pexels.com/photos/384555/pexels-photo-384555.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    defaultTop: "ME PRETENDING",
    defaultBottom: "I UNDERSTAND CRYPTO",
    category: "Cats",
  },
  {
    id: "yawn-cat",
    name: "Big Yawn",
    imageUrl:
      "https://images.pexels.com/photos/35316211/pexels-photo-35316211.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    defaultTop: "BOSS: THIS MEETING",
    defaultBottom: "WILL ONLY TAKE 5 MINUTES",
    category: "Cats",
  },
  {
    id: "box-cat",
    name: "Box Goblin",
    imageUrl:
      "https://images.pexels.com/photos/15214032/pexels-photo-15214032.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    defaultTop: "IF IT FITS",
    defaultBottom: "I SITS",
    category: "Cats",
  },
  {
    id: "prod-down",
    name: "Prod Is Down",
    imageUrl:
      "https://images.pexels.com/photos/5831344/pexels-photo-5831344.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    defaultTop: "WHEN CLIENT SAYS",
    defaultBottom: '"JUST ONE SMALL CHANGE"',
    category: "Work",
  },
  {
    id: "shocked-dev",
    name: "Shocked Dev",
    imageUrl:
      "https://images.pexels.com/photos/7534785/pexels-photo-7534785.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    defaultTop: "ME READING",
    defaultBottom: "MY OWN CODE FROM 6 MONTHS AGO",
    category: "Work",
  },
  {
    id: "hoodie-panic",
    name: "Hoodie Panic",
    imageUrl:
      "https://images.pexels.com/photos/5621971/pexels-photo-5621971.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    defaultTop: "CHECKING BANK ACCOUNT",
    defaultBottom: "AFTER STEAM SALE",
    category: "Reactions",
  },
  {
    id: "red-polo",
    name: "Red Polo Shock",
    imageUrl:
      "https://images.pexels.com/photos/3777931/pexels-photo-3777931.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    defaultTop: "WHEN THE GROUP CHAT",
    defaultBottom: "GOES SILENT AFTER YOUR JOKE",
    category: "Reactions",
  },
  {
    id: "suit-call",
    name: "Business Panic",
    imageUrl:
      "https://images.pexels.com/photos/7793122/pexels-photo-7793122.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    defaultTop: "BRAND: CAN YOU MAKE IT",
    defaultBottom: "GO VIRAL BY TOMORROW?",
    category: "Brands",
  },
  {
    id: "afro-shock",
    name: "Blue Wall Shock",
    imageUrl:
      "https://images.pexels.com/photos/3965246/pexels-photo-3965246.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    defaultTop: "POV: YOU SAID",
    defaultBottom: '"I HAVE NO MEMES TODAY"',
    category: "Reactions",
  },
  {
    id: "russian-blue",
    name: "Side Eye Cat",
    imageUrl:
      "https://images.pexels.com/photos/33389426/pexels-photo-33389426.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    defaultTop: "ME WATCHING",
    defaultBottom: "YOU STEAL MY MEME FORMAT",
    category: "Cats",
  },
];

export const TEMPLATE_CATEGORIES = ["All", "Cats", "Work", "Reactions", "Brands"];
