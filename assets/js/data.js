/**
 * Mandarin Travel Phrasebook — phrase data.
 *
 * The Chinese (zh) and pinyin text below is the canonical content and must be
 * copied verbatim. Do NOT retranslate or "improve" it.
 *
 * Shape of each phrase entry:
 *   { zh, pinyin, phonetic, en, note? }
 *   - pinyin   = standard romanisation with tone marks (the accurate one)
 *   - phonetic = rough English "sounds like" spelling, added on request
 *   - note     = optional
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
      id: 'everyday',
      title: 'Everyday Essentials',
      description: 'Introductions, polite requests, and the phrases that keep a conversation going.',
      emoji: '💬'
    },
    {
      id: 'restaurant',
      title: 'At the Restaurant',
      description: 'Essential phrases for ordering, dietary needs, and paying.',
      emoji: '🍽️'
    },
    {
      id: 'hotel',
      title: 'Hotel Check-in',
      description: 'Checking in and out, room requests, Wi-Fi, and little problems.',
      emoji: '🏨'
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
    },
    {
      id: 'shenzhen',
      title: 'Shenzhen Tech Market (Huaqiangbei)',
      description: 'Buying a mini PC or tablet at Shenzhen\u0027s Huaqiangbei electronics market — specs, bargaining, warranty, and payment.',
      emoji: '💻'
    }
  ];

  var PHRASES = {
    basics: [
      { zh: '您好', pinyin: 'nín hǎo', phonetic: 'neen how', en: 'Hello (polite)', note: 'Use with elders, hosts, or people you just met' },
      { zh: '你好', pinyin: 'nǐ hǎo', phonetic: 'nee how', en: 'Hello (casual)', note: 'With peers or friends' },
      { zh: '谢谢您', pinyin: 'xièxie nín', phonetic: 'shyeh-shyeh neen', en: 'Thank you (polite)' },
      { zh: '不客气', pinyin: 'bù kèqi', phonetic: 'boo kuh-chee', en: "You're welcome" },
      { zh: '请', pinyin: 'qǐng', phonetic: 'ching', en: 'Please' },
      { zh: '请问', pinyin: 'qǐngwèn', phonetic: 'ching-wun', en: 'May I ask…', note: 'A polite opener before a question' },
      { zh: '麻烦您了', pinyin: 'máfan nín le', phonetic: 'mah-fahn neen luh', en: 'Sorry to trouble you', note: 'Very useful when asking a favour' },
      { zh: '不好意思', pinyin: 'bù hǎoyìsi', phonetic: 'boo how-yee-suh', en: 'Excuse me / small apology' },
      { zh: '对不起', pinyin: 'duìbuqǐ', phonetic: 'dway-boo-chee', en: 'Sorry (stronger)' },
      { zh: '没关系', pinyin: 'méi guānxi', phonetic: 'may gwan-shee', en: "It's okay / no problem" },
      { zh: '您先请', pinyin: 'nín xiān qǐng', phonetic: 'neen shyehn ching', en: 'After you / please go first' },
      { zh: '辛苦了', pinyin: 'xīnkǔ le', phonetic: 'sheen-koo luh', en: 'Thanks for your hard work', note: 'Warm and respectful — great for hosts and drivers' },
      { zh: '再见', pinyin: 'zàijiàn', phonetic: 'dzai-jyehn', en: 'Goodbye' }
    ],

    // Added on request — general-use & politeness phrases (review with a native speaker).
    everyday: [
      { zh: '很高兴认识你', pinyin: 'hěn gāoxìng rènshi nǐ', phonetic: 'hun gaow-shing run-shr nee', en: 'Nice to meet you' },
      { zh: '你叫什么名字？', pinyin: 'nǐ jiào shénme míngzi?', phonetic: 'nee jyaow shun-muh ming-dzuh', en: "What's your name?" },
      { zh: '我叫…', pinyin: 'wǒ jiào …', phonetic: 'waw jyaow …', en: 'My name is…', note: 'Fill in your name after 我叫' },
      { zh: '我是外国人', pinyin: 'wǒ shì wàiguórén', phonetic: 'waw shr why-gwaw-ren', en: "I'm a foreigner" },
      { zh: '我是意大利人', pinyin: 'wǒ shì Yìdàlì rén', phonetic: 'waw shr ee-dah-lee ren', en: "I'm Italian" },
      { zh: '请慢一点说', pinyin: 'qǐng màn yìdiǎn shuō', phonetic: 'ching mahn ee-dyehn shwaw', en: 'Please speak a bit slower' },
      { zh: '请再说一遍', pinyin: 'qǐng zài shuō yí biàn', phonetic: 'ching dzai shwaw ee byehn', en: 'Please say that again' },
      { zh: '你会说英语吗？', pinyin: 'nǐ huì shuō Yīngyǔ ma?', phonetic: 'nee hway shwaw ying-yoo mah', en: 'Do you speak English?' },
      { zh: '我不会说中文', pinyin: 'wǒ bú huì shuō Zhōngwén', phonetic: 'waw boo hway shwaw jong-wun', en: "I don't speak Chinese" },
      { zh: '我只会说一点中文', pinyin: 'wǒ zhǐ huì shuō yìdiǎn Zhōngwén', phonetic: 'waw jr hway shwaw ee-dyehn jong-wun', en: 'I only speak a little Chinese' },
      { zh: '我不明白', pinyin: 'wǒ bù míngbai', phonetic: 'waw boo ming-bye', en: "I don't understand" },
      { zh: '我听不懂', pinyin: 'wǒ tīng bu dǒng', phonetic: 'waw ting boo dong', en: "I can't understand what you said" },
      { zh: '请帮我', pinyin: 'qǐng bāng wǒ', phonetic: 'ching bahng waw', en: 'Please help me' },
      { zh: '这个怎么说？', pinyin: 'zhège zěnme shuō?', phonetic: 'juh-guh dzun-muh shwaw', en: 'How do you say this?', note: 'Point at the thing' },
      { zh: '这是什么意思？', pinyin: 'zhè shì shénme yìsi?', phonetic: 'juh shr shun-muh ee-suh', en: 'What does this mean?', note: 'Point at the word' },
      { zh: '我要去…', pinyin: 'wǒ yào qù …', phonetic: 'waw yow choo …', en: 'I want to go to…', note: 'Add a place name after 去' },
      { zh: '怎么走？', pinyin: 'zěnme zǒu?', phonetic: 'dzun-muh dzoh', en: 'How do I get there?' },
      { zh: '地铁站在哪儿？', pinyin: 'dìtiězhàn zài nǎr?', phonetic: 'dee-tyeh-jahn dzai nar', en: 'Where is the metro station?' },
      { zh: '干杯', pinyin: 'gānbēi', phonetic: 'gahn-bay', en: 'Cheers!' },
      { zh: '保重', pinyin: 'bǎozhòng', phonetic: 'baow-jong', en: 'Take care' },
      { zh: '祝你好运', pinyin: 'zhù nǐ hǎoyùn', phonetic: 'joo nee how-yoon', en: 'Good luck' }
    ],

    restaurant: [
      { zh: '请给我菜单', pinyin: 'qǐng gěi wǒ càidān', phonetic: 'ching gay waw tsai-dahn', en: 'Please give me the menu' },
      { zh: '我想点这个', pinyin: 'wǒ xiǎng diǎn zhège', phonetic: 'waw shyahng dyehn juh-guh', en: "I'd like to order this", note: 'Point at the menu while saying it' },
      { zh: '这个是什么？', pinyin: 'zhège shì shénme?', phonetic: 'juh-guh shr shun-muh', en: 'What is this?' },
      { zh: '我不吃辣', pinyin: 'wǒ bù chī là', phonetic: 'waw boo chr lah', en: "I don't eat spicy food" },
      { zh: '请不要放香菜', pinyin: 'qǐng bùyào fàng xiāngcài', phonetic: 'ching boo-yow fahng shyahng-tsai', en: 'Please no cilantro' },
      { zh: '请给我一杯水', pinyin: 'qǐng gěi wǒ yì bēi shuǐ', phonetic: 'ching gay waw ee bay shway', en: 'Please give me a glass of water' },
      { zh: '多少钱？', pinyin: 'duōshao qián?', phonetic: 'dwaw-shaow chyehn', en: 'How much is it?' },
      { zh: '买单', pinyin: 'mǎidān', phonetic: 'my-dahn', en: 'The bill, please' },
      { zh: '很好吃！', pinyin: 'hěn hǎochī!', phonetic: 'hun how-chr', en: "It's delicious!", note: "A compliment the chef will love" },
      { zh: '我吃素', pinyin: 'wǒ chī sù', phonetic: 'waw chr soo', en: "I'm vegetarian" },
      { zh: '请不要放肉', pinyin: 'qǐng bùyào fàng ròu', phonetic: 'ching boo-yow fahng roh', en: 'Please no meat' },
      { zh: '洗手间在哪儿？', pinyin: 'xǐshǒujiān zài nǎr?', phonetic: 'shee-show-jyehn dzai nar', en: 'Where is the restroom?' }
    ],

    // Added on request — hotel check-in phrases (review with a native speaker).
    hotel: [
      { zh: '我有预订', pinyin: 'wǒ yǒu yùdìng', phonetic: 'waw yo yoo-ding', en: 'I have a reservation' },
      { zh: '我没有预订', pinyin: 'wǒ méiyǒu yùdìng', phonetic: 'waw may-yo yoo-ding', en: "I don't have a reservation" },
      { zh: '有没有空房间？', pinyin: 'yǒu méiyǒu kòng fángjiān?', phonetic: 'yo may-yo kong fahng-jyehn', en: 'Do you have any rooms available?' },
      { zh: '我想办理入住', pinyin: 'wǒ xiǎng bànlǐ rùzhù', phonetic: 'waw shyahng bahn-lee roo-joo', en: "I'd like to check in" },
      { zh: '我想退房', pinyin: 'wǒ xiǎng tuìfáng', phonetic: 'waw shyahng tway-fahng', en: "I'd like to check out" },
      { zh: '我的名字是…', pinyin: 'wǒ de míngzi shì …', phonetic: 'waw duh ming-dzuh shr …', en: 'My name is…', note: 'Fill in your name' },
      { zh: '有单人间吗？', pinyin: 'yǒu dānrénjiān ma?', phonetic: 'yo dahn-ren-jyehn mah', en: 'Do you have a single room?' },
      { zh: '有双人间吗？', pinyin: 'yǒu shuāngrénjiān ma?', phonetic: 'yo shwahng-ren-jyehn mah', en: 'Do you have a double room?' },
      { zh: '一晚多少钱？', pinyin: 'yì wǎn duōshao qián?', phonetic: 'ee wahn dwaw-shaow chyehn', en: 'How much per night?' },
      { zh: '含早餐吗？', pinyin: 'hán zǎocān ma?', phonetic: 'hahn dzaow-tsahn mah', en: 'Does it include breakfast?' },
      { zh: '早餐几点开始？', pinyin: 'zǎocān jǐ diǎn kāishǐ?', phonetic: 'dzaow-tsahn jee dyehn kie-shr', en: 'What time is breakfast?' },
      { zh: '有无线网络吗？', pinyin: 'yǒu wúxiàn wǎngluò ma?', phonetic: 'yo woo-shyehn wahng-lwaw mah', en: 'Is there Wi-Fi?' },
      { zh: '无线网络密码是多少？', pinyin: 'wúxiàn wǎngluò mìmǎ shì duōshao?', phonetic: 'woo-shyehn wahng-lwaw mee-mah shr dwaw-shaow', en: "What's the Wi-Fi password?" },
      { zh: '我的房间号是多少？', pinyin: 'wǒ de fángjiān hào shì duōshao?', phonetic: 'waw duh fahng-jyehn how shr dwaw-shaow', en: "What's my room number?" },
      { zh: '请给我房卡', pinyin: 'qǐng gěi wǒ fángkǎ', phonetic: 'ching gay waw fahng-kah', en: 'Please give me the room key card', note: '房卡 = room key card' },
      { zh: '空调坏了', pinyin: 'kōngtiáo huài le', phonetic: 'kong-tyaow hwy luh', en: 'The air conditioning is broken' },
      { zh: '没有热水', pinyin: 'méiyǒu rèshuǐ', phonetic: 'may-yo ruh-shway', en: "There's no hot water" },
      { zh: '可以帮我拿行李吗？', pinyin: 'kěyǐ bāng wǒ ná xíngli ma?', phonetic: 'kuh-yee bahng waw nah shing-lee mah', en: 'Can you help me with my luggage?' },
      { zh: '可以寄存行李吗？', pinyin: 'kěyǐ jìcún xíngli ma?', phonetic: 'kuh-yee jee-tswun shing-lee mah', en: 'Can I store my luggage?' },
      { zh: '请给我一张发票', pinyin: 'qǐng gěi wǒ yì zhāng fāpiào', phonetic: 'ching gay waw ee jahng fah-pyaow', en: 'Please give me a receipt (fapiao)', note: '发票 = official tax invoice' },
      { zh: '退房时间是几点？', pinyin: 'tuìfáng shíjiān shì jǐ diǎn?', phonetic: 'tway-fahng shr-jyehn shr jee dyehn', en: 'What time is checkout?' },
      { zh: '我明天走', pinyin: 'wǒ míngtiān zǒu', phonetic: 'waw ming-tyehn dzoh', en: "I'm leaving tomorrow" }
    ],

    chengdu: [
      { zh: '我想吃麻婆豆腐', pinyin: 'wǒ xiǎng chī mápó dòufu', phonetic: 'waw shyahng chr mah-paw doh-foo', en: "I'd like to eat mapo tofu", note: 'The iconic Sichuan dish — spicy, numbing, and unforgettable' },
      { zh: '请来一份麻婆豆腐', pinyin: 'qǐng lái yí fèn mápó dòufu', phonetic: 'ching lie ee fun mah-paw doh-foo', en: 'One portion of mapo tofu, please' },
      { zh: '麻婆豆腐不要放太多辣', pinyin: 'mápó dòufu bùyào fàng tài duō là', phonetic: 'mah-paw doh-foo boo-yow fahng tie dwaw lah', en: 'Not too spicy for the mapo tofu, please' },
      { zh: '我想吃正宗的川菜', pinyin: 'wǒ xiǎng chī zhèngzōng de chuāncài', phonetic: 'waw shyahng chr jung-dzong duh chwan-tsai', en: "I'd like to eat authentic Sichuan food" },
      { zh: '有没有不辣的菜？', pinyin: 'yǒu méiyǒu bú là de cài?', phonetic: 'yo may-yo boo lah duh tsai', en: 'Do you have any non-spicy dishes?' },
      { zh: '请推荐一个特色菜', pinyin: 'qǐng tuījiàn yí gè tèsè cài', phonetic: 'ching tway-jyehn ee guh tuh-suh tsai', en: 'Please recommend a signature dish' }
    ],

    shangrila: [
      { zh: '我想吃尼西土锅鸡', pinyin: 'wǒ xiǎng chī níxī tǔguō jī', phonetic: 'waw shyahng chr nee-shee too-gwaw jee', en: "I'd like to eat Nixi clay-pot chicken", note: 'A Shangri-La Tibetan specialty cooked in black clay' },
      { zh: '请来一份尼西土锅鸡', pinyin: 'qǐng lái yí fèn níxī tǔguō jī', phonetic: 'ching lie ee fun nee-shee too-gwaw jee', en: 'One portion of Nixi clay-pot chicken, please' },
      { zh: '我想尝尝酥油茶', pinyin: 'wǒ xiǎng chángchang sūyóuchá', phonetic: 'waw shyahng chahng-chahng soo-yo-chah', en: "I'd like to try butter tea", note: 'The daily drink of Tibetan families' },
      { zh: '请给我一杯酥油茶', pinyin: 'qǐng gěi wǒ yì bēi sūyóuchá', phonetic: 'ching gay waw ee bay soo-yo-chah', en: 'Please give me a cup of butter tea' },
      { zh: '我想吃锅奔火锅', pinyin: 'wǒ xiǎng chī guōbēn huǒguō', phonetic: 'waw shyahng chr gwaw-bun hwaw-gwaw', en: "I'd like to eat Guoben hotpot", note: '"Guoben" is a wild plateau vegetable' },
      { zh: '有没有藏式糕点？', pinyin: 'yǒu méiyǒu zàngshì gāodiǎn?', phonetic: 'yo may-yo dzahng-shr gaow-dyehn', en: 'Do you have Tibetan pastries?' },
      { zh: '请推荐一个藏族特色菜', pinyin: 'qǐng tuījiàn yí gè zàngzú tèsè cài', phonetic: 'ching tway-jyehn ee guh dzahng-dzoo tuh-suh tsai', en: 'Please recommend a Tibetan specialty' }
    ],

    lijiang: [
      { zh: '我想吃鸡豆凉粉', pinyin: 'wǒ xiǎng chī jīdòu liángfěn', phonetic: 'waw shyahng chr jee-doh lyahng-fun', en: "I'd like to eat chickpea jelly", note: 'A signature Naxi snack — cool, tangy, and refreshing' },
      { zh: '请来一份鸡豆凉粉', pinyin: 'qǐng lái yí fèn jīdòu liángfěn', phonetic: 'ching lie ee fun jee-doh lyahng-fun', en: 'One portion of chickpea jelly, please' },
      { zh: '我想尝尝丽江粑粑', pinyin: 'wǒ xiǎng chángchang lìjiāng bābā', phonetic: 'waw shyahng chahng-chahng lee-jyahng bah-bah', en: "I'd like to try Lijiang baba", note: 'A flaky, layered flatbread with history dating to the Ming Dynasty' },
      { zh: '请给我一个丽江粑粑', pinyin: 'qǐng gěi wǒ yí gè lìjiāng bābā', phonetic: 'ching gay waw ee guh lee-jyahng bah-bah', en: 'Please give me one Lijiang baba' },
      { zh: '我想吃腊排骨火锅', pinyin: 'wǒ xiǎng chī là páigǔ huǒguō', phonetic: 'waw shyahng chr lah pie-goo hwaw-gwaw', en: "I'd like to eat cured rib hotpot", note: 'A hearty Lijiang winter favourite' },
      { zh: '有没有纳西族特色菜？', pinyin: 'yǒu méiyǒu nàxīzú tèsè cài?', phonetic: 'yo may-yo nah-shee-dzoo tuh-suh tsai', en: 'Do you have Naxi specialty dishes?' },
      { zh: '请推荐一个本地菜', pinyin: 'qǐng tuījiàn yí gè běndì cài', phonetic: 'ching tway-jyehn ee guh bun-dee tsai', en: 'Please recommend a local dish' }
    ],

    // Added on request for the "Shenzhen / Huaqiangbei tech market" use case.
    // NOT part of the original verbatim dataset — please review these
    // translations with a native speaker before relying on them.
    shenzhen: [
      { zh: '我想买一个迷你主机', pinyin: 'wǒ xiǎng mǎi yí gè mínǐ zhǔjī', phonetic: 'waw shyahng my ee guh mee-nee joo-jee', en: "I'd like to buy a mini PC", note: '迷你主机 is the usual term for "mini PC"' },
      { zh: '有没有N100的迷你主机？', pinyin: 'yǒu méiyǒu N100 de mínǐ zhǔjī?', phonetic: 'yo may-yo N100 duh mee-nee joo-jee', en: 'Do you have an N100 mini PC?', note: 'N100 is a popular low-power Intel chip' },
      { zh: '有什么牌子？', pinyin: 'yǒu shénme páizi?', phonetic: 'yo shun-muh pie-dzuh', en: 'What brands do you have?' },
      { zh: '这个是什么配置？', pinyin: 'zhège shì shénme pèizhì?', phonetic: 'juh-guh shr shun-muh pay-jr', en: 'What are the specs?', note: '配置 = specs / configuration' },
      { zh: '内存有多大？', pinyin: 'nèicún yǒu duō dà?', phonetic: 'nay-tswun yo dwaw dah', en: 'How much RAM does it have?', note: '内存 = memory (RAM)' },
      { zh: '硬盘有多大？', pinyin: 'yìngpán yǒu duō dà?', phonetic: 'ying-pahn yo dwaw dah', en: 'How big is the storage?', note: '硬盘 = disk / storage' },
      { zh: '系统是中文还是英文？', pinyin: 'xìtǒng shì Zhōngwén háishi Yīngwén?', phonetic: 'shee-tong shr jong-wun hi-shr ying-wun', en: 'Is the system in Chinese or English?' },
      { zh: '能不能装英文系统？', pinyin: 'néng bu néng zhuāng Yīngwén xìtǒng?', phonetic: 'nung boo nung jwahng ying-wun shee-tong', en: 'Can you install an English system?', note: 'Ask before you buy' },
      { zh: '这个多少钱？', pinyin: 'zhège duōshao qián?', phonetic: 'juh-guh dwaw-shaow chyehn', en: 'How much is this?' },
      { zh: '太贵了', pinyin: 'tài guì le', phonetic: 'tie gway luh', en: "It's too expensive", note: 'Say it with a smile while bargaining' },
      { zh: '可以便宜一点吗？', pinyin: 'kěyǐ piányi yìdiǎn ma?', phonetic: 'kuh-yee pyehn-yee ee-dyehn mah', en: 'Can you make it a bit cheaper?', note: '便宜 = cheap' },
      { zh: '我要这个', pinyin: 'wǒ yào zhège', phonetic: 'waw yow juh-guh', en: "I'll take this one", note: 'Point at the item' },
      { zh: '这个是全新的吗？', pinyin: 'zhège shì quánxīn de ma?', phonetic: 'juh-guh shr chwahn-sheen duh mah', en: 'Is this brand new?', note: '全新 = brand new' },
      { zh: '有没有二手的？', pinyin: 'yǒu méiyǒu èrshǒu de?', phonetic: 'yo may-yo ar-show duh', en: 'Do you have second-hand ones?', note: '二手 = second-hand (check Xianyu too)' },
      { zh: '有没有保修？', pinyin: 'yǒu méiyǒu bǎoxiū?', phonetic: 'yo may-yo baow-shyo', en: 'Is there a warranty?', note: '保修 = warranty' },
      { zh: '保修多久？', pinyin: 'bǎoxiū duō jiǔ?', phonetic: 'baow-shyo dwaw jyo', en: 'How long is the warranty?' },
      { zh: '可以帮我测试一下吗？', pinyin: 'kěyǐ bāng wǒ cèshì yíxià ma?', phonetic: 'kuh-yee bahng waw tsuh-shr ee-shyah mah', en: 'Can you test it for me?', note: '测试 = test' },
      { zh: '可以开发票吗？', pinyin: 'kěyǐ kāi fāpiào ma?', phonetic: 'kuh-yee kie fah-pyaow mah', en: 'Can you issue a receipt (fapiao)?', note: '发票 = official tax invoice' },
      { zh: '可以微信支付吗？', pinyin: 'kěyǐ Wēixìn zhīfù ma?', phonetic: 'kuh-yee way-sheen jr-foo mah', en: 'Can I pay with WeChat?' },
      { zh: '可以用支付宝吗？', pinyin: 'kěyǐ yòng Zhīfùbǎo ma?', phonetic: 'kuh-yee yong jr-foo-baow mah', en: 'Can I pay with Alipay?' },
      { zh: '可以刷卡吗？', pinyin: 'kěyǐ shuākǎ ma?', phonetic: 'kuh-yee shwah-kah mah', en: 'Can I pay by card?', note: '刷卡 = swipe a card' }
    ]
  };

  var ns = global.Phrasebook = global.Phrasebook || {};
  ns.CATEGORIES = CATEGORIES;
  ns.PHRASES = PHRASES;
})(typeof window !== 'undefined' ? window : this);
