import { SetData } from './types';

export const DEMO_SET: SetData = {
  id: 'acoustic-set',
  title: 'Friday Night Acoustic Set',
  comments: 'Capo on 2 for Wonderwall. Keep acoustic rhythm brisk on Hotel California.',
  songs: [
    {
      fileName: 'hotel-california.chordpro',
      title: 'Hotel California',
    },
    {
      fileName: 'wonderwall.chordpro',
      title: 'Wonderwall',
    },
    {
      fileName: 'let-it-be.chordpro',
      title: 'Let It Be',
    },
    {
      fileName: 'ha-perach-be-gani.chordpro',
      title: 'הפרח בגני',
    },
  ],
};

export const DEMO_SONGS: Record<string, string> = {
  'hotel-california.chordpro': `{title: Hotel California}
{artist: Eagles}
{key: Bm}
{tempo: 75}
{capo: 7}
{time: 4/4}

{soc}
[G]Welcome to the Hotel Cali[D]fornia
Such a [F#]lovely place (such a lovely place)
Such a [Bm]lovely face
[G]Plenty of room at the Hotel Cali[D]fornia
Any [Em]time of year (any time of year)
You can [F#]find it here
{eoc}

{sov}
On a [Bm]dark desert highway, [F#]cool wind in my hair
[A]Warm smell of colitas, [E]rising up through the air
[G]Up ahead in the distance, [D]I saw a shimmering light
[Em]My head grew heavy and my sight grew dim, [F#]I had to stop for the night
{eov}

{sov}
There she [Bm]stood in the doorway, [F#]I heard the mission bell
[A]And I was thinking to myself, "This could be [E]Heaven or this could be Hell"
[G]Then she lit up a candle, [D]and she showed me the way
[Em]There were voices down the corridor, [F#]I thought I heard them say...
{eov}
`,
  'wonderwall.chordpro': `{title: Wonderwall}
{artist: Oasis}
{key: Em}
{tempo: 87}
{capo: 2}

{sov}
[Em7]Today is [G]gonna be the day that they're [Dsus4]gonna throw it back to [A7sus4]you
[Em7]By now you [G]should've somehow rea[Dsus4]lized what you gotta [A7sus4]do
[Em7]I don't believe that [G]anybody [Dsus4]feels the way I [A7sus4]do
About you [Cadd9]now [Dsus4] [A7sus4]
{eov}

{soc}
Because [Cadd9]maybe, [Em7] [G]
You're gonna be the one that [Em7]saves me, [Cadd9] [Em7]
And [G]after [Em7]all,
You're my [Cadd9]wonder[Em7]wall [G] [Em7]
{eoc}
`,
  'let-it-be.chordpro': `{title: Let It Be}
{artist: The Beatles}
{key: C}
{tempo: 72}
{time: 4/4}

{sov}
When I [C]find myself in [G]times of trouble, [Am]Mother Mary [F]comes to me
[C]Speaking words of [G]wisdom, let it [F]be [C]
And in my [C]hour of darkness she is [G]standing right in [Am]front of me [F]
[C]Speaking words of [G]wisdom, let it [F]be [C]
{eov}

{soc}
Let it [Am]be, let it [G]be, let it [F]be, let it [C]be
[C]Whisper words of [G]wisdom, let it [F]be [C]
{eoc}
`,
  'ha-perach-be-gani.chordpro': `{title: הפרח בגני}
{artist: זוהר ארגוב}
{key: Dm}
{tempo: 110}
{meta: direction rtl}

{soc}
את ה[Dm]פרח שנב[Gm]ט בגני
את ה[C]דרך שמאירה את [F]עיני
[Gm]בלילות עת [Dm]אשכב לבדי
את [A7]חלום שאינו נ[Dm]גמר
{eoc}

{sov}
[Dm]יום ועוד יום חול[Gm]פים ביעף
[C]ואני שוב נושא [F]עיני אל על
[Gm]מבקש אותך, [Dm]רוצה בך
אל [A7]תלכי ממני [Dm]לעולם
{eov}
`,
};

