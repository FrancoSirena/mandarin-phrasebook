/**
 * Mandarin Travel Phrasebook — phrase data.
 *
 * The Chinese (zh) and pinyin text below is the canonical content and must be
 * copied verbatim. Do NOT retranslate or "improve" it.
 *
 * Shape of each phrase entry:
 *   { zh: string, pinyin: string, en: string, note?: string }
 *
 * Loading note: this file is intentionally a classic script that attaches to a
 * single global namespace (window.Phrasebook) rather than an ES module using
 * `export`. ES module imports are blocked by CORS when index.html is opened via
 * file://, and this site must also work when opened directly from disk.
 * See README → "Decisions & trade-offs" for the full reasoning.
 */
(function (global) {
  'use strict';

  var CATEGORIES = [
    {
      id: 'basics',
      title: 'Respectful Basics',
      description: 'Politeness goes a long way. Use nín (您) with elders, hosts, and strangers.',
      emoji: '👋'
    },
    {
      id: 'restaurant',
      title: 'At the Restaurant',
      description: 'Essential phrases for ordering, dietary needs, and paying.',
      emoji: '🍽️'
    },
    {
      id: 'chengdu',
      title: 'Chengdu / Sichuan',
      description: 'Try the famous mápó dòufu — the soul of Sichuan cuisine.',
      emoji: '🌶️'
    },
    {
      id: 'shangrila',
      title: 'Shangri-La (Diqing)',
      description: 'Tibetan-influenced dishes from the high plateau. Rich, warming, and unique.',
      emoji: '🏔️'
    },
    {
      id: 'lijiang',
      title: 'Lijiang (Naxi Cuisine)',
      description: 'Naxi flavors: simple, hearty, and deeply local.',
      emoji: '🏮'
    }
  ];

  var PHRASES = {
    basics: [
      { zh: '您好', pinyin: 'nín hǎo', en: 'Hello (polite)', note: 'Use with elders, hosts, or people you just met' },
      { zh: '你好', pinyin: 'nǐ hǎo', en: 'Hello (casual)', note: 'With peers or friends' },
      { zh: '谢谢您', pinyin: 'xièxie nín', en: 'Thank you (polite)' },
      { zh: '不客气', pinyin: 'bù kèqi', en: "You're welcome" },
      { zh: '请', pinyin: 'qǐng', en: 'Please' },
      { zh: '请问', pinyin: 'qǐngwèn', en: 'May I ask…', note: 'A polite opener before a question' },
      { zh: '麻烦您了', pinyin: 'máfan nín le', en: 'Sorry to trouble you', note: 'Very useful when asking a favour' },
      { zh: '不好意思', pinyin: 'bù hǎoyìsi', en: 'Excuse me / small apology' },
      { zh: '对不起', pinyin: 'duìbuqǐ', en: 'Sorry (stronger)' },
      { zh: '没关系', pinyin: 'méi guānxi', en: "It's okay / no problem" },
      { zh: '您先请', pinyin: 'nín xiān qǐng', en: 'After you / please go first' },
      { zh: '辛苦了', pinyin: 'xīnkǔ le', en: 'Thanks for your hard work', note: 'Warm and respectful — great for hosts and drivers' },
      { zh: '再见', pinyin: 'zàijiàn', en: 'Goodbye' }
    ],

    restaurant: [
      { zh: '请给我菜单', pinyin: 'qǐng gěi wǒ càidān', en: 'Please give me the menu' },
      { zh: '我想点这个', pinyin: 'wǒ xiǎng diǎn zhège', en: "I'd like to order this", note: 'Point at the menu while saying it' },
      { zh: '这个是什么？', pinyin: 'zhège shì shénme?', en: 'What is this?' },
      { zh: '我不吃辣', pinyin: 'wǒ bù chī là', en: "I don't eat spicy food" },
      { zh: '请不要放香菜', pinyin: 'qǐng bùyào fàng xiāngcài', en: 'Please no cilantro' },
      { zh: '请给我一杯水', pinyin: 'qǐng gěi wǒ yì bēi shuǐ', en: 'Please give me a glass of water' },
      { zh: '多少钱？', pinyin: 'duōshao qián?', en: 'How much is it?' },
      { zh: '买单', pinyin: 'mǎidān', en: 'The bill, please' },
      { zh: '很好吃！', pinyin: 'hěn hǎochī!', en: "It's delicious!", note: "A compliment the chef will love" },
      { zh: '我吃素', pinyin: 'wǒ chī sù', en: "I'm vegetarian" },
      { zh: '请不要放肉', pinyin: 'qǐng bùyào fàng ròu', en: 'Please no meat' },
      { zh: '洗手间在哪儿？', pinyin: 'xǐshǒujiān zài nǎr?', en: 'Where is the restroom?' }
    ],

    chengdu: [
      { zh: '我想吃麻婆豆腐', pinyin: 'wǒ xiǎng chī mápó dòufu', en: "I'd like to eat mapo tofu", note: 'The iconic Sichuan dish — spicy, numbing, and unforgettable' },
      { zh: '请来一份麻婆豆腐', pinyin: 'qǐng lái yí fèn mápó dòufu', en: 'One portion of mapo tofu, please' },
      { zh: '麻婆豆腐不要放太多辣', pinyin: 'mápó dòufu bùyào fàng tài duō là', en: 'Not too spicy for the mapo tofu, please' },
      { zh: '我想吃正宗的川菜', pinyin: 'wǒ xiǎng chī zhèngzōng de chuāncài', en: "I'd like to eat authentic Sichuan food" },
      { zh: '有没有不辣的菜？', pinyin: 'yǒu méiyǒu bú là de cài?', en: 'Do you have any non-spicy dishes?' },
      { zh: '请推荐一个特色菜', pinyin: 'qǐng tuījiàn yí gè tèsè cài', en: 'Please recommend a signature dish' }
    ],

    shangrila: [
      { zh: '我想吃尼西土锅鸡', pinyin: 'wǒ xiǎng chī níxī tǔguō jī', en: "I'd like to eat Nixi clay-pot chicken", note: 'A Shangri-La Tibetan specialty cooked in black clay' },
      { zh: '请来一份尼西土锅鸡', pinyin: 'qǐng lái yí fèn níxī tǔguō jī', en: 'One portion of Nixi clay-pot chicken, please' },
      { zh: '我想尝尝酥油茶', pinyin: 'wǒ xiǎng chángchang sūyóuchá', en: "I'd like to try butter tea", note: 'The daily drink of Tibetan families' },
      { zh: '请给我一杯酥油茶', pinyin: 'qǐng gěi wǒ yì bēi sūyóuchá', en: 'Please give me a cup of butter tea' },
      { zh: '我想吃锅奔火锅', pinyin: 'wǒ xiǎng chī guōbēn huǒguō', en: "I'd like to eat Guoben hotpot", note: '"Guoben" is a wild plateau vegetable' },
      { zh: '有没有藏式糕点？', pinyin: 'yǒu méiyǒu zàngshì gāodiǎn?', en: 'Do you have Tibetan pastries?' },
      { zh: '请推荐一个藏族特色菜', pinyin: 'qǐng tuījiàn yí gè zàngzú tèsè cài', en: 'Please recommend a Tibetan specialty' }
    ],

    lijiang: [
      { zh: '我想吃鸡豆凉粉', pinyin: 'wǒ xiǎng chī jīdòu liángfěn', en: "I'd like to eat chickpea jelly", note: 'A signature Naxi snack — cool, tangy, and refreshing' },
      { zh: '请来一份鸡豆凉粉', pinyin: 'qǐng lái yí fèn jīdòu liángfěn', en: 'One portion of chickpea jelly, please' },
      { zh: '我想尝尝丽江粑粑', pinyin: 'wǒ xiǎng chángchang lìjiāng bābā', en: "I'd like to try Lijiang baba", note: 'A flaky, layered flatbread with history dating to the Ming Dynasty' },
      { zh: '请给我一个丽江粑粑', pinyin: 'qǐng gěi wǒ yí gè lìjiāng bābā', en: 'Please give me one Lijiang baba' },
      { zh: '我想吃腊排骨火锅', pinyin: 'wǒ xiǎng chī là páigǔ huǒguō', en: "I'd like to eat cured rib hotpot", note: 'A hearty Lijiang winter favourite' },
      { zh: '有没有纳西族特色菜？', pinyin: 'yǒu méiyǒu nàxīzú tèsè cài?', en: 'Do you have Naxi specialty dishes?' },
      { zh: '请推荐一个本地菜', pinyin: 'qǐng tuījiàn yí gè běndì cài', en: 'Please recommend a local dish' }
    ]
  };

  var ns = global.Phrasebook = global.Phrasebook || {};
  ns.CATEGORIES = CATEGORIES;
  ns.PHRASES = PHRASES;
})(typeof window !== 'undefined' ? window : this);
