import type { Greetings } from './schema'

// What a survivor says when you talk to them, by personality and by how they feel
// about you. {name} is the survivor's name. Lines take turns, so the same person
// never greets you the same way twice in a row.

export const greetings: Greetings = {
  brave: {
    hostile: [
      '{name} squares up before you are close. "Walk away. That is the only warning you get."',
      '{name} cracks their knuckles, one by one. "I have been hoping you would come back."',
      '{name} plants their feet in your path. "You and me. Right here. I have the time."',
    ],
    wary: [
      '{name} does not smile. "I remember what you did. Keep your hands where I can see them."',
      '{name} looks you over like a door that might be rigged. "Talk fast."',
      '{name} folds their arms. "I fought beside worse than you. Not by choice."',
    ],
    neutral: [
      '{name} nods. "Stick close if things get loud. They always get loud."',
      '{name} is wrapping tape round their knuckles. "You fighting today, or just looking?"',
      '{name} points down the street with a pipe. "Something big went that way. I am going after it."',
      '{name} grins at the sky\'s new words. "Say what you like. It is never boring now."',
    ],
    friendly: [
      '{name} claps your shoulder hard enough to hurt. "Still alive! Good. I was not done with you."',
      '{name} tosses you half a chocolate bar. "Eat. We have monsters to embarrass."',
      '{name} grins. "Anyone gives you trouble, you send them to me. I mean it."',
    ],
  },
  cautious: {
    hostile: [
      '{name} backs away, eyes on your hands. "No closer. I have done the math on you."',
      '{name} is already halfway to the exit. "You are the reason I check corners twice."',
      '{name} keeps a table between you. "I know three ways out of here. You know none of them."',
    ],
    wary: [
      '{name} watches you for a long moment before speaking. "Why are you here?"',
      '{name} answers a question you did not ask. "No. I have not seen anything. Nobody has."',
      '{name} glances at the exits, then at you, then at the exits. "Make it quick."',
    ],
    neutral: [
      '{name} speaks without looking up from a hand-drawn map. "The ambushes come at the corners. Mostly."',
      '{name} studies you. "You walk loud. Things here listen for that."',
      '{name} counts something on their fingers and stops when you arrive. "Nothing. Just counting."',
      '{name} keeps their voice low. "The board changes when nobody is reading it. Have you noticed?"',
    ],
    friendly: [
      '{name} lowers the knife they were holding behind their back. "Oh. It is you. Good."',
      '{name} slips you a folded note: three safe streets, one underlined. "Do not ask how I know."',
      '{name} almost smiles. "I saved you a spot by the wall. Best view of the doors."',
    ],
  },
  ruthless: {
    hostile: [
      '{name} sees you and their hand goes to their weapon. "Saves me looking for you."',
      '{name} smiles with none of their face. "Funny. I was just thinking about you."',
      '{name} rolls their shoulders. "No crowd. No witnesses. Lucky me."',
    ],
    wary: [
      '{name} sizes you up like a price tag, and does not like the number.',
      '{name} keeps eating. "You owe me. I have not decided what yet."',
      '{name} does not get up. "You are still breathing. That is your problem, not mine."',
    ],
    neutral: [
      '{name} sizes you up like a price tag.',
      '{name} flips a coin and catches it without looking. "Everything here costs something. Remember that."',
      '{name} wipes a blade clean on their sleeve. "Business or pleasure?"',
      '{name} glances at your pockets before your face. "What are you carrying?"',
    ],
    friendly: [
      '{name} nods, which from {name} is a speech. "You are useful. Stay that way."',
      '{name} slides a stolen bandage across the table. "Do not thank me. Thank the idiot I took it from."',
      '{name} almost laughs. "You and I would do well, if the city lets us. It will not."',
    ],
  },
  kind: {
    hostile: [
      '{name} flinches at the sight of you. "Please go. I helped you once."',
      '{name} stands in front of someone smaller. "Not them. Not today. Not you."',
      '{name} will not look at you. "I keep a list of people I would not feed. You are on it."',
    ],
    wary: [
      '{name} keeps their distance. "I remember you. I want to think better of you. Help me."',
      '{name} hesitates, then holds out a water bottle anyway. "Do not make me sorry."',
      '{name} speaks gently, which is worse. "Whatever you did, I hope it was worth it."',
    ],
    neutral: [
      '{name} offers you half a sandwich. "You look like you need it."',
      '{name} is stitching someone\'s coat with fishing line. "Sit. You are bleeding a little."',
      '{name} hums while they sort bandages into piles. "Small ones for small hurts. We are low on small hurts."',
      '{name} looks up from a sleeping stranger. "They have not woken since the sirens. I talk to them anyway."',
    ],
    friendly: [
      '{name} hugs you before you can stop them. "You came back! I kept your blanket dry."',
      '{name} presses a warm tin into your hands. "Soup. Do not ask from what. It is good."',
      '{name} laughs, tired and real. "Every time you walk in, I count one more. Keep making me count."',
    ],
  },
  schemer: {
    hostile: [
      '{name} smiles too wide. "Oh, it is you. I have told everyone such stories about you."',
      '{name} raises both hands, palms open, eyes on your back. "No hard feelings. Mine are all soft."',
      '{name} whistles once. Somewhere behind you, someone answers.',
    ],
    wary: [
      '{name} smiles a little too quickly. "Friends, yes? Of course yes."',
      '{name} sighs theatrically. "You hurt my feelings. I charge interest on those."',
      '{name} pretends to be busy with something that is not there. "I am not here. You did not see me."',
    ],
    neutral: [
      '{name} smiles a little too quickly. "Friends, yes?"',
      '{name} leans in close. "I know a secret about this zone. Not for free. Nothing is."',
      '{name} offers you a coin trick, and keeps the coin. "Lesson one."',
      '{name} drops their voice. "Everyone is lying to you. Except me. Mostly."',
    ],
    friendly: [
      '{name} links an arm through yours. "My favorite investment! You are paying off beautifully."',
      '{name} winks. "Someone is selling your name to a constellation. I bought it back. You owe me."',
      '{name} tucks a rumor into your pocket like a coin. "That one is free. The next one is not."',
    ],
  },
}
