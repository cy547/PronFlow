import type { Material, Scene } from '../../types'

/** 点餐吃饭：餐厅 / 快餐 / 咖啡店 / 外卖 */
export const foodScene: { scene: Scene; materials: Material[] } = {
  scene: { id: 'food', name: '点餐吃饭', nameEn: 'Eating Out', icon: '🍔', desc: '餐厅点单、快餐、咖啡店、打包外卖' },
  materials: [
    /* ================= 单词 ================= */
    {
      type: 'word', id: 'food-w1', sceneId: 'food', en: 'order', pos: 'v./n.',
      ipaUS: '/ˈɔːrdər/', ipaUK: '/ˈɔːdə/', zh: '点单、点的东西', spokenLevel: 'high',
      note: '点餐最核心的词，"点东西"直接说 order，不用 say',
      examples: [
        { en: 'Are you ready to order?', zh: '您准备好点餐了吗？' },
        { en: 'I think they got my order wrong.', zh: '我觉得他们把我的单弄错了。' },
      ],
      variants: [
        { level: '简单', en: 'choose food', zh: '选吃的（生硬，不地道）', },
        { level: '地道', en: 'grab', zh: '顺手买一份，很随口', },
      ],
    },
    {
      type: 'word', id: 'food-w2', sceneId: 'food', en: 'menu', pos: 'n.',
      ipaUS: '/ˈmenjuː/', ipaUK: '/ˈmenjuː/', zh: '菜单', spokenLevel: 'high',
      examples: [
        { en: 'Can I see the menu, please?', zh: '能看下菜单吗？' },
      ],
      variants: [
        { level: '地道', en: 'the specials', zh: '今日特色菜', },
      ],
    },
    {
      type: 'word', id: 'food-w3', sceneId: 'food', en: 'combo', pos: 'n.',
      ipaUS: '/ˈkɑːmboʊ/', ipaUK: '/ˈkɒmbəʊ/', zh: '套餐', spokenLevel: 'high',
      note: '快餐店说套餐就说 combo，也可以说 combo meal',
      examples: [{ en: 'I want combo number three.', zh: '我要三号套餐。' }],
      variants: [
        { level: '简单', en: 'set meal', zh: '套餐（英式常用）' },
        { level: '地道', en: 'value meal', zh: '超值套餐' },
      ],
    },
    {
      type: 'word', id: 'food-w4', sceneId: 'food', en: 'fries', pos: 'n.',
      ipaUS: '/fraɪz/', ipaUK: '/fraɪz/', zh: '薯条', spokenLevel: 'high',
      note: '正式名叫 French fries，口语里一般只说 fries',
      examples: [{ en: 'Small fries, please.', zh: '小份薯条，谢谢。' }],
      variants: [{ level: '地道', en: 'chips', zh: '薯条（英式说法）' }],
    },
    {
      type: 'word', id: 'food-w5', sceneId: 'food', en: 'takeout', pos: 'n.',
      ipaUS: '/ˈteɪkaʊt/', ipaUK: '/ˈteɪkaʊt/', zh: '外带、外卖', spokenLevel: 'high',
      note: '美式说 takeout，英式说 takeaway；"打包带走"用 to go',
      examples: [{ en: 'Let\'s just order takeout tonight.', zh: '今晚就叫外卖吧。' }],
      variants: [
        { level: '日常', en: 'takeaway', zh: '外带（英式）' },
        { level: '地道', en: 'delivery', zh: '送上门的外卖' },
      ],
    },
    {
      type: 'word', id: 'food-w6', sceneId: 'food', en: 'check', pos: 'n.',
      ipaUS: '/tʃek/', ipaUK: '/tʃek/', zh: '账单（美式）', spokenLevel: 'high',
      note: '美式结账说 check，英式说 bill——别把 check 理解成"检查"',
      examples: [{ en: 'Could we get the check?', zh: '能结账吗？' }],
      variants: [{ level: '日常', en: 'bill', zh: '账单（英式）' }],
    },
    {
      type: 'word', id: 'food-w7', sceneId: 'food', en: 'tip', pos: 'n./v.',
      ipaUS: '/tɪp/', ipaUK: '/tɪp/', zh: '小费；给小费', spokenLevel: 'ok',
      examples: [{ en: 'Do you tip in this country?', zh: '这个国家要给小费吗？' }],
      variants: [{ level: '地道', en: 'gratuity', zh: '小费（正式场合/账单上写法）' }],
    },
    {
      type: 'word', id: 'food-w8', sceneId: 'food', en: 'straw', pos: 'n.',
      ipaUS: '/strɔː/', ipaUK: '/strɔː/', zh: '吸管', spokenLevel: 'ok',
      note: '要吸管说 "Can I get a straw?"，很多店默认不给',
      examples: [{ en: 'Can I get a straw for this?', zh: '这个能给我根吸管吗？' }],
      variants: [{ level: '简单', en: 'drinking straw', zh: '吸管（完整说法）' }],
    },
    {
      type: 'word', id: 'food-w9', sceneId: 'food', en: 'spicy', pos: 'adj.',
      ipaUS: '/ˈspaɪsi/', ipaUK: '/ˈspaɪsi/', zh: '辣的', spokenLevel: 'high',
      examples: [{ en: 'Is this dish spicy?', zh: '这道菜辣吗？' }],
      variants: [
        { level: '简单', en: 'hot', zh: '辣的（也指烫，看语境）' },
        { level: '地道', en: 'mouth-burning', zh: '辣到嘴烧的（夸张说法）' },
      ],
    },
    {
      type: 'word', id: 'food-w10', sceneId: 'food', en: 'refill', pos: 'n./v.',
      ipaUS: '/ˈriːfɪl/', ipaUK: '/ˌriːˈfɪl/', zh: '续杯', spokenLevel: 'ok',
      note: '美式很多店软饮免费续杯，直接说 refill',
      examples: [{ en: 'Free refills here!', zh: '这里续杯免费！' }],
      variants: [{ level: '简单', en: 'more drink', zh: '再来点喝的（绕弯说法）' }],
    },
    {
      type: 'word', id: 'food-w11', sceneId: 'food', en: 'leftovers', pos: 'n.',
      ipaUS: '/ˈleftoʊvərz/', ipaUK: '/ˈleftəʊvəz/', zh: '剩饭剩菜', spokenLevel: 'ok',
      note: '"打包剩菜"说 box the leftovers / wrap it up',
      examples: [{ en: 'I had leftovers for lunch.', zh: '我午饭吃的剩菜。' }],
      variants: [{ level: '地道', en: 'doggy bag', zh: '打包袋（幽默说法）' }],
    },
    {
      type: 'word', id: 'food-w12', sceneId: 'food', en: 'starving', pos: 'adj.',
      ipaUS: '/ˈstɑːrvɪŋ/', ipaUK: '/ˈstɑːvɪŋ/', zh: '饿疯了的', spokenLevel: 'high',
      note: '“我饿了”最口语的说法不是 I\'m hungry，而是 I\'m starving（夸张）',
      examples: [{ en: 'I\'m starving, let\'s eat now!', zh: '我饿死了，赶紧吃吧！' }],
      variants: [
        { level: '简单', en: 'hungry', zh: '饿的（中性）' },
        { level: '地道', en: 'famished', zh: '饿极了的（略夸张幽默）' },
      ],
    },
    {
      type: 'word', id: 'food-w13', sceneId: 'food', en: 'delicious', pos: 'adj.',
      ipaUS: '/dɪˈlɪʃəs/', ipaUK: '/dɪˈlɪʃəs/', zh: '好吃的', spokenLevel: 'high',
      examples: [{ en: 'This soup is delicious!', zh: '这汤太好喝了！' }],
      variants: [
        { level: '日常', en: 'tasty', zh: '好吃的（更随口）' },
        { level: '地道', en: 'to die for', zh: '好吃到不行（夸张）' },
      ],
    },
    {
      type: 'word', id: 'food-w14', sceneId: 'food', en: 'mild', pos: 'adj.',
      ipaUS: '/maɪld/', ipaUK: '/maɪld/', zh: '不辣的、清淡的', spokenLevel: 'ok',
      note: '怕辣就点 mild，中辣 medium，特辣 hot/extra spicy',
      examples: [{ en: 'Make it mild, please.', zh: '请做不辣的。' }],
      variants: [{ level: '简单', en: 'not spicy', zh: '不辣的' }],
    },
    /* ================= 短语 ================= */
    {
      type: 'phrase', id: 'food-p1', sceneId: 'food', en: 'for here or to go',
      ipaUS: '/fər ˈhɪr ɔːr tə ˈɡoʊ/', ipaUK: '/fə ˈhɪə ɔː tə ˈɡəʊ/',
      zh: '堂食还是带走', spokenLevel: 'high',
      note: '店员问你的；回答 To go, please. 或 For here.',
      examples: [{ en: '—For here or to go? —To go, please.', zh: '——堂食还是带走？——带走，谢谢。' }],
      variants: [{ level: '地道', en: 'eat in or take away', zh: '堂食还是外带（英式问法）' }],
    },
    {
      type: 'phrase', id: 'food-p2', sceneId: 'food', en: 'on the side',
      ipaUS: '/ɑːn ðə ˈsaɪd/', ipaUK: '/ɒn ðə ˈsaɪd/',
      zh: '（酱料）分开单放', spokenLevel: 'ok',
      examples: [{ en: 'Salad dressing on the side, please.', zh: '沙拉酱分开放，谢谢。' }],
      variants: [{ level: '简单', en: 'put sauce separately', zh: '酱分开装（绕弯说法）' }],
    },
    {
      type: 'phrase', id: 'food-p3', sceneId: 'food', en: 'grab a bite',
      ipaUS: '/ɡræb ə baɪt/', ipaUK: '/ɡræb ə baɪt/',
      zh: '随便吃点', spokenLevel: 'high',
      note: '约饭最常用的说法，比 have a meal 自然十倍',
      examples: [{ en: 'Let\'s grab a bite after work.', zh: '下班后我们去吃点东西吧。' }],
      variants: [
        { level: '简单', en: 'eat something', zh: '吃点东西' },
        { level: '地道', en: 'grab some grub', zh: '觅食去（更俏皮）' },
      ],
    },
    {
      type: 'phrase', id: 'food-p4', sceneId: 'food', en: 'my treat',
      ipaUS: '/maɪ triːt/', ipaUK: '/maɪ triːt/',
      zh: '我请客', spokenLevel: 'high',
      examples: [{ en: 'Put your wallet away, my treat.', zh: '把钱包收起来，我请客。' }],
      variants: [
        { level: '日常', en: 'It\'s on me.', zh: '算我的。' },
        { level: '地道', en: 'Dinner\'s on me tonight.', zh: '今晚晚饭我包了。' },
      ],
    },
    {
      type: 'phrase', id: 'food-p5', sceneId: 'food', en: 'split the bill',
      ipaUS: '/splɪt ðə bɪl/', ipaUK: '/splɪt ðə bɪl/',
      zh: 'AA 制、分摊账单', spokenLevel: 'high',
      examples: [{ en: 'Shall we split the bill?', zh: '我们 AA 吧？' }],
      variants: [
        { level: '日常', en: 'go Dutch', zh: '各付各的（老式说法）' },
        { level: '地道', en: 'go halfsies', zh: '一人一半（俏皮）' },
      ],
    },
    {
      type: 'phrase', id: 'food-p6', sceneId: 'food', en: 'make it two',
      ipaUS: '/meɪk ɪt tuː/', ipaUK: '/meɪk ɪt tuː/',
      zh: '来两份（一样的）', spokenLevel: 'high',
      note: '听到别人点了你也想要，直接说 Make it two!',
      examples: [{ en: 'That looks good—make it two, please.', zh: '那个看起来不错——也给我来一份。' }],
      variants: [{ level: '简单', en: 'two of the same, please', zh: '同样来两份' }],
    },
    {
      type: 'phrase', id: 'food-p7', sceneId: 'food', en: 'to stay',
      ipaUS: '/tə steɪ/', ipaUK: '/tə steɪ/',
      zh: '在店里吃（堂食）', spokenLevel: 'ok',
      note: '咖啡店常问 to stay or to go',
      examples: [{ en: 'One latte, to stay.', zh: '一杯拿铁，在这喝。' }],
      variants: [{ level: '日常', en: 'for here', zh: '堂食（快餐常用）' }],
    },
    {
      type: 'phrase', id: 'food-p8', sceneId: 'food', en: 'same as usual',
      ipaUS: '/seɪm əz ˈjuːʒuəl/', ipaUK: '/seɪm əz ˈjuːʒʊəl/',
      zh: '老样子、老规矩', spokenLevel: 'ok',
      note: '熟客对店员说，瞬间变本地人',
      examples: [{ en: 'The usual, please.—You got it.', zh: '——老样子。——好嘞。' }],
      variants: [{ level: '地道', en: 'the usual', zh: '老样子（更简短）' }],
    },
    {
      type: 'phrase', id: 'food-p9', sceneId: 'food', en: 'wrap it up',
      ipaUS: '/ræp ɪt ʌp/', ipaUK: '/ræp ɪt ʌp/',
      zh: '帮我打包（剩菜）', spokenLevel: 'high',
      examples: [{ en: 'I can\'t finish this. Could you wrap it up?', zh: '我吃不完了，能帮我打包吗？' }],
      variants: [
        { level: '简单', en: 'box it, please', zh: '请装盒' },
        { level: '地道', en: 'box it up', zh: '装盒吧' },
      ],
    },
    {
      type: 'phrase', id: 'food-p10', sceneId: 'food', en: 'I don\'t do spicy',
      ipaUS: '/aɪ doʊnt duː ˈspaɪsi/', ipaUK: '/aɪ dəʊnt duː ˈspaɪsi/',
      zh: '我不吃辣', spokenLevel: 'high',
      note: '"do + 食物"表示饮食习惯，超地道；书面千万别这么写',
      examples: [{ en: 'I don\'t do spicy, sorry.', zh: '我不吃辣，抱歉。' }],
      variants: [{ level: '简单', en: 'I can\'t eat spicy food.', zh: '我不能吃辣。' }],
    },
    /* ================= 句子 ================= */
    {
      type: 'sentence', id: 'food-s1', sceneId: 'food',
      en: 'Could I get a cheeseburger and a small fries?',
      zh: '能给我来一个芝士汉堡和小份薯条吗？', spokenLevel: 'high',
      note: '点单万能句式：Could I get + 东西，比 I want 礼貌自然',
      examples: [
        { en: '—Could I get a cheeseburger and a small fries? —Sure, for here or to go?', zh: '——能来个芝士汉堡和小薯条吗？——好，堂食还是带走？' },
      ],
      variants: [
        { level: '简单', en: 'I want a cheeseburger and fries.', zh: '我要一个芝士汉堡和薯条。' },
        { level: '日常', en: 'Can I have a cheeseburger and small fries?', zh: '可以给我芝士汉堡和小薯条吗？' },
        { level: '地道', en: 'I\'ll go with a cheeseburger and small fries.', zh: '那就芝士汉堡加小薯条吧。' },
      ],
      breakdown: [
        { en: 'Could I get', zh: '能不能给我来' },
        { en: 'a cheeseburger', zh: '一个芝士汉堡' },
        { en: 'and a small fries', zh: '和一份小薯条' },
      ],
      linking: 'Could‿I *get‿a cheeseburger and‿a *small *fries?',
      template: {
        pattern: 'Could I get {item} and {side}?',
        slots: [
          { key: 'item', label: '主食', options: ['a cheeseburger', 'a chicken wrap', 'a beef bowl', 'a tuna sandwich'] },
          { key: 'side', label: '配餐/饮料', options: ['a small fries', 'a side salad', 'an iced tea', 'a cup of soup'] },
        ],
      },
    },
    {
      type: 'sentence', id: 'food-s2', sceneId: 'food',
      en: 'Two cheeseburgers to go, please.',
      zh: '两个芝士汉堡，打包带走，谢谢。', spokenLevel: 'high',
      examples: [
        { en: '—Two cheeseburgers to go, please. —That\'ll be eight bucks.', zh: '——两个芝士汉堡打包。——一共 8 美元。' },
      ],
      variants: [
        { level: '简单', en: 'I want two cheeseburgers for takeout.', zh: '我要两个芝士汉堡外带。' },
        { level: '地道', en: 'Two cheeseburgers, and I\'m taking them to go.', zh: '两个芝士汉堡，我带走。' },
      ],
      breakdown: [
        { en: 'Two cheeseburgers', zh: '两个芝士汉堡' },
        { en: 'to go', zh: '打包带走' },
        { en: 'please', zh: '麻烦了' },
      ],
      linking: 'Two cheeseburgers *to *go, *please.',
      template: {
        pattern: '{num} {food} to go, please.',
        slots: [
          { key: 'num', label: '数量', options: ['One', 'Two', 'Three'] },
          { key: 'food', label: '食物', options: ['cheeseburger(s)', 'chicken roll(s)', 'bubble tea(s)', 'beef noodle bowls'] },
        ],
      },
    },
    {
      type: 'sentence', id: 'food-s3', sceneId: 'food',
      en: 'Could we get the check, please?',
      zh: '麻烦结一下账。', spokenLevel: 'high',
      note: '美式说 check，英式说 bill；简单版直接 Check, please!',
      examples: [
        { en: '—Could we get the check, please? —Sure, I\'ll bring it right over.', zh: '——麻烦结账。——好，马上拿来。' },
      ],
      variants: [
        { level: '简单', en: 'Check, please!', zh: '结账！（最简短）' },
        { level: '日常', en: 'Can we have the bill, please?', zh: '可以给我们账单吗？（英式）' },
        { level: '地道', en: 'Whenever you\'re ready, we\'d love the check.', zh: '您方便时我们想结账（超礼貌）' },
      ],
      breakdown: [
        { en: 'Could we get', zh: '能给我们' },
        { en: 'the check', zh: '账单' },
        { en: 'please', zh: '麻烦了' },
      ],
      linking: 'Could *we *get the *check, *please?',
    },
    {
      type: 'sentence', id: 'food-s4', sceneId: 'food',
      en: 'Is this dish very spicy?',
      zh: '这道菜很辣吗？', spokenLevel: 'high',
      examples: [
        { en: '—Is this dish very spicy? —Just a little, don\'t worry.', zh: '——这道菜很辣吗？——只有一点点，放心。' },
      ],
      variants: [
        { level: '简单', en: 'Is this spicy?', zh: '这个辣吗？' },
        { level: '地道', en: 'How spicy are we talking?', zh: '到底有多辣？（口语感拉满）' },
      ],
      breakdown: [
        { en: 'Is this dish', zh: '这道菜' },
        { en: 'very spicy', zh: '很辣吗' },
      ],
      linking: 'Is *this *dish *very *spicy?',
      template: {
        pattern: 'Is this dish {adj}?',
        slots: [
          { key: 'adj', label: '特点', options: ['spicy', 'salty', 'sweet', 'sour', 'greasy'] },
        ],
      },
    },
    {
      type: 'sentence', id: 'food-s5', sceneId: 'food',
      en: 'Can I get this to go, please?',
      zh: '这个能帮我打包吗？', spokenLevel: 'high',
      examples: [
        { en: '—Can I get this to go, please? —Of course, one moment.', zh: '——这个能打包吗？——当然，稍等。' },
      ],
      variants: [
        { level: '简单', en: 'Please pack it for me.', zh: '请帮我打包。' },
        { level: '地道', en: 'Could you box this up for me?', zh: '能帮我装盒吗？' },
      ],
      breakdown: [
        { en: 'Can I get this', zh: '这个能' },
        { en: 'to go', zh: '打包带走吗' },
      ],
      linking: 'Can‿I *get *this *to *go, *please?',
    },
    {
      type: 'sentence', id: 'food-s6', sceneId: 'food',
      en: 'Could I get a refill on this?',
      zh: '这个能帮我续杯吗？', spokenLevel: 'ok',
      examples: [
        { en: '—Could I get a refill on this? —Sure, refills are free.', zh: '——能续杯吗？——可以，续杯免费。' },
      ],
      variants: [
        { level: '简单', en: 'More drink, please.', zh: '再给我点喝的。' },
        { level: '地道', en: 'Any chance I can top this up?', zh: '能帮我加满吗？' },
      ],
      breakdown: [
        { en: 'Could I get', zh: '能不能来' },
        { en: 'a refill', zh: '续杯' },
        { en: 'on this', zh: '（针对）这个' },
      ],
      linking: 'Could‿I *get‿a *refill‿on *this?',
    },
    {
      type: 'sentence', id: 'food-s7', sceneId: 'food',
      en: 'Can we split the bill five ways?',
      zh: '我们五个人 AA 行吗？', spokenLevel: 'ok',
      examples: [
        { en: '—Can we split the bill five ways? —No problem, I\'ll work it out.', zh: '——我们五个人 AA 行吗？——没问题，我来算。' },
      ],
      variants: [
        { level: '简单', en: 'Let\'s each pay our own.', zh: '我们各付各的吧。' },
        { level: '地道', en: 'Let\'s just go halves on everything.', zh: '我们全部一人一半吧。' },
      ],
      breakdown: [
        { en: 'Can we split', zh: '我们能分开付' },
        { en: 'the bill', zh: '账单' },
        { en: 'five ways', zh: '分成五份吗' },
      ],
      linking: 'Can *we *split the *bill *five *ways?',
      template: {
        pattern: 'Can we split the bill {num} ways?',
        slots: [{ key: 'num', label: '人数', options: ['two', 'three', 'four', 'five', 'six'] }],
      },
    },
    {
      type: 'sentence', id: 'food-s8', sceneId: 'food',
      en: 'Can I get that without onions?',
      zh: '这个能不要放洋葱吗？', spokenLevel: 'high',
      note: '挑食/忌口万能句：without + 不要的东西',
      examples: [
        { en: '—Can I get that without onions? —No onions, got it.', zh: '——不要洋葱。——不放洋葱，收到。' },
      ],
      variants: [
        { level: '简单', en: 'No onions, please.', zh: '请不要放洋葱。' },
        { level: '地道', en: 'Hold the onions for me, thanks.', zh: '帮我免了洋葱，谢谢。' },
      ],
      breakdown: [
        { en: 'Can I get that', zh: '那个能' },
        { en: 'without onions', zh: '不放洋葱吗' },
      ],
      linking: 'Can‿I *get *that *with*(w)out *onions?',
      template: {
        pattern: 'Can I get that without {thing}?',
        slots: [{ key: 'thing', label: '忌口食材', options: ['onions', 'cilantro', 'peanuts', 'ice', 'sugar'] }],
      },
    },
    {
      type: 'sentence', id: 'food-s9', sceneId: 'food',
      en: 'Could we get a table for two?',
      zh: '能给我们一张两人桌吗？', spokenLevel: 'high',
      examples: [
        { en: '—Good evening! Could we get a table for two? —Of course, right this way.', zh: '——晚上好！两位的桌子？——当然，这边请。' },
      ],
      variants: [
        { level: '简单', en: 'A table for two, please.', zh: '两位，谢谢。' },
        { level: '地道', en: 'Just two of us tonight.', zh: '我们今晚就两个人。' },
      ],
      breakdown: [
        { en: 'Could we get', zh: '能给我们' },
        { en: 'a table for two', zh: '一张两人桌吗' },
      ],
      linking: 'Could *we *get‿a *table *for *two?',
      template: {
        pattern: 'Could we get a table for {num}?',
        slots: [{ key: 'num', label: '人数', options: ['one', 'two', 'three', 'four', 'five', 'six'] }],
      },
    },
    {
      type: 'sentence', id: 'food-s10', sceneId: 'food',
      en: 'It\'s on me this time. You got the last one.',
      zh: '这次我请。上次是你付的。', spokenLevel: 'high',
      examples: [
        { en: '—It\'s on me this time. You got the last one. —Aww, thanks!', zh: '——这次我请，上次你付的。——哎呀，谢谢！' },
      ],
      variants: [
        { level: '简单', en: 'I\'ll pay this time.', zh: '这次我来付。' },
        { level: '地道', en: 'My treat—you covered last time.', zh: '我请——上次你请过了。' },
      ],
      breakdown: [
        { en: 'It\'s on me this time', zh: '这次算我的' },
        { en: 'You got the last one', zh: '上次是你付的' },
      ],
      linking: 'It\'s‿on *me *this *time. *You *got the *last‿one.',
    },
    {
      type: 'sentence', id: 'food-s11', sceneId: 'food',
      en: 'I\'ll have the same as her.',
      zh: '我和她点一样的。', spokenLevel: 'high',
      examples: [
        { en: '—I\'ll have the same as her. —Two pastas, coming up.', zh: '——我和她一样。——两份意面，马上来。' },
      ],
      variants: [
        { level: '简单', en: 'Same for me, please.', zh: '我也一样，谢谢。' },
        { level: '地道', en: 'Make it two of those.', zh: '那个也给我来一份。' },
      ],
      breakdown: [
        { en: 'I\'ll have', zh: '我要' },
        { en: 'the same as her', zh: '和她一样的' },
      ],
      linking: 'I\'ll *have the *same‿as *her.',
    },
    {
      type: 'sentence', id: 'food-s12', sceneId: 'food',
      en: 'Everything was delicious. Thank you so much!',
      zh: '每一道都超好吃，太感谢了！', spokenLevel: 'high',
      examples: [
        { en: '—Everything was delicious. Thank you so much! —We\'re glad you enjoyed it!', zh: '——每道菜都很好吃，谢谢！——很高兴你们吃得开心！' },
      ],
      variants: [
        { level: '简单', en: 'The food was great, thanks!', zh: '菜很棒，谢谢！' },
        { level: '地道', en: 'That meal absolutely hit the spot.', zh: '这顿饭太满足了。' },
      ],
      breakdown: [
        { en: 'Everything was delicious', zh: '每样都好吃' },
        { en: 'Thank you so much', zh: '非常感谢' },
      ],
      linking: '*Everything *was *delicious. Thank *you *so *much!',
    },
  ],
}
